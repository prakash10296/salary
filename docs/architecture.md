# Architecture

## System Overview

```
┌──────────────────┐        ┌──────────────────────────┐        ┌─────────┐
│  React SPA       │  HTTP  │  Express API (Node 22)   │ Prisma │  MySQL  │
│  Vite + Mantine  │ ─────► │  TypeScript              │ ─────► │         │
│  React Query     │  JWT   │  auth middleware →       │        │ Employee│
│  Recharts        │ Bearer │  routes → services →     │        │  table  │
│                  │        │  repositories            │        │         │
└──────────────────┘        └──────────────────────────┘        └─────────┘
     :5173                          :3001                          :3306

All three run as Docker Compose services; the frontend is a production
Vite build served by nginx.
```

## Backend Layering

Each layer has one responsibility and only talks to the layer below it:

| Layer | Location | Responsibility |
|---|---|---|
| **Middleware** | `src/middleware/` | JWT verification (`requireAuth`) applied to all protected routers. |
| **Routes** | `src/routes/` | HTTP concerns only: parse/validate input (zod), map domain errors to status codes. No business logic. |
| **Services** | `src/services/` | Business rules: duplicate-email checks, not-found handling, response shaping. Framework-agnostic — throws typed domain errors (`NotFoundError`, `ConflictError`), knows nothing about HTTP. |
| **Repositories** | `src/repositories/` | The only layer that touches Prisma/SQL. Query building, aggregations. |
| **Validators** | `src/validators/` | zod schemas defining the API contract at the boundary. |
| **Config** | `src/config/` | Static configuration (FX conversion table). |

Benefits of this shape at this scale:
- Services are unit-testable without HTTP or mocking Express.
- Swapping MySQL → SQLite (or Prisma → something else) touches one layer.
- Error handling is centralized: services throw domain errors, routes translate them, an Express error middleware catches anything unexpected.

## Authentication Flow

1. `POST /api/auth/login` checks credentials against env config (single mock HR Manager) and signs a JWT (`HS256`, 8h expiry, role claim).
2. The frontend stores the token and attaches it to every request via an axios request interceptor (`Authorization: Bearer <token>`).
3. `requireAuth` middleware verifies the token on every protected route; failures return 401.
4. An axios response interceptor catches 401s (expired/invalid token), clears the session, and returns the user to the login screen — except on the login call itself, where the error is shown inline.

`/health` and `/api/auth/login` are the only public endpoints.

## API Surface

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | — | Liveness check |
| POST | `/api/auth/login` | — | Issue JWT for the HR Manager (401 invalid, 422 missing fields) |
| GET | `/api/employees` | ✅ | Paginated list; search, country/department filters, sorting |
| GET | `/api/employees/filter-options` | ✅ | Distinct countries + departments for UI dropdowns |
| GET | `/api/employees/:id` | ✅ | Single employee |
| POST | `/api/employees` | ✅ | Create (201; 409 duplicate email; 422 validation) |
| PUT | `/api/employees/:id` | ✅ | Partial update (404 missing; 409 email conflict) |
| DELETE | `/api/employees/:id` | ✅ | Delete (204; 404 missing) |
| GET | `/api/analytics/summary` | ✅ | Org totals, stats by country/department, salary histogram — USD-normalized |

## Data Model

Single `Employee` table (see `prisma/schema.prisma`):

- `salary Decimal(12,2)` — exact arithmetic for money; Float is never acceptable for currency.
- `currency Char(3)` — ISO 4217 code; salary is stored in the employee's local currency.
- `email` unique constraint — enforced at DB level as the final safety net; also checked in the service layer for a clean 409 response.
- Indexes on `country`, `department`, `name` — the columns used for filtering/searching 10,000 rows.

## Analytics Design

- All aggregation happens **in SQL**, not in application memory. The database scans 10k rows and returns ~20 aggregate rows.
- Salaries are normalized to USD inside the query via a `CASE` expression generated from a static, trusted FX config (`src/config/fx.ts`).
- Median is computed with `ROW_NUMBER()` / `COUNT()` window functions (MySQL has no native `MEDIAN()`): the middle row for odd counts, the average of the two middle rows for even counts.
- Group-by columns are a closed TypeScript union (`"country" | "department"`) — user input is never interpolated into SQL.

## Frontend Structure

```
frontend/src/
├── api/client.ts        # axios instance + auth interceptors, API types, API functions
├── auth/AuthContext.tsx # token/session state, login/logout, localStorage persistence
├── pages/
│   ├── LoginPage.tsx          # HR Manager sign-in
│   ├── EmployeeListPage.tsx   # table, search (debounced), filters, sorting, pagination
│   └── InsightsPage.tsx       # summary cards, charts, stats tables
├── components/
│   └── EmployeeFormModal.tsx  # shared create/edit form
└── App.tsx              # auth gate + shell + simple state-based navigation
```

- **React Query** owns all server state: caching per filter combination, loading/error states, cache invalidation after mutations.
- **Server-side pagination/filtering** throughout — the client never holds more than one page of the 10k rows.
- Client-side form validation mirrors the API's zod rules for instant feedback, but the server remains the source of truth.

## Deployment (Docker Compose)

Three services, one command (`docker compose up --build`):

- **mysql** — MySQL 8 with a persistent volume; an init script also creates the test database. A healthcheck gates dependent services.
- **backend** — Node 22 Alpine image; on start it applies migrations (`prisma migrate deploy`), runs the deterministic seed, then serves the API. It waits for MySQL's healthcheck (`condition: service_healthy`) to avoid the classic connect-before-ready race, and reaches the DB via Docker's internal DNS (`mysql` service name).
- **frontend** — multi-stage build: Vite production build, served as static files by nginx on port 5173.

Auth credentials and the JWT secret are injected via compose environment variables (demo values for the assessment; a secrets manager in production).

## Testing Strategy

- 31 integration tests (Vitest + Supertest) run against a **real MySQL test database** (`salary_test`), not mocks — they verify actual query behavior including pagination math, filter combinations, window-function SQL, and the auth flow (valid login, wrong password, missing/invalid tokens on protected routes).
- Authenticated requests use a shared helper that logs in once and caches the Bearer header.
- Each test file seeds a small, hand-crafted dataset with hand-computable expected values (e.g., salaries `1000 * i` make sort assertions self-evident; analytics fixtures have pen-and-paper-checkable medians).
- The Express `app` is exported without `listen()` in test mode, so Supertest drives it in-process — fast, no ports.
- `fileParallelism: false` because test files share one database.
