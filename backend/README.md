# user-auth-backend

Reference implementation of feature `001-user-auth`.

- [Quickstart](../specs/001-user-auth/quickstart.md)
- [Plan](../specs/001-user-auth/plan.md)
- [Constitution](../.specify/memory/constitution.md)

## Quick start

```bash
cp .env.example .env
npm install
npm run migrate:up
npm run dev
```

Run `npm run check` before opening a PR — Constitution Principle III gates coverage at 80% on `src/domain/**` and `src/services/**`.

## Testing

This project follows **Constitution v1.1.0 / Principle V — Testing Principles**
(see [`.specify/memory/constitution.md`](../.specify/memory/constitution.md)).

### Commands

| Purpose                  | Command                              |
| ------------------------ | ------------------------------------ |
| Type check               | `npm run typecheck`                  |
| Lint                     | `npm run lint`                       |
| Format check             | `npm run format`                     |
| Run all tests + coverage | `npm test`                           |
| Run unit tests           | `npm run test:unit`                  |
| Run integration tests    | `npm run test:integration`           |
| Run E2E tests            | `npm run test:e2e`                   |
| Pyramid distribution     | `npm run test:pyramid`               |
| Mutation (incremental)   | `npm run test:mutation:incremental`  |
| Mutation (full)          | `npm run test:mutation`              |
| Full local pre-merge     | `npm run check`                      |

### Quality gates

- **Coverage**: ≥ 80% line and ≥ 75% branch on `src/domain/**` and `src/services/**` (Jest `coverageThreshold`).
- **Mutation**: ≥ 75% Stryker score on the same paths (configured in [`stryker.conf.json`](./stryker.conf.json)).
- **Pyramid**: unit / integration / e2e within 70 / 20 / 10 ± 10 pp (enforced by [`scripts/check-pyramid-distribution.mjs`](./scripts/check-pyramid-distribution.mjs)).
- **Lint**: zero errors / zero warnings on protected branches; `eslint-plugin-jest` rules and a tautology guard live in [`tests/.eslintrc.cjs`](./tests/.eslintrc.cjs).
- **Pre-commit**: typecheck + lint + unit tests via Husky ([`./.husky/pre-commit`](./.husky/pre-commit)). Run `npm install` once after cloning to install the hook.

### Test factories

Use the factories in [`tests/unit/_factories.ts`](./tests/unit/_factories.ts)
and [`tests/integration/_factories.ts`](./tests/integration/_factories.ts)
when constructing domain objects. Inline literals duplicated across files
should be replaced with a factory call (Constitution V.6).

### Flake quarantine policy (Constitution V.7)

A flaky test (intermittent failures) **MUST be quarantined in the same PR
that detects it** — wrap with `it.skip` plus a `// FLAKE: link-to-issue`
comment and open a tracking issue. The flake **MUST be fixed within one
sprint or the test deleted**; it MUST NOT remain skipped indefinitely.
