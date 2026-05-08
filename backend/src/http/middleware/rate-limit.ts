import rateLimit, { type Options } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';

/**
 * Build a per-route rate limiter. Defaults pulled from env.
 * @param overrides Optional overrides for express-rate-limit options.
 */
export function buildRateLimiter(overrides: Partial<Options> = {}): RequestHandler {
  return rateLimit({
    windowMs: env.RATE_LIMIT_AUTH_WINDOW_SECONDS * 1000,
    max: env.RATE_LIMIT_AUTH_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    ...overrides,
  });
}
