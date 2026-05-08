import { Router } from 'express';
import { pool } from '../../infra/db.js';

/** Liveness / readiness routes. */
export const healthRouter: Router = Router();

healthRouter.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

healthRouter.get('/readyz', (_req, res, next) => {
  pool
    .query('SELECT 1')
    .then(() => res.status(200).json({ status: 'ready' }))
    .catch(next);
});
