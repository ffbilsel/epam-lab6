import { describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../../../../src/http/middleware/error-handler.js';
import {
  GoneError,
  LockedError,
  TooManyRequestsError,
  UnauthorizedError,
  ValidationError,
} from '../../../../src/domain/errors.js';

function buildApp(err: unknown) {
  const app = express();
  app.get('/boom', (_req, _res, next) => next(err));
  app.use(errorHandler);
  return app;
}

describe('error-handler middleware', () => {
  const cases: Array<[string, Error, number]> = [
    ['ValidationError -> 400', new ValidationError('boom'), 400],
    ['UnauthorizedError -> 401', new UnauthorizedError('boom'), 401],
    ['GoneError -> 410', new GoneError('boom'), 410],
    ['LockedError -> 423', new LockedError('boom'), 423],
    ['TooManyRequestsError -> 429', new TooManyRequestsError('boom'), 429],
  ];

  it.each(cases)('%s', async (_name, err, status) => {
    const app = buildApp(err);
    const res = await request(app).get('/boom');
    expect(res.status).toBe(status);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body.status).toBe(status);
  });

  it('redacts unexpected errors to 500', async () => {
    const app = buildApp(new Error('internals leak'));
    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.detail).not.toMatch(/internals leak/);
  });
});
