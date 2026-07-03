# AI Usage Log

## How I used AI

I used AI (Claude) as a pair programmer throughout this assessment: planning
scope and architecture up front, generating first drafts of each feature, and
explaining anything I wanted to understand more deeply before committing.

My working process for every feature:

1. Prompt for **one scoped feature at a time** (never "build the whole app") —
   this kept the design coherent and the commit history incremental.
2. **Read the generated code fully** before using it; ask follow-up questions
   about anything non-obvious (e.g., the window-function median SQL) until I
   could explain it myself.
3. **Run it and test it manually**, then run the automated tests.
4. Commit only after the feature worked and I understood it.
5. Log the prompt and outcome here.

Every line in this repository was reviewed and verified by me. Where the AI
output had bugs, I debugged them (examples in the log below) — the debugging
itself was a useful check that I understood the code.

## Log

### 1. Planning & requirements
- **Prompt:** "Break down this take-home assessment; help me define scope,
  architecture, and what to deliberately leave out, with reasoning."
- **Outcome:** requirements.md; layered backend design (routes → services →
  repositories); explicit out-of-scope list (auth, payroll, live FX, Excel
  import, audit history).

### 2. Project scaffold
- **Prompt:** "Scaffold an Express + TypeScript + Prisma backend on Node 22."
- **My decision:** pinned Prisma to v6 after hitting v7's new `prisma.config.ts`
  behavior mid-setup (seed command config had moved). Restarting on the stable
  major was faster and more predictable than adapting to v7 — documented in
  decisions.md.

### 3. Schema & seed script
- **Prompt:** "Prisma schema for an Employee salary model, and a deterministic
  seed script for 10,000 realistic employees across countries/currencies with
  batched inserts."
- **My review:** verified `Decimal` for money, checked email uniqueness logic at
  10k scale, confirmed determinism (`faker.seed(42)`), spot-checked generated
  data in Prisma Studio.

### 4. Employee list API
- **Prompt:** "GET /api/employees with server-side pagination (capped
  pageSize), search, country/department filters, sorting; zod validation at the
  route; routes → services → repositories layering."
- **My review:** tested every filter combination and the 422 cases manually
  before writing the automated tests.

### 5. Test infrastructure + list API tests
- **Prompt:** "Vitest + Supertest tests on an isolated MySQL test database with
  a small deterministic dataset."
- **My review:** confirmed the test DB isolation (dev data untouched after test
  runs) and that assertions were hand-checkable.

### 6. CRUD endpoints + tests
- **Prompt:** "CRUD for employees with typed domain errors mapped to
  201/404/409/422, duplicate-email conflict handling, partial updates; tests
  for every status-code path."
- **My review:** verified the route-order gotcha (`/filter-options` must be
  registered before `/:id`) and the update-email conflict edge case
  (changing an employee's email to another employee's email → 409).

### 7. Analytics API
- **Prompt:** "Analytics summary endpoint: avg/median/min/max by country and
  department normalized to USD via a fixed FX table, salary histogram, org
  totals — aggregation in SQL, median via window functions."
- **Bug I found and fixed:** a `ReferenceError: bigint is not defined` at
  runtime — `bigint` had ended up used as a value instead of a type; the fix
  was converting SQL BigInt results with `Number(...)`. Understanding this
  clarified the type-erasure boundary and Prisma's BigInt behavior for me.
- **Deep-dive:** asked for a line-by-line explanation of the median SQL
  (ROW_NUMBER/COUNT window functions, odd vs even group sizes) before
  committing it.

### 8. Frontend: table page
- **Prompt:** "React + Vite + Mantine employee table wired to the list API:
  debounced search, filter dropdowns, header-click sorting, pagination, with
  React Query."
- **My decision:** chose ESLint over Oxlint at scaffold time (mature React
  hooks rules, standard toolchain).

### 9. Frontend: create/edit/delete
- **Prompt:** "Reusable create/edit modal with validation mirroring the API's
  zod rules, delete confirmation dialog, toasts, cache invalidation."
- **My review:** tested the duplicate-email 409 surfacing as a toast, and the
  form-remount fix (`key` prop) so edit always shows fresh values.

### 10. Frontend: insights dashboard
- **Prompt:** "Insights page from the analytics endpoint: summary cards,
  avg+median bar charts by country/department (tabbed), salary distribution
  histogram, stats tables, using Recharts."
- **My review:** sanity-checked the numbers against the seed ranges (e.g., US
  highest / India lowest average in USD) and verified histogram buckets sum to
  total headcount.

### 11. Documentation
- **Prompt:** "Help me write architecture.md and decisions.md collecting the
  trade-offs made during the build."
- **Outcome:** docs in this folder; all content reflects decisions actually
  made (and in several cases debugged) during development.
