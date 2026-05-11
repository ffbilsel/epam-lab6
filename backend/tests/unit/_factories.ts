/**
 * Unit-test factories — Constitution v1.1.0 / Principle V.6.
 *
 * Pure in-memory builders for domain objects used by service-level unit tests.
 * Each factory returns a *fresh* object every call so tests cannot share
 * mutable state (V.5).
 *
 * Do NOT call these from integration/E2E tests; use
 * `tests/integration/_factories.ts` for DB-backed equivalents.
 */
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { UserRow } from '../../src/repositories/user.repo.js';
import {
  type Mailer,
  type OutgoingEmail,
  createJsonMailer,
} from '../../src/infra/mailer.js';

/** A fixed reference timestamp used by factories so tests are deterministic. */
const FIXED_NOW = new Date('2026-01-01T00:00:00.000Z');

/**
 * Build an unverified user row.
 *
 * @param overrides - partial fields to merge over the defaults.
 * @returns a fresh `UserRow` object.
 */
export function createTestUser(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: randomUUID(),
    email: `user+${randomUUID().slice(0, 8)}@example.test`,
    password_hash: '$2b$12$abcdefghijklmnopqrstuvCMOP9pl4S7gqDc0YyZcPSbU3rZ.cMfBC',
    email_verified_at: null,
    failed_attempt_count: 0,
    failed_attempt_window_start: null,
    locked_until: null,
    created_at: FIXED_NOW,
    updated_at: FIXED_NOW,
    ...overrides,
  };
}

/**
 * Build a verified user row.
 *
 * @param overrides - partial fields to merge over the defaults.
 * @returns a fresh `UserRow` whose `email_verified_at` is set.
 */
export function createVerifiedUser(overrides: Partial<UserRow> = {}): UserRow {
  return createTestUser({ email_verified_at: FIXED_NOW, ...overrides });
}

/**
 * Build a locked user row (lockout expires 15 minutes after `FIXED_NOW`).
 *
 * @param overrides - partial fields to merge over the defaults.
 * @returns a fresh `UserRow` whose `locked_until` is in the future.
 */
export function createLockedUser(overrides: Partial<UserRow> = {}): UserRow {
  const lockedUntil = new Date(FIXED_NOW.getTime() + 15 * 60 * 1000);
  return createVerifiedUser({
    failed_attempt_count: 10,
    failed_attempt_window_start: FIXED_NOW,
    locked_until: lockedUntil,
    ...overrides,
  });
}

/**
 * Sign a JWT with the same claim shape used in production.
 *
 * @param user - the user to issue the token for.
 * @param opts - optional secret / ttl overrides for negative tests.
 * @returns the signed bearer token plus the `jti` and `expiresAt` for assertions.
 */
export function issueJwtForUser(
  user: UserRow,
  opts: { secret?: string; ttlSeconds?: number; jti?: string; now?: Date } = {},
): { token: string; jti: string; expiresAt: Date } {
  const secret = opts.secret ?? 'test-secret-test-secret-test-secret-12';
  const ttlSeconds = opts.ttlSeconds ?? 24 * 60 * 60;
  const jti = opts.jti ?? randomUUID();
  const now = opts.now ?? FIXED_NOW;
  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + ttlSeconds;
  const token = jwt.sign(
    { sub: user.id, jti, iat, exp, ver: 1 },
    secret,
    { algorithm: 'HS256', noTimestamp: true },
  );
  return { token, jti, expiresAt: new Date(exp * 1000) };
}

/**
 * Build a JSON-transport mailer that records every dispatched email.
 *
 * @returns a fresh mailer instance with a `sent` array for assertions.
 */
export function setupMockMailer(): Mailer & { readonly sent: OutgoingEmail[] } {
  return createJsonMailer();
}

/** Re-export the canonical fixed-now value so tests can derive timestamps. */
export const fixedNow = FIXED_NOW;
