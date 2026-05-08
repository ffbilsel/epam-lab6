import type { PoolClient } from 'pg';
import { z } from 'zod';
import { pool } from '../infra/db.js';

/** Persisted email_verifications row. */
export const VerificationRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  token_hash: z.string(),
  issued_at: z.date(),
  expires_at: z.date(),
  consumed_at: z.date().nullable(),
});
/** Persisted email_verifications row type. */
export type VerificationRow = z.infer<typeof VerificationRowSchema>;

type Runner = Pick<PoolClient, 'query'>;
const r = (client?: Runner): Runner => client ?? pool;

/** Insert a new verification token. */
export async function insert(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  client?: Runner,
): Promise<VerificationRow> {
  const res = await r(client).query(
    `INSERT INTO email_verifications (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, tokenHash, expiresAt],
  );
  return VerificationRowSchema.parse(res.rows[0]);
}

/** Find a non-expired, non-consumed token by its hash. */
export async function findValidByTokenHash(
  tokenHash: string,
  now: Date,
  client?: Runner,
): Promise<VerificationRow | null> {
  const res = await r(client).query(
    `SELECT * FROM email_verifications
      WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > $2`,
    [tokenHash, now],
  );
  return res.rows[0] !== undefined ? VerificationRowSchema.parse(res.rows[0]) : null;
}

/** Mark a verification consumed. */
export async function markConsumed(id: string, at: Date, client?: Runner): Promise<void> {
  await r(client).query(`UPDATE email_verifications SET consumed_at = $2 WHERE id = $1`, [id, at]);
}

/** Invalidate all live tokens for a user (set consumed_at = now). */
export async function invalidateAllForUser(
  userId: string,
  at: Date,
  client?: Runner,
): Promise<void> {
  await r(client).query(
    `UPDATE email_verifications
        SET consumed_at = $2
      WHERE user_id = $1 AND consumed_at IS NULL`,
    [userId, at],
  );
}
