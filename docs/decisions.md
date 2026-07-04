# Design Decisions & Trade-offs

A log of the notable decisions made during this project, and the reasoning behind them.

## Stack & Tooling

**Node.js 22 (LTS), pinned in `.nvmrc` and `engines`.** LTS for stability; the pin means anyone cloning the repo gets a known-good version.

**Prisma pinned to v6.** Prisma 7 introduced a new config system (`prisma.config.ts`) that is still settling across the ecosystem. For an assessment, predictable tooling beats the newest version. Trade-off: forgoing v7 features we don't need here.

**Express over NestJS/Fastify.** The problem doesn't need a heavyweight framework; a thin Express app with explicit layering shows the architecture instead of hiding it behind decorators. Fastify would be the choice if raw throughput mattered.

**Mantine as the component library.** Complete set of accessible components (table, modal, form, notifications, selects) with minimal setup — lets the assessment focus on data flow rather than CSS.

**React Query for server state.** Eliminates hand-rolled loading/error/caching logic; `queryKey` per filter combination gives request deduplication and caching for free; `invalidateQueries` keeps the table consistent after mutations.

**ESLint over Oxlint.** Mature React hooks rules (missing-dependency detection catches real bugs) and the toolchain any reviewer recognizes. Oxlint is promising but its rule coverage is still a subset.

## Authentication

**Mock auth per HR's clarification, implemented as a real JWT flow.** "Mock" is interpreted as *one hardcoded user from environment config* — but the token mechanics (signed JWT, 8h expiry, Bearer middleware, 401 handling) are production-shaped. This keeps the frontend integration realistic and makes the upgrade path (a user table with bcrypt-hashed passwords, refresh tokens, role checks) a data change rather than an architecture change.

**Credentials and JWT secret in env config, never in code.** Demo values are set in docker-compose for reviewer convenience; a secrets manager would hold them in production.

**Token in localStorage — a conscious assessment-scope choice.** Simple, and survives page refresh. The production-grade alternative is an httpOnly cookie (immune to XSS reading the token) with CSRF protection; documented as the upgrade path.

**Axios interceptors centralize auth.** A request interceptor attaches the Bearer token so no individual API call knows about tokens; a response interceptor catches 401s, clears the session, and returns to login — with a guard so a failed *login attempt* shows an inline error instead of reloading the page.

**Demo credentials shown on the login screen.** Deliberate friction-removal for the reviewer; would never ship in production.

## Data Modeling

**`Decimal(12,2)` for salary — never Float.** Floating point cannot represent most decimal fractions exactly; money arithmetic in Float produces rounding errors. Decimal is exact.

**Salary stored in local currency + ISO 4217 code.** Storing converted USD would bake a conversion rate into the data. Instead, conversion happens at read time in analytics, so rates can change without data migration.

**Indexes on `country`, `department`, `name`.** These are the filter/search columns. At 10k rows MySQL would survive without them, but the intent is correctness of design, not just adequacy at current scale.

**Duplicate email: checked in service *and* enforced by DB unique constraint.** The service check gives a clean 409 with a helpful message; the constraint is the safety net against race conditions (two simultaneous creates).

## API Design

**Validation at the boundary with zod.** Malformed input is rejected in the route with 422 + field-level details before it can reach business logic. `z.coerce` handles the everything-is-a-string nature of query params.

**`pageSize` capped at 100.** No client can pull 10k rows in one request. The cap is enforced server-side, not just by UI convention.

**Typed domain errors instead of HTTP-aware services.** Services throw `NotFoundError` / `ConflictError`; only routes translate them into 404/409. Services stay framework-agnostic and testable in isolation.

**`findMany` + `count` in `Promise.all`.** The list query and total count are independent; running them in parallel halves the latency of every list request.

**PUT accepts partial updates (`schema.partial()`).** Every provided field is fully validated; omitted fields are untouched. Pragmatic for a single-resource form UI.

## Analytics

**Aggregation in SQL, not in memory.** Loading 10k rows into Node to compute averages would work today and fall over at 1M. `GROUP BY` returns ~20 rows.

**Median via window functions.** MySQL lacks `MEDIAN()`. `ROW_NUMBER()`/`COUNT() OVER (PARTITION BY ...)` finds the middle row (odd counts) or averages the two middle rows (even counts) — correct for both cases.

**Fixed FX table instead of live rates.** A live FX API adds an external dependency, an API key, network failure modes, and non-deterministic test behavior — without improving the quality of *comparative* insights. Documented as a conscious exclusion; the config shape (`src/config/fx.ts`) makes swapping in a live source straightforward later.

**`$queryRawUnsafe` justification.** The interpolated pieces are (a) a CASE expression generated from the static FX config and (b) a group column constrained to the TypeScript union `"country" | "department"`. No user input ever reaches the SQL string. Prisma's typed API can't express window functions, hence raw SQL.

**BigInt handling.** MySQL `COUNT(*)` arrives as BigInt through Prisma raw queries, and `JSON.stringify` throws on BigInt — all aggregates are converted with `Number()` at the repository boundary. (This surfaced as a real runtime bug during development — `bigint` used as a value instead of a type — and the fix clarified the type-erasure boundary.)

## Frontend

**Debounced search (300ms).** One request when the user pauses typing instead of one per keystroke.

**Filter changes reset to page 1.** Otherwise a user on page 400 who applies a filter lands on an empty page.

**Salary displayed in local currency in the table; USD only in analytics.** An HR manager editing an Indian employee's salary thinks in INR; cross-country comparison is where normalization belongs.

**Form modal remounted per employee (`key` prop).** Mantine's `useForm` reads `initialValues` only on mount; keying by employee id guarantees the edit form always shows the selected row's data.

**State-based navigation instead of react-router.** Two pages (plus an auth gate) don't justify a routing dependency. First thing to add if the app grows.

**Production build as a type-check gate.** Vite's dev server only transpiles — it does not type-check. The production build (`tsc -b && vite build`) enforces types strictly, and it caught a real bug the dev server never showed: a Recharts `Tooltip formatter` callback typed as `value: number` when the library supplies `ValueType | undefined`. Fix: infer the parameter type and convert defensively (`Number(value ?? 0)`). Lesson applied: run `npm run build` locally before packaging — dev mode passing is not evidence the types are sound.

## Testing

**Real test database over mocks.** Mocked repositories would pass even if the actual SQL were wrong. Tests run against `salary_test` (schema pushed automatically in global setup), verifying real query behavior — pagination math, combined filters, window-function medians, and the full auth flow.

**Auth in tests via a shared helper.** One login per run, cached Bearer header applied to every protected request — plus dedicated tests proving protected routes reject missing and invalid tokens.

**Hand-computable fixtures.** Test data is designed so expected values can be checked on paper: salaries of `1000 * i` make sort order self-evident; the analytics fixture (3 US salaries 50k/100k/150k, 4 Indian at 1M INR) has pen-and-paper averages and medians.

**Deterministic seed (`faker.seed(42)`).** The same 10,000 employees are generated every run — reproducible demos and consistent local data.

**Batched seeding (1,000 rows per `createMany`).** 10 bulk inserts instead of 10,000 single inserts: seconds instead of minutes.

## Deployment

**Docker Compose per HR's clarification** ("Dockerized local setup with clear, comprehensive run instructions"). One command starts MySQL, the API, and the UI — zero manual setup for the reviewer.

**Healthcheck-gated startup ordering.** The backend waits on MySQL's healthcheck (`condition: service_healthy`), not just container start — avoiding the classic connect-before-ready race.

**Auto-migrate-and-seed on backend boot.** `prisma migrate deploy` + the deterministic seed run on every start, so a fresh clone reaches a working, populated app with no steps. Trade-off: data resets to the seeded 10k on each restart — acceptable (arguably desirable) for an assessment; a production system would seed once and never on boot.

**Frontend served by nginx from a multi-stage build.** Production Vite build as static files — small image, no Node process in the serving path.

**Tests run on the host, not in Docker.** They need dev dependencies and an isolated DB; the compose MySQL init script creates `salary_test` so host-run tests work against the containerized database too.

**MySQL published on host port 3307, not 3306.** The backend reaches MySQL over
Docker's internal network (`mysql:3306`), so the published port exists only for
host-side access (DB tools, host-run tests). Mapping to 3307 avoids colliding
with a local MySQL installation — on the developer's machine and on any
reviewer's machine alike.

## Deliberately Excluded (summary — full reasoning in requirements.md)

- Multi-user auth, roles, registration — single mock HR Manager per HR's clarification; user table + bcrypt is the production path.
- Payroll processing — managing salary data, not executing payroll.
- Live FX rates — see above.
- Bulk Excel import/export — top roadmap item given the Excel pain point; CRUD + seeding demonstrates the data model.
- Salary change audit history — valuable for compliance; deferred to keep schema and UI focused.
- Public deployment — HR confirmed local Docker setup is acceptable.
