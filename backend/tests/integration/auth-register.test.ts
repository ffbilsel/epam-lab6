// Placeholder for the integration test described in tasks.md T030.
// Requires Docker + testcontainers to spin Postgres; see README.
// Skipped here so unit suite stays infra-free.
import { describe, it } from '@jest/globals';

describe.skip('POST /auth/register (integration)', () => {
  it('issues 202 for new and duplicate emails identically', () => undefined);
  it('verifies via token then signs in', () => undefined);
  it('throttles /verify/resend and invalidates prior token', () => undefined);
});
