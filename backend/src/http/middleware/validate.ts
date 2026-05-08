import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from '../../domain/errors.js';

/** Per-segment Zod schemas. */
export interface ValidateOptions {
  /** Schema for `req.body`. */
  body?: ZodTypeAny;
  /** Schema for `req.query`. */
  query?: ZodTypeAny;
  /** Schema for `req.params`. */
  params?: ZodTypeAny;
}

/**
 * Build a request validator that parses the configured request segments
 * with Zod. On failure, throws {@link ValidationError} so the error
 * middleware can map it to RFC 7807.
 * @param opts Schemas to apply.
 */
export function validate(opts: ValidateOptions): RequestHandler {
  return (req, _res, next): void => {
    try {
      if (opts.body !== undefined) {
        const r = opts.body.safeParse(req.body);
        if (!r.success) throw new ValidationError('Invalid body', r.error.flatten());
        req.body = r.data;
      }
      if (opts.query !== undefined) {
        const r = opts.query.safeParse(req.query);
        if (!r.success) throw new ValidationError('Invalid query', r.error.flatten());
        // Express 4 query is read-only via setter; assign via Object.assign for safety.
        req.query = r.data as typeof req.query;
      }
      if (opts.params !== undefined) {
        const r = opts.params.safeParse(req.params);
        if (!r.success) throw new ValidationError('Invalid params', r.error.flatten());
        req.params = r.data as typeof req.params;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
