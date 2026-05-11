// Placeholder for tasks.md T031, T043, T053 — quickstart journeys end-to-end.
// Switched from `it(... () => undefined)` to `it.todo(...)` to satisfy
// Constitution v1.1.0 §V.7 (no tests without assertions).
import { describe, it } from '@jest/globals';

describe('e2e journeys', () => {
  it.todo('should register, verify email, and sign in (Journey 1)');
  it.todo('should sign in then lock out after 10 failed attempts (Journeys 2 + 4)');
  it.todo('should reset password and revoke prior sessions (Journey 3)');
});
