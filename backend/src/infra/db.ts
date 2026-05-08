import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

/** Shared connection pool. */
export const pool: pg.Pool = new Pool({ connectionString: env.DATABASE_URL });

/**
 * Run `fn` inside a single transaction. Commits on success, rolls back on throw.
 * @param fn Callback receiving a dedicated client.
 * @returns The value returned by `fn`.
 */
export async function withTx<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Close the pool (graceful shutdown). */
export async function closePool(): Promise<void> {
  await pool.end();
}
