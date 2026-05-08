import { describe, expect, it } from '@jest/globals';
import { hash, verify } from '../../../src/infra/hasher.js';

describe('hasher', () => {
  it('hashes and verifies a password (round-trip)', async () => {
    const h = await hash('correct horse battery staple 9');
    expect(h).toMatch(/^\$2[aby]\$/);
    await expect(verify('correct horse battery staple 9', h)).resolves.toBe(true);
    await expect(verify('wrong password 9', h)).resolves.toBe(false);
  });

  it('produces different hashes for the same input (salt)', async () => {
    const a = await hash('p@ssword12');
    const b = await hash('p@ssword12');
    expect(a).not.toBe(b);
  });
});
