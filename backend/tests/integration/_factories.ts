/**
 * Integration-test factories — Constitution v1.1.0 / Principle V.6.
 *
 * DB-backed equivalents of the unit factories. Every helper inserts fresh
 * rows in the test PostgreSQL container and returns the persisted shape so
 * tests can assert against it.
 *
 * Usage:
 *   import { seedVerifiedUser } from './_factories.js';
 *   const user = await seedVerifiedUser();
 */
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { pool } from '../../src/infra/db.js';
import type { UserRow } from '../../src/repositories/user.repo.js';
import { issueJwtForUser } from '../unit/_factories.js';

interface SeedUserInput {
  email?: string;
  password?: string;
  email_verified_at?: Date | null;
  failed_attempt_count?: number;
  failed_attempt_window_start?: Date | null;
  locked_until?: Date | null;
}

/**
 * Insert an unverified user.
 *
 * @param overrides - partial fields; `password` is hashed with bcrypt cost 4
 *   for test speed (production cost is gated behind env).
 * @returns the persisted `UserRow`.
 */
export async function seedUser(overrides: SeedUserInput = {}): Promise<UserRow> {
  const email = overrides.email ?? `user+${randomUUID().slice(0, 8)}@example.test`;
  const password = overrides.password ?? 'TestPass123';
  const passwordHash = await bcrypt.hash(password, 4);
  const result = await pool.query<UserRow>(
    `INSERT INTO users (
       email, password_hash, email_verified_at,
       failed_attempt_count, failed_attempt_window_start, locked_until
     ) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      email,
      passwordHash,
      overrides.email_verified_at ?? null,
      overrides.failed_attempt_count ?? 0,
      overrides.failed_attempt_window_start ?? null,
      overrides.locked_until ?? null,
    ],
  );
  if (result.rows[0] === undefined) throw new Error('seedUser: insert returned no rows');
  return result.rows[0];
}

/**
 * Insert a verified user (ready for sign-in).
 *
 * @param overrides - partial fields.
 * @returns the persisted `UserRow` with `email_verified_at` set.
 */
export async function seedVerifiedUser(overrides: SeedUserInput = {}): Promise<UserRow> {
  return seedUser({ email_verified_at: new Date(), ...overrides });
}

/**
 * Insert a user currently in the locked state.
 *
 * @param overrides - partial fields.
 * @returns the persisted `UserRow` with `locked_until` 15 minutes in the future.
 */
export async function seedLockedUser(overrides: SeedUserInput = {}): Promise<UserRow> {
  const now = new Date();
  return seedVerifiedUser({
    failed_attempt_count: 10,
    failed_attempt_window_start: now,
    locked_until: new Date(now.getTime() + 15 * 60 * 1000),
    ...overrides,
  });
}

/**
 * Insert an active session row and return the JWT bearer token.
 *
 * @param user - the user the session belongs to.
 * @returns `{ token, jti }` — the bearer token and its session id.
 */
export async function seedActiveSession(
  user: UserRow,
): Promise<{ token: string; jti: string }> {
  const { token, jti, expiresAt } = issueJwtForUser(user, { now: new Date() });
  await pool.query(
    `INSERT INTO sessions (jti, user_id, issued_at, expires_at, revoked_at)
     VALUES ($1, $2, NOW(), $3, NULL)`,
    [jti, user.id, expiresAt],
  );
  return { token, jti };
}

/**
 * Insert an already-expired password-reset token row for the given user.
 *
 * @param user - the user the token belongs to.
 * @returns the raw (un-hashed) token string and its sha-256 hex hash.
 */
export async function seedExpiredResetToken(
  user: UserRow,
): Promise<{ rawToken: string; tokenHash: string }> {
  const { generateToken, hashToken } = await import('../../src/lib/crypto.js');
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const past = new Date(Date.now() - 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO password_resets (user_id, token_hash, expires_at, consumed_at)
     VALUES ($1, $2, $3, NULL)`,
    [user.id, tokenHash, past],
  );
  return { rawToken, tokenHash };
}
