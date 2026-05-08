import { z } from 'zod';

/** Result of a password-policy check. */
export interface PolicyResult {
  /** True if the password meets the policy. */
  ok: boolean;
  /** Human-readable reason on failure. */
  reason?: string;
}

const MIN = 8;
const MAX = 128;

/**
 * Validate a password against the project policy
 * (≥ 8 chars, ≤ 128 chars, ≥ 1 letter, ≥ 1 digit).
 * @param password Candidate password.
 */
export function validatePassword(password: string): PolicyResult {
  if (password.length < MIN) return { ok: false, reason: `must be at least ${MIN} characters` };
  if (password.length > MAX) return { ok: false, reason: `must be at most ${MAX} characters` };
  if (!/[A-Za-z]/.test(password)) return { ok: false, reason: 'must contain a letter' };
  if (!/[0-9]/.test(password)) return { ok: false, reason: 'must contain a digit' };
  return { ok: true };
}

/** Zod refinement that enforces the password policy. */
export const PasswordSchema = z
  .string()
  .superRefine((val, ctx) => {
    const r = validatePassword(val);
    if (!r.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.reason ?? 'invalid password' });
    }
  });
