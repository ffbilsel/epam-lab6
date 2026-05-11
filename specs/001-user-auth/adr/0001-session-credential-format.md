# ADR 0001: Session credential format — stateless JWT with server-side `jti` allow-list

- **Status**: Accepted
- **Date**: 2026-05-11
- **Deciders**: 001-user-auth working group
- **Related**: `specs/001-user-auth/spec.md` (FR-007, FR-008, FR-015),
  `specs/001-user-auth/research.md` §1, `specs/001-user-auth/plan.md`

## Context

The user authentication feature has two requirements that pull in opposite
directions:

1. The product brief mandates "JWT for tokens" as the session credential
   format used by clients.
2. The functional spec requires that sign-out invalidates the session
   *immediately* (FR-008) and that any password change invalidates **all**
   active sessions for the account (FR-015). Successful login must also be
   observable within an audit/session table (FR-007).

Pure stateless JWTs cannot satisfy (2): once issued, a signed JWT remains
valid until its `exp` claim regardless of any server-side state change.
Pure opaque/random session identifiers can satisfy (2) trivially but
violate (1).

In addition, the non-functional constraints in `plan.md` require:

- Session-validation latency on the hot path (every authenticated request)
  must stay within the < 200 ms P95 budget already consumed by app logic.
- No additional infrastructure beyond PostgreSQL at v1 (no Redis).
- Operators must be able to rotate the signing key without forcing a global
  sign-out.

## Decision

Issue **HS256-signed JWTs** with the claim set:

```text
{ sub, jti, iat, exp, ver }
```

where:

- `sub` is the user id (UUID),
- `jti` is a server-generated unique session id (UUID v4),
- `iat` / `exp` are seconds-since-epoch and `exp = iat + 24h`,
- `ver` is the credential-format version (currently `1`) so future schema
  changes can be detected without ambiguity.

On every authenticated request the server performs **both** of the
following checks; failing either rejects the request with `401`:

1. **Signature + claim validation** — verify the HS256 signature using
   `JWT_SECRET` (with `JWT_SECRET_PREV` accepted only during a rotation
   overlap window) and assert `exp > now` and `ver === 1`.
2. **Allow-list lookup** — load the `sessions` row keyed by `jti` and
   require it to exist, be unrevoked, and have `expires_at > now`.

Revocation operations write to the `sessions` table only:

- `POST /auth/logout` marks the current `jti` revoked.
- A password change (self-service or via reset) marks **every** session
  row for that `sub` revoked in a single SQL statement.

The token itself is never stored in the database; only the `jti` and its
metadata are persisted.

## Consequences

### Positive

- Satisfies the JWT mandate while still meeting FR-008 and FR-015: a
  revoked `jti` fails check (2) on its very next use, with no waiting for
  `exp`.
- One additional indexed lookup per authenticated request (`SELECT … FROM
  sessions WHERE jti = $1`). At v1 scale this is well under the latency
  budget and shares the existing PostgreSQL pool — no Redis.
- "Invalidate all sessions on password change" is a single
  `UPDATE sessions SET revoked_at = now() WHERE user_id = $1`, atomic with
  the password write in the same transaction.
- Key rotation is supported from day one via `JWT_SECRET_PREV` (verify
  only); no client-visible disruption.
- The `jti` provides a stable correlation id for audit log entries
  (`session.created`, `session.revoked`, `auth.login.success`).

### Negative / trade-offs

- The system is no longer stateless on the auth hot path; a database
  outage breaks authentication. This is acceptable because the same
  outage already breaks every other endpoint that touches user data.
- Storage cost grows linearly with active sessions. Mitigation: a periodic
  job deletes rows where `expires_at < now() - 7 days`.
- Clients must treat the JWT as opaque — they cannot rely on `exp` alone
  to predict validity, because the server may have revoked the `jti`.

### Neutral

- The `ver` claim costs one byte in practice but buys a clean upgrade
  path if we ever move to RS256 or change the claim set.

## Alternatives considered

1. **Pure stateless JWT with short TTL + refresh token.**
   Rejected: cannot meet the exact 24-hour expiry expected by the spec
   without inventing a refresh flow that is explicitly out of scope, and
   still leaves a window in which a stolen access token is usable after
   logout.
2. **Opaque random session identifiers (no JWT).**
   Rejected: violates the explicit "JWT for tokens" requirement from the
   product brief. Technically simpler but not on the table.
3. **JWT with a server-side denylist of revoked `jti`s.**
   Rejected: requires storing every revoked token until its `exp`, which
   is strictly more storage than the allow-list (active sessions are a
   small subset of issued-then-revoked tokens over time) and offers no
   functional advantage.
4. **Asymmetric signing (RS256 / EdDSA).**
   Rejected for v1: there is a single service verifying its own tokens;
   asymmetric keys add operational cost (key distribution, JWKS endpoint)
   with no consumer that benefits. Reconsider if a second service ever
   needs to verify tokens independently.
