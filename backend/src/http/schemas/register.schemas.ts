import { z } from 'zod';
import { PasswordSchema } from '../../domain/password-policy.js';

/** POST /auth/register body. */
export const RegisterBodySchema = z.object({
  email: z.string().email().max(254),
  password: PasswordSchema,
});
/** POST /auth/register body type. */
export type RegisterBody = z.infer<typeof RegisterBodySchema>;

/** POST /auth/verify body. */
export const VerifyBodySchema = z.object({
  token: z.string().min(8).max(256),
});
/** POST /auth/verify body type. */
export type VerifyBody = z.infer<typeof VerifyBodySchema>;

/** POST /auth/verify/resend body. */
export const ResendVerifyBodySchema = z.object({
  email: z.string().email().max(254),
});
/** POST /auth/verify/resend body type. */
export type ResendVerifyBody = z.infer<typeof ResendVerifyBodySchema>;
