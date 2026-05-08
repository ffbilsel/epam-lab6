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
