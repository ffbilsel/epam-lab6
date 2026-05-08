import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { buildRateLimiter } from '../middleware/rate-limit.js';
import { authenticate } from '../middleware/authenticate.js';
import { LoginBodySchema } from '../schemas/auth.schemas.js';
import { buildAuthService } from '../../services/auth.service.js';
import * as userRepo from '../../repositories/user.repo.js';

const auth = buildAuthService();
const limiter = buildRateLimiter();

/** Sign-in / sign-out / current-user routes. */
export const authRouter: Router = Router();

authRouter.post('/login', limiter, validate({ body: LoginBodySchema }), (req, res, next) => {
  const body = req.body as { email: string; password: string };
  const ua = req.get('user-agent');
  auth
    .signIn({
      email: body.email,
      password: body.password,
      ...(req.ip !== undefined ? { ip: req.ip } : {}),
      ...(ua !== undefined ? { userAgent: ua } : {}),
    })
    .then((s) => res.status(200).json({ token: s.token, expiresAt: s.expiresAt.toISOString() }))
    .catch(next);
});

authRouter.post('/logout', authenticate, (req, res, next) => {
  const principal = req.auth;
  if (principal === undefined) return next();
  auth
    .signOut(principal.jti, principal.userId)
    .then(() => res.status(204).send())
    .catch(next);
  return undefined;
});

authRouter.get('/me', authenticate, (req, res, next) => {
  const principal = req.auth;
  if (principal === undefined) return next();
  userRepo
    .findById(principal.userId)
    .then((user) => {
      if (user === null) {
        res.status(404).type('application/problem+json').send({
          type: 'https://example.com/problems/not-found',
          title: 'Not Found',
          status: 404,
        });
        return;
      }
      res.status(200).json({
        id: user.id,
        email: user.email,
        emailVerifiedAt: user.email_verified_at?.toISOString() ?? null,
      });
    })
    .catch(next);
  return undefined;
});
