import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { buildRateLimiter } from '../middleware/rate-limit.js';
import {
  ResetConfirmBodySchema,
  ResetRequestBodySchema,
} from '../schemas/reset.schemas.js';
import { buildPasswordResetService } from '../../services/password-reset.service.js';

const reset = buildPasswordResetService();
const limiter = buildRateLimiter();

/** Password-reset routes. */
export const resetRouter: Router = Router();

resetRouter.post(
  '/reset/request',
  limiter,
  validate({ body: ResetRequestBodySchema }),
  (req, res, next) => {
    const { email } = req.body as { email: string };
    reset
      .requestReset(email)
      .then(() => res.status(202).json({ message: 'If the email exists, a reset link was sent.' }))
      .catch(next);
  },
);

resetRouter.post(
  '/reset/confirm',
  limiter,
  validate({ body: ResetConfirmBodySchema }),
  (req, res, next) => {
    const body = req.body as { token: string; newPassword: string };
    reset
      .confirmReset(body.token, body.newPassword)
      .then(() => res.status(204).send())
      .catch(next);
  },
);
