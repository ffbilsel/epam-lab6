import type { PoolClient } from 'pg';
import { z } from 'zod';
import { pool } from '../infra/db.js';

/** Persisted password_resets row. */
export const ResetRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  token_hash: z.string(),
  issued_at: z.date(),
  expires_at: z.date(),
  consumed_at: z.date().nullable(),
});
/** Persisted password_resets row type. */
export type ResetRow = z.infer<typeof ResetRowSchema>;

type Runner = Pick<PoolClient, 'query'>;
const r = (client?: Runner): Runner => client ?? pool;

/** Insert a new reset request. */
export async function insert(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  client?: Runner,
): Promise<ResetRow> {
  const res = await r(client).query(
    `INSERT INTO password_resets (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, tokenHash, expiresAt],
  );
  return ResetRowSchema.parse(res.rows[0]);
}

/** Find a non-expired, non-consumed reset by its token hash. */
export async function findValidByTokenHash(
  tokenHash: string,
  now: Date,
  client?: Runner,
): Promise<ResetRow | null> {
  const res = await r(client).query(
    `SELECT * FROM password_resets
      WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > $2`,
    [tokenHash, now],
  );
  return res.rows[0] !== undefined ? ResetRowSchema.parse(res.rows[0]) : null;
}

/** Mark a reset consumed. */
export async function markConsumed(id: string, at: Date, client?: Runner): Promise<void> {
  await r(client).query(`UPDATE password_resets SET consumed_at = $2 WHERE id = $1`, [id, at]);
}
