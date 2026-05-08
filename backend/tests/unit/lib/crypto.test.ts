import { describe, expect, it } from '@jest/globals';
import { generateToken, hashToken } from '../../../src/lib/crypto.js';

describe('crypto', () => {
  it('generates URL-safe tokens of expected length', () => {
    const t = generateToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    // 32 bytes -> 43 base64url chars (no padding).
    expect(t.length).toBe(43);
  });

  it('produces unique tokens', () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) set.add(generateToken());
    expect(set.size).toBe(100);
  });

  it('hashes deterministically with SHA-256 hex (64 chars)', () => {
    const t = generateToken();
    const h1 = hashToken(t);
    const h2 = hashToken(t);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });
});
