import { buildApp } from './app.js';
import { env } from './config/env.js';
import { closePool } from './infra/db.js';
import { logger } from './infra/logger.js';

const app = buildApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'server.listening');
});

/**
 * Initiate graceful shutdown.
 * @param signal The OS signal that triggered shutdown.
 */
function shutdown(signal: string): void {
  logger.info({ signal }, 'server.shutdown');
  server.close(() => {
    void closePool().finally(() => process.exit(0));
  });
  // Hard exit if not closed within 10s.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
