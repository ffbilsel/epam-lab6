import type { ErrorRequestHandler } from 'express';
import { DomainError } from '../../domain/errors.js';
import { logger } from '../../infra/logger.js';

/**
 * Express error middleware. Maps domain errors to RFC 7807 `application/problem+json`
 * and redacts unexpected errors to a generic 500.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next): void => {
  if (err instanceof DomainError) {
    const body: Record<string, unknown> = {
      type: err.type,
      title: err.title,
      status: err.status,
      detail: err.message,
    };
    if (err.code !== undefined) body.code = err.code;
    if (err.details !== undefined) body.details = err.details;
    res.status(err.status).type('application/problem+json').send(body);
    return;
  }

  logger.error({ err }, 'unhandled error');
  res.status(500).type('application/problem+json').send({
    type: 'https://example.com/problems/internal',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred.',
  });
};
