import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { logger } from './infra/logger.js';
import { errorHandler } from './http/middleware/error-handler.js';
import { accountRouter } from './http/routes/account.routes.js';
import { authRouter } from './http/routes/auth.routes.js';
import { resetRouter } from './http/routes/reset.routes.js';
import { healthRouter } from './http/routes/health.routes.js';

/**
 * Build the Express application. No `listen()` call — the caller wires the
 * HTTP server (`server.ts`) so tests can use `supertest` against the app.
 */
export function buildApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '64kb' }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.newPassword',
          'req.body.token',
        ],
        censor: '[REDACTED]',
      },
    }),
  );

  app.use('/', healthRouter);
  app.use('/auth', accountRouter);
  app.use('/auth', authRouter);
  app.use('/auth', resetRouter);

  app.use(errorHandler);
  return app;
}
