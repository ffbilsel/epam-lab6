import { describe, expect, it } from '@jest/globals';
import { buildClaims, SessionClaimsSchema } from '../../../src/domain/token-claims.js';

describe('token-claims', () => {
  it('builds well-formed claims with iat/exp aligned', () => {
    const now = new Date('2026-05-08T00:00:00Z');
    const claims = buildClaims({
      userId: '11111111-1111-4111-8111-111111111111',
      jti: '22222222-2222-4222-8222-222222222222',
      now,
      ttlSeconds: 86_400,
    });
    expect(SessionClaimsSchema.parse(claims)).toBeTruthy();
    expect(claims.exp - claims.iat).toBe(86_400);
    expect(claims.iat).toBe(Math.floor(now.getTime() / 1000));
  });
});
