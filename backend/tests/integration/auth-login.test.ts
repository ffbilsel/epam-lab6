// Placeholder for tasks.md T042 (login integration).
import { describe, it } from '@jest/globals';

describe.skip('POST /auth/login (integration)', () => {
  it('returns 200 + JWT for verified+correct credentials', () => undefined);
  it('returns 401 for wrong password and unverified accounts', () => undefined);
  it('returns 423 after the lockout threshold', () => undefined);
  it('logout invalidates the JWT immediately', () => undefined);
});
