import { z } from 'zod';
import { PasswordSchema } from '../../domain/password-policy.js';

/** POST /auth/reset/request body. */
export const ResetRequestBodySchema = z.object({
  email: z.string().email().max(254),
});
/** POST /auth/reset/request body type. */
export type ResetRequestBody = z.infer<typeof ResetRequestBodySchema>;

/** POST /auth/reset/confirm body. */
export const ResetConfirmBodySchema = z.object({
  token: z.string().min(8).max(256),
  newPassword: PasswordSchema,
});
/** POST /auth/reset/confirm body type. */
export type ResetConfirmBody = z.infer<typeof ResetConfirmBodySchema>;
