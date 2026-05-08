import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { buildRateLimiter } from '../middleware/rate-limit.js';
import {
  RegisterBodySchema,
  ResendVerifyBodySchema,
  VerifyBodySchema,
} from '../schemas/register.schemas.js';
import { buildRegistrationService } from '../../services/registration.service.js';
import { buildVerificationService } from '../../services/verification.service.js';

const registration = buildRegistrationService();
const verification = buildVerificationService();
const limiter = buildRateLimiter();

/** Account-lifecycle routes (register, verify, resend). */
export const accountRouter: Router = Router();

accountRouter.post(
  '/register',
  limiter,
  validate({ body: RegisterBodySchema }),
  (req, res, next) => {
    const body = req.body as { email: string; password: string };
    const ua = req.get('user-agent');
    registration
      .register({
        email: body.email,
        password: body.password,
        ...(req.ip !== undefined ? { ip: req.ip } : {}),
        ...(ua !== undefined ? { userAgent: ua } : {}),
      })
      .then(() => res.status(202).json({ message: 'If the email is new, a verification has been sent.' }))
      .catch(next);
  },
);

accountRouter.post('/verify', limiter, validate({ body: VerifyBodySchema }), (req, res, next) => {
  const { token } = req.body as { token: string };
  verification
    .verify(token)
    .then(() => res.status(204).send())
    .catch(next);
});

accountRouter.post(
  '/verify/resend',
  limiter,
  validate({ body: ResendVerifyBodySchema }),
  (req, res, next) => {
    const { email } = req.body as { email: string };
    verification
      .resend(email)
      .then(() => res.status(202).json({ message: 'If the email exists and is unverified, a new token was sent.' }))
      .catch(next);
  },
);
