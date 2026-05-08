import type { PoolClient } from 'pg';
import { z } from 'zod';
import { pool } from '../infra/db.js';

/** Persisted user row. */
export const UserRowSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  password_hash: z.string(),
  email_verified_at: z.date().nullable(),
  failed_attempt_count: z.number().int(),
  failed_attempt_window_start: z.date().nullable(),
  locked_until: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});
/** Persisted user row type. */
export type UserRow = z.infer<typeof UserRowSchema>;

type Runner = Pick<PoolClient, 'query'>;

/** Resolve the active query runner. */
function r(client?: Runner): Runner {
  return client ?? pool;
}

/**
 * Look up a user by email (case-insensitive via citext).
 * @param email Email address.
 * @param client Optional pg client.
 */
export async function findByEmail(email: string, client?: Runner): Promise<UserRow | null> {
  const res = await r(client).query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0] !== undefined ? UserRowSchema.parse(res.rows[0]) : null;
}

/**
 * Look up a user by id.
 * @param id User uuid.
 * @param client Optional pg client.
 */
export async function findById(id: string, client?: Runner): Promise<UserRow | null> {
  const res = await r(client).query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0] !== undefined ? UserRowSchema.parse(res.rows[0]) : null;
}

/**
 * Insert a new unverified user.
 * @param email Email.
 * @param passwordHash Bcrypt hash.
 * @param client Optional pg client.
 */
export async function insertUnverified(
  email: string,
  passwordHash: string,
  client?: Runner,
): Promise<UserRow> {
  const res = await r(client).query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2)
     RETURNING *`,
    [email, passwordHash],
  );
  return UserRowSchema.parse(res.rows[0]);
}

/** Mark email verified, clearing lockout counters. */
export async function markEmailVerified(
  userId: string,
  at: Date,
  client?: Runner,
): Promise<void> {
  await r(client).query(
    `UPDATE users
       SET email_verified_at = $2, updated_at = now()
     WHERE id = $1`,
    [userId, at],
  );
}

/** Replace the password hash. */
export async function updatePasswordHash(
  userId: string,
  passwordHash: string,
  client?: Runner,
): Promise<void> {
  await r(client).query(
    `UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1`,
    [userId, passwordHash],
  );
}

/** Clear lockout state and reset counters. */
export async function clearLockout(userId: string, client?: Runner): Promise<void> {
  await r(client).query(
    `UPDATE users
       SET failed_attempt_count = 0,
           failed_attempt_window_start = NULL,
           locked_until = NULL,
           updated_at = now()
     WHERE id = $1`,
    [userId],
  );
}

/** Set lockout `locked_until` and reset counters. */
export async function setLockout(
  userId: string,
  lockedUntil: Date,
  client?: Runner,
): Promise<void> {
  await r(client).query(
    `UPDATE users
       SET locked_until = $2,
           failed_attempt_count = 0,
           failed_attempt_window_start = NULL,
           updated_at = now()
     WHERE id = $1`,
    [userId, lockedUntil],
  );
}

/**
 * Increment the sliding-window failed-attempt counter.
 * Resets the window if the previous window has elapsed.
 * @param userId User id.
 * @param now Current instant.
 * @param windowSeconds Sliding-window length.
 * @param client Optional pg client.
 * @returns The updated user row.
 */
export async function incrementFailedAttempts(
  userId: string,
  now: Date,
  windowSeconds: number,
  client?: Runner,
): Promise<UserRow> {
  const res = await r(client).query(
    `UPDATE users
       SET failed_attempt_count = CASE
             WHEN failed_attempt_window_start IS NULL
               OR failed_attempt_window_start < ($2::timestamptz - ($3 || ' seconds')::interval)
             THEN 1
             ELSE failed_attempt_count + 1
           END,
           failed_attempt_window_start = CASE
             WHEN failed_attempt_window_start IS NULL
               OR failed_attempt_window_start < ($2::timestamptz - ($3 || ' seconds')::interval)
             THEN $2::timestamptz
             ELSE failed_attempt_window_start
           END,
           updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [userId, now, windowSeconds],
  );
  return UserRowSchema.parse(res.rows[0]);
}
