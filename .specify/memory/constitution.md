<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0
Bump rationale: Added a substantive new principle (V. Testing Principles)
materially expanding testing guidance with 8 sub-sections (philosophy,
coverage, organization, naming, anatomy, mocking, quality criteria, tools).
No existing principle removed or redefined; Principle III (Testing Pyramid
with 80% Business-Logic Coverage) is preserved as the high-level rule and
Principle V provides the detailed regime that operationalises it. Per
governance versioning policy this is a MINOR bump.

Modified principles:
  - I. Clean Code — unchanged
  - II. TypeScript with Strict Mode — unchanged
  - III. Testing Pyramid with 80% Business-Logic Coverage — unchanged
  - IV. JSDoc Documentation for All Code — unchanged

Added sections:
  - V. Testing Principles (NON-NEGOTIABLE) with sub-sections:
    1. Testing Philosophy
    2. Coverage Requirements
    3. Test Types & Organization
    4. Naming Conventions
    5. Test Anatomy
    6. Mocking & Test Data
    7. Quality Criteria (CRITICAL)
    8. Tools & Frameworks
  - Quality & Tooling Standards: mutation-testing entry (Stryker, ≥ 75%)
  - Development Workflow & Quality Gates: gate #8 (mutation score)

Removed sections:
  - None

Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check section is
       generic; gates derived from this file at plan time — no edits required)
  - ✅ .specify/templates/spec-template.md (no constitution-specific references)
  - ✅ .specify/templates/tasks-template.md (no constitution-specific references)
  - ✅ .github/prompts/*.prompt.md (no outdated references)
  - ⚠ README.md / docs/quickstart.md — not present in repository; create if/when
       runtime guidance docs are added.

Deferred / Follow-up TODOs:
  - Add Stryker (`@stryker-mutator/core` + `@stryker-mutator/jest-runner`) to
    `backend/devDependencies`, add `stryker.conf.json`, and wire
    `npm run test:mutation` into CI before enforcing the 75% gate.
  - Existing E2E suite uses `*.test.ts` (matching `jest.config.cjs`
    `testMatch`). Constitution adopts that convention; if `*.spec.ts` is
    preferred for E2E, rename files and update `jest.config.cjs`.
-->

# SpecKit Lab Constitution

## Core Principles

### I. Clean Code (NON-NEGOTIABLE)

All production code MUST adhere to clean code practices:

- Names MUST reveal intent; abbreviations and single-letter identifiers are
  prohibited outside of conventional loop indices and well-known math symbols.
- Functions MUST do one thing, stay small (target ≤ 30 logical lines), and
  keep cyclomatic complexity ≤ 10. Functions exceeding these limits MUST be
  refactored or explicitly justified in code review.
- Modules MUST follow the Single Responsibility Principle; cross-cutting
  concerns MUST be isolated behind explicit interfaces.
- Dead code, commented-out code, and TODOs without an issue link are
  prohibited in `main`.
- Duplication MUST be removed (DRY) once the same logic appears a third time;
  premature abstraction is equally discouraged (YAGNI).

**Rationale**: Readability and maintainability dominate the total cost of
software. Enforcing clean code at the principle level prevents accumulation
of structural debt that later blocks delivery.

### II. TypeScript with Strict Mode

All source code MUST be written in TypeScript with the strict compiler family
enabled. The repository's `tsconfig.json` MUST set, at minimum:

- `"strict": true` (enables `strictNullChecks`, `noImplicitAny`,
  `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`,
  `alwaysStrict`, `useUnknownInCatchVariables`).
- `"noUncheckedIndexedAccess": true`
- `"noImplicitOverride": true`
- `"noFallthroughCasesInSwitch": true`
- `"exactOptionalPropertyTypes": true`

Use of `any`, non-null assertions (`!`), and `@ts-ignore` is prohibited;
`@ts-expect-error` MAY be used only with an inline justification comment and
a linked issue. External/untyped data MUST cross the type boundary through a
validated parser (e.g., Zod) — not casts.

**Rationale**: Strict typing eliminates entire classes of runtime defects at
build time and makes refactors safe, which is foundational to the other
principles.

### III. Testing Pyramid with 80% Business-Logic Coverage

Automated testing MUST follow the testing pyramid:

- **Unit tests** form the base: fast, isolated, no I/O, no network. They MUST
  cover all business logic (domain services, pure functions, reducers,
  use-cases) with **≥ 80% line and branch coverage**. Coverage MUST be
  measured and enforced in CI; PRs that drop business-logic coverage below
  the threshold MUST fail.
- **Integration tests** form the middle layer: verify contracts between
  modules, database access, and external adapters using realistic fakes or
  test containers. Coverage threshold for adapters: meaningful per-contract
  tests; no numeric percentage required.
- **End-to-end tests** form the tip: cover critical user journeys only. They
  MUST remain a small minority of total test count.

The 80% threshold applies to business-logic packages/modules; pure
infrastructure glue and generated code are exempt but MUST be excluded
explicitly via coverage configuration.

**Rationale**: The pyramid keeps the test suite fast and reliable while the
coverage floor on business logic guards the highest-value code paths against
regressions.

### IV. JSDoc Documentation for All Code

Every exported symbol — functions, classes, methods, types, interfaces,
enums, and module-level constants — MUST carry a JSDoc block that includes:

- A one-sentence summary describing intent (not restating the signature).
- `@param` for every parameter with type-meaningful description.
- `@returns` for non-void functions.
- `@throws` for any error type a caller is expected to handle.
- `@example` for any public API surface or non-obvious utility.

Internal (non-exported) symbols MUST be documented when their purpose is not
self-evident from the name and signature. Documentation MUST be kept in sync
with code; stale JSDoc is treated as a defect. Linting MUST enforce JSDoc
presence on exported symbols (e.g., `eslint-plugin-jsdoc`).

**Rationale**: Inline contract documentation accelerates onboarding, makes
generated API docs trustworthy, and complements TypeScript types with
behavioural intent.

### V. Testing Principles (NON-NEGOTIABLE)

This principle operationalises Principle III. Where the two overlap,
Principle V's specific rules govern. Every sub-section below is binding.

#### V.1. Testing Philosophy

- **Test-Driven Development (TDD) is the default workflow.** New business
  logic MUST be developed via the **RED → GREEN → REFACTOR** cycle:
  1. **RED**: write a failing test that expresses one behavioural
     requirement.
  2. **GREEN**: write the minimum production code that makes the test pass.
  3. **REFACTOR**: improve structure with the test suite green; repeat.
- Tests MUST be authored **before** the implementation they cover. A PR
  whose history shows production code preceding its tests is considered
  out of compliance and MUST be rewritten or carry an approved waiver in
  the PR description.
- Tests MUST be **derived from specifications** (`specs/**/spec.md`,
  `contracts/openapi.yaml`, acceptance criteria, ADRs) — not from reading
  the implementation. Mirroring the implementation produces tautological
  tests and is explicitly prohibited (see V.7).

**Rationale**: TDD constrains design toward testability and prevents the
"tests-as-afterthought" pattern where assertions silently encode whatever
the code happened to do.

#### V.2. Coverage Requirements

- **Pyramid distribution** (by count, measured at suite level):
  - **~70%** unit tests
  - **~20%** integration tests
  - **~10%** end-to-end tests

  Deviations beyond ±10 percentage points on any tier MUST be justified in
  a PR description.
- **Tier responsibilities**:
  - **Unit** (`tests/unit/**`): pure functions, domain services, business
    logic, validators (Zod schemas), token claims, password policy. No
    I/O, no network, no database, no clock dependency without injection.
  - **Integration** (`tests/integration/**`): HTTP routes via Supertest,
    repository methods against a real PostgreSQL via Testcontainers,
    middleware composition, migration application.
  - **E2E** (`tests/e2e/**`): critical user journeys end-to-end through
    the running Express app (register → verify → login → reset → logout
    style flows). Kept ≤ 5 scenarios.
- **Static analysis** (gate before tests run):
  - `tsc --noEmit` with the strict configuration in Principle II.
  - `eslint .` with `@typescript-eslint/recommended-type-checked` and
    `eslint-plugin-jsdoc` configured; zero errors, zero warnings on
    protected branches.
- **Coverage targets** (enforced in CI, MUST fail the build below floor):
  - **80% line** on `src/domain/**` and `src/services/**`
  - **75% branch** on the same paths
  - **75% mutation score** (Stryker, see V.8)

  `src/infra/**`, `src/server.ts`, and `src/app.ts` are excluded from line
  and branch thresholds via `collectCoverageFrom` in `jest.config.cjs` and
  from mutation testing via `stryker.conf.json`. Any new excluded path
  MUST be documented in the plan's Constitution Check.

#### V.3. Test Types & Organization

Repository layout (relative to `backend/`):

```text
tests/
  unit/**/*.test.ts          # mirrors src/ structure
  integration/**/*.test.ts   # grouped by feature
  e2e/**/*.test.ts           # grouped by user journey
```

- **Unit tests MUST mirror `src/`**. For `src/<area>/<name>.ts` create
  `tests/unit/<area>/<name>.test.ts`. One test file per source file.
- **Integration tests MUST be grouped by feature**, not by file (e.g.,
  `tests/integration/auth-login.test.ts`, `auth-register.test.ts`,
  `auth-reset.test.ts`). A `_setup.ts` per directory MAY provide shared
  container/migration bootstrap.
- **E2E tests MUST be grouped by user journey** (e.g.,
  `tests/e2e/journeys.test.ts`). Each `describe` inside corresponds to
  one journey.
- The Jest `testMatch` patterns in `jest.config.cjs` are the single source
  of truth for discovery. Files placed outside these patterns are not
  tests and MUST NOT contain test assertions.

#### V.4. Naming Conventions

- **File names**:
  - Unit / integration: `<ComponentName>.test.ts` matching the unit under
    test (e.g., `password-policy.test.ts`, `auth-login.test.ts`).
  - E2E: `<user-journey-name>.test.ts` in kebab-case
    (e.g., `journeys.test.ts`). The project convention is `.test.ts`
    across all tiers; do not introduce `.spec.ts` without amending this
    constitution and `jest.config.cjs` together.
- **Test suites** (`describe`): the production symbol or feature name —
  `describe('PasswordPolicy', …)`, `describe('POST /auth/login', …)`,
  `describe('Registration journey', …)`.
- **Test cases** (`it` / `test`): start with `should` and state the
  observable outcome and its trigger —
  `it('should reject login when password is wrong', …)`,
  `it('should return 429 when rate limit exceeded', …)`.
- Test names MUST NOT include implementation detail (function names,
  private helpers, internal flags).

#### V.5. Test Anatomy

- **Arrange-Act-Assert (AAA) is the required pattern.** Each test MUST be
  visibly divided into the three phases, in order, with blank lines or
  comments separating them when not otherwise obvious.
- **Setup uses `beforeEach`, not `beforeAll`**, except for *immutable*,
  process-wide resources (e.g., the Testcontainers PostgreSQL container,
  loaded Zod schemas). Mutable state — DB rows, in-memory fakes, mocked
  clocks — MUST be (re)created in `beforeEach` and torn down in
  `afterEach`.
- **Each test MUST be independent** and runnable in isolation
  (`jest -t "test name"` MUST pass for any single test). Jest's
  randomized test order (`--randomize` or sharded CI) MUST NOT change
  outcomes.
- **No shared mutable global state.** Module-level `let` variables that
  carry test data between cases are prohibited. Use factories
  (`createTestUser()`) returning fresh objects.
- **Async tests MUST `await`** their actions and assertions; bare promise
  returns without assertion-on-resolution are not permitted.

#### V.6. Mocking & Test Data

Choose the lightest double that gives a reliable test:

- **Mock**: external services that the project does not own — the SMTP
  transport (`nodemailer`), any third-party HTTP API. Replace at the
  adapter boundary (`src/infra/mailer.ts`), never deeper.
- **Stub**: time-dependent functions and non-determinism — `Date.now()`,
  `setTimeout`, `crypto.randomBytes`. Inject a `Clock` interface
  (`src/infra/clock.ts`) and a token-generator port; tests pass fakes.
- **Fake**: in-memory implementations of repository ports for unit-level
  service tests (e.g., an in-memory `UserRepo` for
  `auth.service.test.ts`). Fakes MUST satisfy the same interface as the
  real implementation.
- **Test fixtures**: complex domain objects (registered user, locked
  account, expired reset token) MUST be built by helpers, not literals
  duplicated across files. Helpers live alongside the consuming tier
  (e.g., `tests/integration/_setup.ts`,
  `tests/unit/_factories.ts` if introduced).
- **Required helpers** (add as needs arise): `createTestUser()`,
  `createVerifiedUser()`, `createLockedUser()`, `issueJwtForUser()`,
  `setupMockMailer()`.
- **DO NOT mock code you own** (domain services, your own repositories
  when integration-testing them, password policy, token-claims). Do not
  mock simple utilities (Zod schemas, pure functions, `lib/crypto`).

#### V.7. Quality Criteria (CRITICAL)

A test that does not satisfy every rule below is a defect, regardless of
whether it is green.

**What makes a good test**:

- Tests **observable behaviour** — inputs/outputs at the unit's public
  surface, HTTP status + body shape, persisted row state — never private
  methods, internal field names, or "the function was called" assertions
  on internal helpers.
- Has **meaningful assertions**. Tautological assertions
  (`expect(x).toBe(x)`, `expect(value).toEqual(value)`,
  `expect(result).toBeDefined()` as the *only* assertion) are prohibited.
- Tests **one thing** — one logical assertion of behaviour per `it`.
  Multiple `expect` calls are permitted only when they collectively
  describe a single outcome (e.g., status + body).
- Is **fast**: < 1 s per unit test, < 5 s per integration test (Jest
  `testTimeout` of 60 s for integration/e2e is a safety net, not a
  target).
- Is **deterministic**: same result on every run, in every order, on every
  machine. Time, randomness, and concurrency MUST be controlled via
  injected ports.

**Quality gates** (CI-enforced):

- **Mutation score ≥ 75%** measured by Stryker across `src/domain/**` and
  `src/services/**`. PRs that drop the score below the floor fail.
- **No tautological assertions** — enforced via lint rules where
  available; reviewers MUST reject in code review otherwise.
- **All oracle values validated by a human reviewer.** Expected values
  in assertions (status codes, error codes, persisted shapes) MUST be
  traceable to the spec or contract; "snapshot until green" updates
  without spec backing are prohibited.
- **Coverage**: 80% line, 75% branch on business-logic paths (V.2).

**Anti-patterns — MUST NOT appear in the suite**:

- Testing private methods, private fields, or internal state.
- Tests that depend on execution order (interdependent tests).
- Brittle tests that break on pure refactors (renaming a private helper,
  re-ordering pure expressions).
- Flaky tests (intermittent failures): a flake MUST be quarantined
  within the same PR that detects it and fixed within one sprint, or the
  test deleted.
- Tests without assertions (or with only `expect(...).not.toThrow()` as
  the sole assertion when a stronger oracle is available).
- Copy-pasted test logic — extract a helper or a `it.each` /
  `describe.each` table once duplication appears a second time.

#### V.8. Tools & Frameworks

The toolchain below is the canonical one for this repository. Substitutions
require a constitution amendment.

**Static analysis**:

- **Type checker**: TypeScript `~5.4.5` in strict mode (see Principle II).
- **Linter**: ESLint `^8.57` with `@typescript-eslint/parser`,
  `@typescript-eslint/eslint-plugin`, and `eslint-plugin-jsdoc`.
  Configuration in `backend/.eslintrc.*`. Prettier `^3.3` enforces
  formatting; warnings MUST be treated as errors on protected branches.

**Unit / Integration testing**:

- **Framework**: Jest `^29.7` with `ts-jest ^29.2` (ESM preset), configured
  via `backend/jest.config.cjs` with three projects: `unit`,
  `integration`, `e2e`.
- **Assertion library**: Jest's built-in `expect` (no Chai, no Sinon-Chai).
- **Mocking**: Jest's built-in `jest.fn()`, `jest.spyOn()`, and module
  mocks via `jest.unstable_mockModule` (required under ESM). Hand-rolled
  fakes preferred over `jest.mock` for owned interfaces (see V.6).
- **HTTP integration**: Supertest `^7.0`.
- **Database integration**: Testcontainers `^10.10` spinning up a real
  PostgreSQL `16` container per Jest worker; migrations applied via
  `node-pg-migrate ^7.4` against the container before each suite.

**E2E testing**:

- **Framework**: Jest `^29.7` driving the in-process Express app via
  Supertest (the project does not run a separate browser tier).
- **Optional future tier**: a browser-based E2E framework (Playwright or
  Stagehand for AI-native automation) MAY be introduced when a UI ships.
  Adding it is a MINOR amendment to this section.

**Coverage & quality**:

- **Coverage tool**: Jest's built-in coverage (Istanbul). Floors per V.2.
- **Mutation testing**: Stryker (`@stryker-mutator/core` +
  `@stryker-mutator/jest-runner`). Configuration in
  `backend/stryker.conf.json`. Floor: **75% mutation score** on
  `src/domain/**` and `src/services/**`.

**Package manager**: npm (lockfile `backend/package-lock.json` is the
source of truth for installed versions).

**Execution commands** (run from `backend/`):

| Purpose                  | Command                              |
| ------------------------ | ------------------------------------ |
| Type check               | `npm run typecheck`                  |
| Lint                     | `npm run lint`                       |
| Format check             | `npm run format`                     |
| Run all tests + coverage | `npm test`                           |
| Run unit tests           | `npm run test:unit`                  |
| Run integration tests    | `npm run test:integration`           |
| Run E2E tests            | `npm run test:e2e`                   |
| Generate coverage report | `npm test -- --coverage`             |
| Run mutation testing     | `npm run test:mutation` *(to add)*   |
| Full local pre-merge     | `npm run check`                      |

**Pre-commit hook** (required, configured via a Husky or simple Git hook):
`typecheck` + `lint` + `test:unit`. Integration and E2E run in CI only to
keep commits fast.

**CI/CD pipeline** (required on every PR; gating on `main`):

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run format`
5. `npm run test:unit -- --coverage`
6. `npm run test:integration`
7. `npm run test:e2e`
8. `npm run test:mutation` (full Stryker run on `main` and release
   branches; PR runs MAY use Stryker's incremental mode against changed
   files only, but the 75% floor still applies to the affected modules)
9. Coverage and mutation reports uploaded as build artefacts.

**Rationale**: Pinning the exact toolchain in the constitution removes
ambiguity about "what counts as a passing build" and makes drift between
local, CI, and developer machines a constitutional violation rather than
a debugging mystery.

## Quality & Tooling Standards

- **Language & runtime**: TypeScript only for application code; Node.js
  `>=20 <21`. Build toolchain MUST type-check on every commit and in CI.
- **Linting & formatting**: ESLint (with `@typescript-eslint` and
  `eslint-plugin-jsdoc`) and Prettier MUST run in CI; warnings MUST be
  treated as errors on protected branches.
- **Coverage tooling**: Jest's Istanbul coverage MUST emit machine-readable
  reports and enforce the 80% line / 75% branch business-logic thresholds
  via `coverageThreshold` in `jest.config.cjs`, not by honour system.
- **Mutation testing**: Stryker MUST run on protected branches and enforce
  a 75% mutation-score floor on `src/domain/**` and `src/services/**`.
- **Dependency hygiene**: Direct dependencies MUST be pinned via lockfile
  (`package-lock.json`); transitive vulnerabilities MUST be triaged within
  one sprint of disclosure.

## Development Workflow & Quality Gates

The following gates MUST pass before a change merges to `main`:

1. `tsc --noEmit` succeeds with the strict configuration above.
2. ESLint and Prettier produce zero errors.
3. Unit, integration, and E2E test suites pass.
4. Business-logic line coverage ≥ 80% and branch coverage ≥ 75%.
5. JSDoc lint rule passes on all exported symbols.
6. Code review by at least one other contributor; reviewers MUST verify
   compliance with each Core Principle and reject changes that bypass them
   without an approved justification recorded in the PR description.
7. Constitution Check in the planning template (see
   `.specify/templates/plan-template.md`) is satisfied or contains a
   documented complexity justification.
8. Stryker mutation score ≥ 75% on `src/domain/**` and `src/services/**`
   (see V.7 / V.8). Until Stryker is wired into CI, this gate is
   "advisory-failing": PRs MUST run it locally and attach the report; the
   gate becomes hard-failing as soon as the CI job is in place.

## Governance

This constitution supersedes ad-hoc conventions and individual preferences.
Conflicts between this document and other guidance MUST be resolved in favour
of this constitution unless an amendment is ratified.

**Amendment procedure**:

1. Open a PR modifying `.specify/memory/constitution.md` with the proposed
   change and a Sync Impact Report.
2. The PR MUST update the version number per the policy below and propagate
   changes to dependent templates and docs in the same PR.
3. At least one maintainer review is required; principle removals or
   redefinitions require maintainer consensus.

**Versioning policy** (semantic):

- **MAJOR**: Backward-incompatible governance or principle removals /
  redefinitions.
- **MINOR**: New principle or section added, or existing guidance materially
  expanded.
- **PATCH**: Clarifications, wording, typos, non-semantic refinements.

**Compliance review**: Every PR description MUST include a brief
"Constitution compliance" note. Periodic audits (at least once per release)
MUST verify that the codebase still satisfies the principles; deviations MUST
be filed as remediation issues.

**Version**: 1.1.0 | **Ratified**: 2026-05-08 | **Last Amended**: 2026-05-11
