# Salary Management System — Requirements Document

## Goal

Replace ACME's Excel-based salary tracking with a web application that lets the HR Manager manage salary data for ~10,000 employees across multiple countries, and answer questions about how the organization pays people.

## User Persona

A single primary user: the **HR Manager**. They need to sign in securely, find employees quickly, keep salary records accurate, and get compensation insights without exporting to Excel.

## Scope & Features

### 1. Authentication
- Single HR Manager role with mock authentication (per HR clarification: "a single authenticated HR Manager role is perfectly sufficient... simple mock authentication").
- Real JWT token flow (login endpoint, Bearer middleware, 8h expiry, auto-logout on expiry) with one user configured via environment variables — no user table or registration.
- All employee and analytics APIs require authentication.

### 2. Employee Directory
- Paginated, searchable list of all 10,000 employees (server-side pagination for performance).
- Search by name/email; filter by country and department; sort by name, salary, or joining date.

### 3. Salary Record Management (CRUD)
- Create, view, edit, and delete employee records.
- Fields: name, email, country, department, job title, salary amount, currency, joining date.
- Server-side validation (e.g., salary must be positive, email unique and well-formed), mirrored client-side for instant feedback.

### 4. Compensation Insights
Answers "how does the org pay people":
- Average, median, min, and max salary by country and by department (normalized to USD via a fixed conversion table).
- Salary distribution (histogram) across the org.
- Headcount by country/department and org-wide totals.

### 5. Data Seeding
- Repeatable, deterministic seed script generating 10,000 realistic employees across multiple countries, departments, and currencies.

### 6. Delivery
- Dockerized local setup: the full stack (MySQL, API, UI) starts with one `docker compose up` command (per HR clarification: "a Dockerized local setup with clear, comprehensive run instructions is perfectly acceptable" — no public URL required).
- Video demo of the software.

## Technical Approach (summary)

- **Backend:** Node.js 22 + Express + TypeScript, MySQL via Prisma ORM (migrations, type-safe queries, seed tooling), JWT authentication.
- **Frontend:** React + Vite + TypeScript with Mantine, charts via Recharts, server state via React Query.
- **Tests:** Vitest + Supertest — 31 integration tests covering auth, CRUD validation, pagination/filtering, and analytics aggregations — fast and deterministic (isolated test database).
- Layered structure: routes → services → repositories, validation via zod.
- **Packaging:** Docker Compose (MySQL + backend + frontend), automatic migration and seeding on startup.

## Deliberately Out of Scope (and why)

| Excluded | Reasoning |
|---|---|
| Multi-user auth, roles, registration | HR confirmed a single mock-authenticated HR Manager is sufficient. A user table with hashed passwords (bcrypt) and role-based access is the documented production path. |
| Payroll processing / payslips | The problem is managing salary *data*, not executing payroll runs. |
| Live FX rates | A fixed currency conversion table is sufficient for comparative insights; live rates add an external dependency with no assessment value. |
| Bulk Excel import/export | High-value future feature (given the Excel pain point), but CRUD + seeding demonstrates the data model adequately. Noted as the top roadmap item. |
| Audit history of salary changes | Valuable in production for compliance; deferred to keep the schema and UI focused. |
| Public deployment | HR confirmed Dockerized local setup is acceptable. |

## Success Criteria

- Reviewer can run the entire system with one command and log in immediately.
- HR Manager can find any employee in under a few seconds despite 10k records.
- All salary changes validated and persisted reliably; unauthenticated access rejected.
- Insights page answers pay-distribution questions at a glance.
- Codebase is small enough to read in one sitting, with tests documenting core behavior.
