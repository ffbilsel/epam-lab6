import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

/**
 * Hash a plaintext password using bcrypt at the configured cost.
 * @param plaintext Raw password (never logged, never persisted).
 */
export async function hash(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, env.BCRYPT_COST);
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 * @param plaintext Raw candidate password.
 * @param stored Stored bcrypt hash.
 */
export async function verify(plaintext: string, stored: string): Promise<boolean> {
  return bcrypt.compare(plaintext, stored);
}

/**
 * Constant-time-ish dummy verify used to equalise timing for unknown accounts.
 * The hash is a precomputed bcrypt value; the comparison runs full bcrypt work.
 */
const DUMMY_HASH = '$2b$12$CwTycUXWue0Thq9StjUM0uJ8t8qZk1xQ0d8rL2t0fS4z5p6JpYJ8C';

/**
 * Equalise timing when no real account exists.
 */
export async function dummyVerify(): Promise<void> {
  await bcrypt.compare('not-a-real-password', DUMMY_HASH).catch(() => undefined);
}
