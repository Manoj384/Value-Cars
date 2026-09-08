# Deployment Readiness Plan — Value Cars Frontend

Status: **Phase 1 done** (foundations + Pillar 2) **and Pillar 1 / 3 / 4 integration done.** Only the
optional hand-written service worker (Pillar 1) and final CI deploy check remain. Scope: everything
except the API server (FastAPI backend is intentionally out of scope).
Target: GitHub Pages static site built by `.github/workflows/nextjs.yml` (Next.js 14, `output: 'export'`).

> **Why this matters:** the frontend is a *fully static* export — there is **no Node runtime** at
> production. That means *no server-side logging, server fetch caching, or middleware*. Every
> caching, crash-handling, activity, and error mechanism below therefore lives on the **client** or
> points at an optional third-party collector. Nothing here blocks today's Pages deploy: every piece
> degrades gracefully (local-only queue + the existing `MOCK_CARS` fallback in `api.ts`).

---

## Environment variables (`frontend/.env.example`, set at build time)

| Variable | Purpose | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend base URL | No (defaults to localhost) |
| `NEXT_PUBLIC_BASE_PATH` | `/Value-Cars` on GH Pages; root on custom domain | No |
| `NEXT_PUBLIC_EVENTS_URL` | Activity-logging collector (beacon target) | No |
| `NEXT_PUBLIC_ERRORS_URL` | Error-logging collector (beacon target) | No |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional browser-only Sentry DSN | No |

---

## Pillar 1 — Cache handling

- `src/lib/cache.ts` — TTL key/value cache over `localStorage` + in-memory mirror. Keys hashed
  per endpoint+query, prefixed `vc:c:<hash>`, stamped with `CACHE_VERSION` so a release invalidates
  all caches.
- Wire `getCars` / `getCarById` / `getCarInspection` in `src/services/api.ts` to read cache-first
  then **stale-while-revalidate** (return cached, background-refresh, update cache; fall back to
  `MOCK_CARS` only if cache & network both miss).
- Optional hand-written `public/sw.js` for app-shell/images (Next native SW needs a server; `next-pwa`
  is overkill). Respect `NEXT_PUBLIC_BASE_PATH`.
- Cheap wins: explicit image `width`/`height` + `loading="lazy"`, `fetchPriority="high"` hero,
  persist UI state (filters/sort/recently-viewed) to `localStorage`.

**Status:** done — `getCars` / `getCarById` / `getCarInspection` are cache-first with stale-while-
revalidate + a single retry (`fetchGet`), keys via `cacheKeyHash`. Cheap wins shipped: explicit image
`width`/`height` + `loading="lazy"` (CarCard, recent strip), `fetchPriority="high"` hero (CarDetail),
and UI-state persistence (`src/lib/uiState.ts`: filters restore + recently-viewed strip). Optional
hand-written `public/sw.js` still available if wanted.

## Pillar 2 — Crash handler

- `src/components/ErrorBoundary.tsx` — class component; `componentDidCatch` → error logger, then a
  friendly fallback with `reset()` (reuse `error.tsx` amber/rose styling). Wrap app content in
  `layout.tsx` and around `CarDetail`/admin.
- `src/app/global-error.tsx` — minimal self-contained HTML fallback for root-layout crashes.
- Global `window.error` / `unhandledrejection` listeners registered once in `layout.tsx`.
- `next.config.mjs` hardening: `poweredByHeader: false`, `generateEtags: true`.

**Status:** done — `ErrorBoundary` (wrapped around app content in `layout.tsx`), `global-error.tsx`,
`AppTelemetry`/global window handlers, and `next.config.mjs` hardening all shipped.

## Pillar 3 — Activity logging

- `src/lib/activity.ts` — `track(target, action, props?)` producing `{ ts, session_id, path, target,
  action, props }`; `session_id` = one UUID per browser (`localStorage`), no PII.
- Buffer queue in `localStorage` (`vc:events`, capped ~200); `flush()` via `navigator.sendBeacon`
  to `NEXT_PUBLIC_EVENTS_URL`; flush on `visibilitychange→hidden` + `pagehide`.
- Instrument: home view/filter/sort/brand, car detail view/gallery, test-drive, reserve,
  FloatingWhatsApp click, sell submit, admin login, route transitions.

**Status:** done — home (view/filter/brand/reset/recent-click), car detail view + gallery open,
test-drive & reserve submits, FloatingWhatsApp click, sell view + valuation + submit, admin view, and
a generic `route → view` page-view per navigation (`AppTelemetry` + `usePathname`, deduped).

## Pillar 4 — Error logging

- `src/lib/errorReporting.ts` — `reportError(err, context?)`, normalize + dedupe, auto-extract
  backend `detail`; buffer queue (`vc:errors`, capped, backoff retry).
- Transport: beacon to `NEXT_PUBLIC_ERRORS_URL`, else browser-only Sentry via
  `NEXT_PUBLIC_SENTRY_DSN` (Sentry Next SDK does **not** work with `output: 'export'`).
- Retrofit the scattered `console.error` in `page.tsx`, `CarDetail.tsx`, `admin/page.tsx` to
  `reportError` (console calls dev-only).
- Add `fetchWithRetry` (1 retry + short backoff) for GET catalog calls.

**Status:** done — `console.error` retrofitted to `reportError` (page, CarDetail, admin, sell
valuation/submit/upload); `fetchGet` added as the 1-retry + short-backoff catalog GET.

---

## Rollback-safe order

1. Foundations: `lib/cache.ts`, `lib/activity.ts`, `lib/errorReporting.ts`, `lib/analytics.ts`.
2. Pillar 2: `ErrorBoundary` + `global-error.tsx` + wrap in `layout.tsx`.
3. Pillar 1: back catalog reads with cache (SWR), image attrs, UI-state persistence.
4. Pillar 3 + 4: instrument pages/modals; optional service worker.
5. Config + verify: extend `.env.example`, `npx tsc --noEmit` + `next build`, confirm Pages deploy.

## Verify every phase

```bash
cd frontend
npx tsc --noEmit
npx next build   # produces static ./out that the Pages workflow deploys
```