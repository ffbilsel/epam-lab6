import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { systemClock, type Clock } from '../infra/clock.js';
import { buildClaims, SessionClaimsSchema, type SessionClaims } from '../domain/token-claims.js';
import * as sessionRepo from '../repositories/session.repo.js';
import { UnauthorizedError } from '../domain/errors.js';

/** Issued session credentials. */
export interface IssuedSession {
  /** Signed JWT. */
  token: string;
  /** UTC instant the token expires. */
  expiresAt: Date;
  /** Server-side session id. */
  jti: string;
}

/** Session API. */
export interface SessionService {
  /** Issue a new session for the user. */
  issue(userId: string): Promise<IssuedSession>;
  /** Verify and decode a raw JWT. */
  verify(rawJwt: string): Promise<SessionClaims>;
  /** Revoke a single session by jti. */
  revoke(jti: string): Promise<void>;
  /** Revoke all active sessions for a user. */
  revokeAllForUser(userId: string): Promise<void>;
}

/** Dependencies. */
export interface SessionDeps {
  /** Clock. */
  clock?: Clock;
}

/**
 * Build the session service. Honors `JWT_SECRET_PREV` for verify-only
 * during a secret rotation window (research.md §2).
 * @param deps Optional dependencies.
 */
export function buildSessionService(deps: SessionDeps = {}): SessionService {
  const clock = deps.clock ?? systemClock;

  return {
    issue: async (userId): Promise<IssuedSession> => {
      const now = clock.now();
      const jti = uuidv4();
      const claims = buildClaims({ userId, jti, now, ttlSeconds: env.JWT_EXPIRES_IN });
      const expiresAt = new Date(claims.exp * 1000);
      const token = jwt.sign(claims, env.JWT_SECRET, { algorithm: 'HS256' });
      await sessionRepo.insert(jti, userId, new Date(claims.iat * 1000), expiresAt);
      return { token, expiresAt, jti };
    },

    verify: async (rawJwt): Promise<SessionClaims> => {
      const secrets = [env.JWT_SECRET, env.JWT_SECRET_PREV].filter((s): s is string => s.length > 0);
      let decoded: unknown = null;
      let lastError: unknown = null;
      for (const secret of secrets) {
        try {
          decoded = jwt.verify(rawJwt, secret, { algorithms: ['HS256'] });
          break;
        } catch (err) {
          lastError = err;
        }
      }
      if (decoded === null) throw new UnauthorizedError('Invalid session token');

      const parsed = SessionClaimsSchema.safeParse(decoded);
      if (!parsed.success) throw new UnauthorizedError('Malformed session token');

      const now = clock.now();
      const active = await sessionRepo.findActive(parsed.data.jti, now);
      if (active === null) throw new UnauthorizedError('Session is not active');
      if (lastError !== null) {
        // No-op: keep type-checker happy while preserving rotation semantics.
      }
      return parsed.data;
    },

    revoke: async (jti): Promise<void> => {
      await sessionRepo.revoke(jti, clock.now());
    },

    revokeAllForUser: async (userId): Promise<void> => {
      await sessionRepo.revokeAllActiveForUser(userId, clock.now());
    },
  };
}
