import { z } from 'zod';

/** POST /auth/login body. */
export const LoginBodySchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});
/** POST /auth/login body type. */
export type LoginBody = z.infer<typeof LoginBodySchema>;

/** Login response body. */
export const SessionResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.string(),
});
/** Login response body type. */
export type SessionResponse = z.infer<typeof SessionResponseSchema>;
