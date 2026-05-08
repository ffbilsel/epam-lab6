import pino from 'pino';
import { env } from '../config/env.js';

/** Project-wide structured logger. Redacts secret-bearing fields. */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'password',
      'newPassword',
      'token',
      'req.body.password',
      'req.body.newPassword',
      'req.body.token',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
});
