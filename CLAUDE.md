# CLAUDE.md — Kulture Compass PWA (frontend repo)

This repo is the frontend only. Project-wide rules (non-negotiables, naming, how to work slice by slice): `MdFiles/CLAUDE.md`.
Specs: `MdFiles/docs/frontend/FE-01-pwa-spec.md`, `MdFiles/docs/frontend/FE-02-build-plan.md`, `MdFiles/design/magic-patterns.md`,
`MdFiles/contracts/openapi.yaml` (regenerate types with `npm run gen:api` whenever it changes — never hand-edit `schema.d.ts`).

The backend lives in `../../backend/QlooKompass` (.NET, `dotnet run` http profile on `http://localhost:5206`). Its spec pack copy of the
contract is `MdDocs/contracts/openapi.yaml`; when it changes, copy it to `MdFiles/contracts/openapi.yaml` and run `npm run gen:api`.
The Vite dev server proxies `/api` → `VITE_DEV_API_PROXY_TARGET` (default `http://localhost:5206`).

Layout: the Vite app sits at the repo root (FE-01 §2's `frontend/` = this repo root). `Design/` holds design exports — reference
only, re-implemented with our tokens (FE-3); never imported directly.

## Design source

- **Primary: Magic Patterns** prototype — live preview `https://8989e31e-95a8-42de-8d00-64980ce59730-render.magicpatterns.app/`
  (fake login: any email + 10-char password; its auth is in memory, so navigate client-side, not with full page loads).
  Captured landing markup/screens in `Design/magic-patterns/`. Landing photos are self-hosted in `public/images/landing/`.
- Secondary: Claude Design exports in `Design/claude-design/` and PNGs in `Design/screens/` (used where Magic Patterns has no screen).
- Where the prototype disagrees with the API contract or spec (e.g. it requires "Short description"; its record-result
  "met threshold?" answer has no API field), the contract/spec wins.
- Component gallery: `/dev/ui` (dev builds only) shows every component in light and dark; `src/shared/ui/components.a11y.test.tsx`
  runs axe on each. Colour contrast can only be checked in a real browser (Playwright + `@axe-core/playwright`).

## Rules

- TypeScript strict; no `any` (use `unknown` + Zod). Components are function components; feature-first folders.
- Server state = TanStack Query only. User-scoped query keys start with `['u', userId]`. Mutations never auto-retry.
- Generation requests always carry an `Idempotency-Key` created on user action and reused only on manual retry.
- Auth: access JWT lives in memory only (`tokenStore`); refresh token is an HttpOnly cookie we never touch from JS. All API calls are
  same-origin relative `/api/...`. Never put secrets in `VITE_*`. Never store tokens or brief content in localStorage/sessionStorage. IndexedDB only for opt-in offline plan copies, per user.
- Service worker: `/api/**` is NetworkOnly except `/api/v1/sample-plan` and `/api/v1/meta`.
- Provenance UI: "Retrieved from Qloo" (teal + database icon) vs "AI-generated" (violet + sparkle icon) — always with text labels.
- Never render invented numbers; charts only from returned evidence values. Progress UI only shows backend stages/details.
- Mock/sample data always bannered.
- Accessibility: semantic HTML, Radix primitives, labelled inputs, visible focus, aria-live for async status, contrast ≥ 4.5:1.
- Styling: Tailwind + CSS variables tokens only (`src/styles/index.css`). Don't add CSS-in-JS or another UI kit.
- Tests: Vitest + RTL + MSW per feature; Playwright e2e + axe.

## Toolchain pins (peer-dependency limits, Oct 2026)

- `typescript ~5.9` — `openapi-typescript` 7 requires TS 5; `typescript-eslint` 8 requires < 6.1.
- `eslint 9` — `eslint-plugin-jsx-a11y` does not support ESLint 10 yet.
- `@hookform/resolvers 5` — v6 pulls conflicting optional peers.

## Commands

```bash
npm run dev | npm run build | npm run preview
npm run typecheck | npm run lint | npm run test | npm run test:e2e
npm run gen:api
npm run mock-api   # stand-in API on :5299 (the MSW fake backend over HTTP); Playwright starts it itself
```
