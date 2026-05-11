<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan at
`specs/001-user-auth/plan.md`. Related artifacts:
`specs/001-user-auth/spec.md`, `specs/001-user-auth/research.md`,
`specs/001-user-auth/data-model.md`, `specs/001-user-auth/contracts/openapi.yaml`,
`specs/001-user-auth/quickstart.md`, `specs/001-user-auth/adr/`. Project
constitution: `.specify/memory/constitution.md` (v1.1.0). Testing regime is
governed by Constitution **Principle V** (TDD, AAA, factories, mutation
testing). Backend test commands: `npm run test:unit`,
`npm run test:integration`, `npm run test:e2e`, `npm run test:pyramid`,
`npm run test:mutation` (Stryker, ≥75% gate); full pre-merge gate is
`npm run check`.
<!-- SPECKIT END -->
