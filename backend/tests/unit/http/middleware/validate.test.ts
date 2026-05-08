import { describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validate } from '../../../../src/http/middleware/validate.js';
import { errorHandler } from '../../../../src/http/middleware/error-handler.js';

function buildApp(schema: z.ZodTypeAny) {
  const app = express();
  app.use(express.json());
  app.post('/echo', validate({ body: schema }), (req, res) => {
    res.status(200).json(req.body);
  });
  app.use(errorHandler);
  return app;
}

describe('validate middleware', () => {
  it('passes valid bodies through', async () => {
    const app = buildApp(z.object({ a: z.number() }));
    const res = await request(app).post('/echo').send({ a: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ a: 1 });
  });

  it('returns 400 problem+json on invalid body', async () => {
    const app = buildApp(z.object({ a: z.number() }));
    const res = await request(app).post('/echo').send({ a: 'nope' });
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body.title).toBe('Invalid request');
  });
});

// Silence unused jest import.
void jest;
