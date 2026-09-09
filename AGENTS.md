# CoreDash repository instructions

## Project layout

The Next.js application lives in `coredash/`. The repository root contains Docker and mock-service configuration.

- `coredash/app/`: Next.js App Router pages and API route adapters.
- `coredash/features/`: feature-owned contracts and server/application logic.
- `coredash/components/`: reusable UI and dashboard cards.
- `coredash/services/`: external-provider adapters.
- `coredash/entities/`: TypeORM persistence entities.
- `coredash/lib/`: shared infrastructure such as database, logging, caching, and API helpers.
- `coredash/types/`: compatibility exports and cross-feature types.

## Development commands

Run commands from `coredash/`:

```bash
npm run dev
npx tsc --noEmit
npm run lint
npm run build
```

Use the root Docker Compose file when mock external services are needed:

```bash
docker compose up --build
```

## Architecture rules

- Keep `app/api/**/route.ts` files focused on request parsing, validation, status codes, and response formatting.
- Put domain behavior, persistence queries, normalization, caching, and provider orchestration in `features/<name>/server/`.
- Keep feature contracts in `features/<name>/types.ts`; update compatibility exports under `types/` when moving an existing contract.
- Keep provider-specific response shapes inside `services/` and expose normalized application data to features and UI.
- Do not import server-only configuration, database modules, filesystem access, or secrets into client components.
- Use `formatResponse` for API responses so the existing JSON and `?format=toon` behavior remains compatible.
- Use `fetchJson<T>` for client requests that return the standard `{ data, message }` envelope.
- Keep dashboard state typed through `features/dashboard/types.ts`; avoid introducing `any` into shared state or feature boundaries.
- AI chat requests must go through `/api/ai/chat`. Do not call external AI providers directly from the browser.

## Change guidelines

- Preserve existing API paths and response shapes unless the change explicitly requires a breaking API.
- Prefer small feature-by-feature migrations over broad directory moves.
- Add or update tests for pure domain logic, route validation, cache behavior, and provider failures when changing those areas.
- Run TypeScript, lint, and production build checks before handoff.
- Never commit `.env`, database files, tokens, generated build output, or the location cache.

