import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../../domain/errors.js';
import { buildSessionService } from '../../services/session.service.js';

const sessions = buildSessionService();

declare module 'express-serve-static-core' {
  interface Request {
    /** Authenticated principal injected by {@link authenticate}. */
    auth?: { userId: string; jti: string };
  }
}

/**
 * Bearer-token authentication middleware. Attaches `req.auth` on success.
 */
export const authenticate: RequestHandler = (req, _res, next): void => {
  const header = req.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (match === null) {
    next(new UnauthorizedError('Missing bearer token'));
    return;
  }
  const raw = match[1] ?? '';
  sessions
    .verify(raw)
    .then((claims) => {
      req.auth = { userId: claims.sub, jti: claims.jti };
      next();
    })
    .catch(next);
};
