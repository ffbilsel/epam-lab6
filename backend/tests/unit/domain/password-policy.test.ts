import { describe, expect, it } from '@jest/globals';
import { validatePassword, PasswordSchema } from '../../../src/domain/password-policy.js';

describe('password-policy', () => {
  it('rejects too short', () => {
    expect(validatePassword('a1b2c3').ok).toBe(false);
  });
  it('rejects too long', () => {
    const long = 'a1'.repeat(70);
    expect(validatePassword(long).ok).toBe(false);
  });
  it('rejects no digit', () => {
    expect(validatePassword('abcdefghi').ok).toBe(false);
  });
  it('rejects no letter', () => {
    expect(validatePassword('123456789').ok).toBe(false);
  });
  it('accepts at the minimum length', () => {
    expect(validatePassword('abcd1234').ok).toBe(true);
  });
  it('accepts long, complex passwords', () => {
    expect(validatePassword('Correct-Horse-Battery-Staple-9').ok).toBe(true);
  });
  it('Zod refinement matches the imperative validator', () => {
    expect(PasswordSchema.safeParse('abcdefgh').success).toBe(false);
    expect(PasswordSchema.safeParse('abcd1234').success).toBe(true);
  });
});
