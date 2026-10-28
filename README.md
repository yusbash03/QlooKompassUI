# Kulture Compass — PWA frontend

Cultural growth plans for small fashion brands, grounded in Qloo evidence. React 19 + Vite PWA; the API is the .NET backend in
`../../backend/QlooKompass`. Specs live in `MdFiles/` (start with `MdFiles/docs/frontend/FE-01-pwa-spec.md`); project rules for
contributors (and Claude) are in `CLAUDE.md`.

## Run it

```bash
npm ci
cp .env.example .env.local      # public build flags only — nothing secret ever goes in VITE_*
npm run dev                     # http://localhost:5173, proxies /api → VITE_DEV_API_PROXY_TARGET (default https://kompass-api-hczs.onrender.com)
# Local backend instead: VITE_DEV_API_PROXY_TARGET=http://localhost:5206 npm run dev
```

The backend doesn't serve every endpoint yet. To run the whole app without it, start the stand-in API (the same fake backend the
unit tests use) and point the proxy at it:

```bash
npm run mock-api                                            # http://localhost:5299, in-memory, synthetic data
VITE_DEV_API_PROXY_TARGET=http://localhost:5299 npm run dev
```

Any email works for sign-up there; sign-in expects the password `Correct-horse-1`.

## Checks

| Command                                                       | What it does                                                                                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run typecheck` / `npm run lint` / `npm run format:check` | TypeScript strict, ESLint (incl. jsx-a11y), Prettier                                                                                                                           |
| `npm run test`                                                | Vitest + Testing Library + MSW, axe on components                                                                                                                              |
| `npm run test:e2e`                                            | Playwright (desktop + Pixel 7): user journey, PWA/offline, axe with real colour contrast in light and dark. Builds the app and starts `vite preview` + the stand-in API itself |
| `E2E_BASE_URL=http://localhost:8080 npm run test:e2e`         | Same suite against an already-running build, e.g. the Docker image (checks the production CSP too)                                                                             |
| `npm run gen:api`                                             | Regenerate `src/shared/api/schema.d.ts` after `MdFiles/contracts/openapi.yaml` changes — never edit it by hand                                                                 |
| `npm run icons`                                               | Re-render the PWA icons in `public/icons/` from `public/favicon.svg`                                                                                                           |

CI (`.github/workflows/frontend.yml`) runs the checks, the e2e suite and the image build on every push and PR.

## Build & deploy

```bash
docker build -t kompass-web .                       # --build-arg VITE_ENABLE_EVALUATION=true to show Evaluation mode
docker run -p 5173:80 kompass-web                    # proxies /api to the Render backend
# docker run -p 5173:80 -e API_UPSTREAM=http://host.docker.internal:5206 kompass-web   # local backend
```

nginx (`deploy/`) serves the build and proxies `/api/` to `API_UPSTREAM` (default `https://kompass-api-hczs.onrender.com`; `http://api:8080` for the compose service), so the
API is same-origin and the HttpOnly refresh cookie works. Hashed `/assets/*` are cached for a year; `index.html`, `sw.js`,
`manifest.webmanifest` and client routes are `no-cache`, so a deploy reaches users on their next load (the app then offers
"Reload" for the new version). Every response carries the CSP in `deploy/security-headers.conf`: scripts from `'self'` only,
Google Fonts as the one third party, `frame-ancestors 'none'`.

Serve it over HTTPS in production — service workers and install prompts need a secure origin (localhost is exempt).

## How it fits together

- **Feature folders** under `src/features/` (auth, profiles, plans, evidence, experiments, offline, evaluation, pwa); shared UI
  and layout in `src/shared/`. Routes are lazy-loaded (`src/app/router.tsx`).
- **Server state** is TanStack Query only, user-scoped keys start with `['u', userId]`. Mutations never auto-retry; plan and
  evaluation starts carry an `Idempotency-Key` that is reused only by a manual retry.
- **Auth**: the access token lives in memory; the refresh token is an HttpOnly cookie the app never reads. Signing out (or a
  user switch) clears the query cache, pending idempotency keys, drafts and that user's offline copies.
- **PWA**: `build/pwa.ts` holds the manifest and Workbox policy. The service worker precaches the shell, caches only
  `/api/v1/sample-plan` and `/api/v1/meta`, and sends every other `/api/` call to the network. Plans are kept offline only
  when the user turns on "Available offline" (IndexedDB, per user).
- **Design** follows the Magic Patterns prototype (see `CLAUDE.md`), re-implemented with the tokens in `src/styles/index.css`.
  `/dev/ui` (dev builds) shows every component in light and dark.

## Known limitations

- Opening the app with no connection and no session in memory shows an offline screen: offline copies are stored per user,
  and the user can't be identified until the session is restored. The session is restored automatically when the connection
  returns. Copies remain readable offline in any tab that was already signed in.
- The stand-in API keeps a single in-memory session for every client, so the e2e suite runs with one worker.
