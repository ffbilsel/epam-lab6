import { createHash, randomBytes } from 'node:crypto';

/**
 * Generate a cryptographically random 32-byte token, base64url-encoded.
 * Used as the public verification / reset token.
 */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Hash a token with SHA-256 (hex) for at-rest storage.
 * @param raw Raw token as returned by {@link generateToken}.
 */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}
