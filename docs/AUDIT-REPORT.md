# Value Cars — Security Hardening Audit Report

Scope: admin-only authorisation on CRM endpoints (leads, test-drives, orders),
admin-phone detection, and end-to-end verification of the customer journey.

Environment used for all verification: **local only**. The dev backend was run
against a throwaway SQLite DB (`DATABASE_URL=sqlite+aiosqlite:///./value_cars.db`,
`NOTIFICATIONS_ENABLED=false`) on `127.0.0.1:8000`. The live Supabase production
DB is never touched. Frontend dev server on `127.0.0.1:3000`.

---

## 1. Backend black-box API audit — GREEN (41/41)

`backend\_journey_test.py` against the running dev server. Every relevant
combination of identity × endpoint was probed and expects the correct status:

| Endpoint(s)                      | Anon | Customer | Admin |
|----------------------------------|------|----------|-------|
| `GET/PATCH /leads` (+ `/{id}`)   | 401  | 403      | 200   |
| `GET/PATCH /test-drives` (+ `/{id}`) | 401 | 403    | 200   |
| `GET /orders/{order_number}`     | 401  | 403      | 200   |
| `POST /orders/reserve` (public)  | 201  | n/a      | n/a   |
| Car catalog / detail / inspection (public reads) | 200 | 200 | 200 |

Key regression guards included:
- **Admin-phone detection is exact set-membership, not substring.** Phone
  `988050966025` (which embeds authorised admin phone `8050966025` as a
  substring) is verified **NOT** admin → `403` on admin-only routes.
- The previously-dead `/orders` IDOR check (`GET /orders/{num}` anon → 401) is
  now live and passing.
- PATCH variants for leads and test-drives are guarded (403 for customer).

Result: `_journey_test.py` → 41/41 checks pass, and the script is now truly
idempotent across re-runs against the same DB (the fixed substring-spoof phone
`988050966025` is registered once; a duplicate `400` on a later run is treated as
a pass, and it is still verified to be **NOT** admin → `403`).

---

## 2. Frontend customer journey (browser) — GREEN

Automated with **Playwright** against the Next.js dev server + hardened backend
(spec: `frontend\e2e\customer-journey.spec.ts`, config: `frontend\playwright.config.ts`).

Journey exercised: **HOME → SEARCH → FILTER → DETAILS → ENQUIRY(test drive) →
BOOKING(reserve) → CONFIRMATION**.

> Note on the originally-planned journey: the frontend has **no customer login,
> profile, or favourites features** — only the *seller* portal
> (`/sell/my-listings`) and the *admin* hub have auth. LOGIN / PROFILE /
> FAVORITES are therefore **N/A** in this app, not part of the customer flow.

Observed backend calls (all 2xx, no 401/403):
```
GET  /api/v1/health                                -> 200
GET  /api/v1/cars?page=1&page_size=12              -> 200
GET  /api/v1/cars?...&model=Thar                    -> 200   (search)
GET  /api/v1/cars?...&fuel_type=PETROL              -> 200   (filter)
GET  /api/v1/cars/{id}                              -> 200   (detail)
GET  /api/v1/inspections/car/{id}                   -> 200
POST /api/v1/test-drives                            -> 201   (enquiry)
POST /api/v1/test-drives                            -> 201   (booking)
```

**Conclusion:** the hardening leaves the public customer flow fully functional —
no route the UI needs was locked down, and the customer never trips a 401/403.

### 2a. Bug found by the browser test and fixed
- **Symptom:** hub test-drive / reserve submissions returned `422` from the
  backend, yet the UI still showed "Test Drive Confirmed!" / success.
- **Cause:** frontend sent `location_type: "VALUE_CARS_HUB"`, but the backend
  `TestDriveLocation` enum only accepts `{"HOME_DELIVERY", "HUB_VISIT"}`.
  Pydantic rejected the value; `apiClient.bookTestDrive()` swallowed the error
  and returned a demo fallback, so the UI falsely reported success and the lead
  was silently never persisted.
- **Fix:** aligned the frontend to the backend enum value — `VALUE_CARS_HUB` →
  `HUB_VISIT` in `TestDriveModal.tsx`, `ReserveModal.tsx`, and the
  `TestDriveRequest` type in `services/api.ts`.
- **Post-fix:** both `POST /test-drives` calls now return **201** and persist
  (verified by the passing journey + backend log).

---

## 3. Remaining recommendations before production

1. **Secrets hygiene:** move `DATABASE_URL` / `SUPABASE_KEY` out of the committed
   `backend\.env`; use environment variables / a secret manager and git-ignore
   `.env`.
2. **RBAC instead of hard-coded admin phone/role list:** replace the phone
   whitelist in `auth.py` with server-controlled role-based access control.
3. **Rate limiting** on auth and CRM endpoints.
4. **Remove the error-swallowing demo fallbacks** in `apiClient` (e.g.
   `bookTestDrive`, `reserveCar` return staged objects on any failure). These hid
   the `422` bug above and mask real outages in production; surface errors to the
   UI instead.

---

## Verification artefacts
- `backend\_journey_test.py` — 41/41 API checks (green).
- `frontend\e2e\customer-journey.spec.ts` — Playwright browser journey (green).
- `frontend\playwright.config.ts` — local E2E config (`http://127.0.0.1:3000`).