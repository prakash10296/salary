# Architecture

## System Overview

```
┌──────────────────┐        ┌──────────────────────────┐        ┌─────────┐
│  React SPA       │  HTTP  │  Express API (Node 22)   │ Prisma │  MySQL  │
│  Vite + Mantine  │ ─────► │  TypeScript              │ ─────► │         │
│  React Query     │  JSON  │  routes → services →     │        │ Employee│
│  Recharts        │        │  repositories            │        │  table  │
└──────────────────┘        └──────────────────────────┘        └─────────┘
     :5173                          :3001                          :3306
```

## Backend Layering

Each layer has one responsibility and only talks to the layer below it:

| Layer | Location | Responsibility |
|---|---|---|
| **Routes** | `src/routes/` | HTTP concerns only: parse/validate input (zod), map domain errors to status codes. No business logic. |
| **Services** | `src/services/` | Business rules: duplicate-email checks, not-found handling, response shaping. Framework-agnostic — throws typed domain errors (`NotFoundError`, `ConflictError`), knows nothing about HTTP. |
| **Repositories** | `src/repositories/` | The only layer that touches Prisma/SQL. Query building, aggregations. |
| **Validators** | `src/validators/` | zod schemas defining the API contract at the boundary. |
| **Config** | `src/config/` | Static configuration (FX conversion table). |

Benefits of this shape at this scale:
- Services are unit-testable without HTTP or mocking Express.
- Swapping MySQL → SQLite (or Prisma → something else) touches one layer.
- Error handling is centralized: services throw domain errors, routes translate them, an Express error middleware catches anything unexpected.

## API Surface

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/api/employees` | Paginated list; search, country/department filters, sorting |
| GET | `/api/employees/filter-options` | Distinct countries + departments for UI dropdowns |
| GET | `/api/employees/:id` | Single employee |
| POST | `/api/employees` | Create (201; 409 duplicate email; 422 validation) |
| PUT | `/api/employees/:id` | Partial update (404 missing; 409 email conflict) |
| DELETE | `/api/employees/:id` | Delete (204; 404 missing) |
| GET | `/api/analytics/summary` | Org totals, stats by country/department, salary histogram — all USD-normalized |

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
├── api/client.ts        # axios instance, TypeScript API types, API functions
├── pages/
│   ├── EmployeeListPage.tsx   # table, search (debounced), filters, sorting, pagination
│   └── InsightsPage.tsx       # summary cards, charts, stats tables
├── components/
│   └── EmployeeFormModal.tsx  # shared create/edit form
└── App.tsx              # shell + simple state-based navigation (2 pages)
```

- **React Query** owns all server state: caching per filter combination, loading/error states, cache invalidation after mutations.
- **Server-side pagination/filtering** throughout — the client never holds more than one page of the 10k rows.
- Client-side form validation mirrors the API's zod rules for instant feedback, but the server remains the source of truth.

## Testing Strategy

- Integration tests (Vitest + Supertest) run against a **real MySQL test database** (`salary_test`), not mocks — they verify actual query behavior including pagination math, filter combinations, and window-function SQL.
- Each test file seeds a small, hand-crafted dataset with hand-computable expected values (e.g., salaries `1000 * i` make sort assertions self-evident; analytics fixtures have pen-and-paper-checkable medians).
- The Express `app` is exported without `listen()` in test mode, so Supertest drives it in-process — fast, no ports.
- `fileParallelism: false` because test files share one database.
