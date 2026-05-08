import type { PoolClient } from 'pg';
import { z } from 'zod';
import { pool } from '../infra/db.js';

/** Persisted session row. */
export const SessionRowSchema = z.object({
  jti: z.string().uuid(),
  user_id: z.string().uuid(),
  issued_at: z.date(),
  expires_at: z.date(),
  revoked_at: z.date().nullable(),
});
/** Persisted session row type. */
export type SessionRow = z.infer<typeof SessionRowSchema>;

type Runner = Pick<PoolClient, 'query'>;
const r = (client?: Runner): Runner => client ?? pool;

/** Insert a new session row. */
export async function insert(
  jti: string,
  userId: string,
  issuedAt: Date,
  expiresAt: Date,
  client?: Runner,
): Promise<SessionRow> {
  const res = await r(client).query(
    `INSERT INTO sessions (jti, user_id, issued_at, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [jti, userId, issuedAt, expiresAt],
  );
  return SessionRowSchema.parse(res.rows[0]);
}

/** Find an active (non-revoked, non-expired) session by its jti. */
export async function findActive(
  jti: string,
  now: Date,
  client?: Runner,
): Promise<SessionRow | null> {
  const res = await r(client).query(
    `SELECT * FROM sessions
      WHERE jti = $1 AND revoked_at IS NULL AND expires_at > $2`,
    [jti, now],
  );
  return res.rows[0] !== undefined ? SessionRowSchema.parse(res.rows[0]) : null;
}

/** Revoke a single session. */
export async function revoke(jti: string, at: Date, client?: Runner): Promise<void> {
  await r(client).query(
    `UPDATE sessions SET revoked_at = $2 WHERE jti = $1 AND revoked_at IS NULL`,
    [jti, at],
  );
}

/** Revoke all active sessions for a user. */
export async function revokeAllActiveForUser(
  userId: string,
  at: Date,
  client?: Runner,
): Promise<void> {
  await r(client).query(
    `UPDATE sessions SET revoked_at = $2 WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId, at],
  );
}
