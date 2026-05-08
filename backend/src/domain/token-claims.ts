import { z } from 'zod';

/** Server-issued JWT claims. */
export const SessionClaimsSchema = z.object({
  sub: z.string().uuid(),
  jti: z.string().uuid(),
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
  ver: z.literal(1),
});
/** Server-issued JWT claims type. */
export type SessionClaims = z.infer<typeof SessionClaimsSchema>;

/** Build claims for a new session. */
export function buildClaims(opts: {
  /** User id. */
  userId: string;
  /** New session id (UUID). */
  jti: string;
  /** Now. */
  now: Date;
  /** Lifetime in seconds. */
  ttlSeconds: number;
}): SessionClaims {
  const iat = Math.floor(opts.now.getTime() / 1000);
  return {
    sub: opts.userId,
    jti: opts.jti,
    iat,
    exp: iat + opts.ttlSeconds,
    ver: 1,
  };
}
