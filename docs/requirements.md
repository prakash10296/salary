# Salary Management System — Requirements Document

## Goal

Replace ACME's Excel-based salary tracking with a web application that lets the HR Manager manage salary data for ~10,000 employees across multiple countries, and answer questions about how the organization pays people.

## User Persona

A single primary user: the **HR Manager**. They need to find employees quickly, keep salary records accurate, and get compensation insights without exporting to Excel.

## Scope & Features

### 1. Employee Directory
- Paginated, searchable list of all 10,000 employees (server-side pagination for performance).
- Search by name/email; filter by country and department; sort by name, salary, or joining date.

### 2. Salary Record Management (CRUD)
- Create, view, edit, and delete employee records.
- Fields: name, email, country, department, job title, salary amount, currency, joining date.
- Server-side validation (e.g., salary must be positive, email unique and well-formed).

### 3. Compensation Insights
Answers "how does the org pay people":
- Average and median salary by country and by department (normalized to USD via a fixed conversion table).
- Salary distribution (histogram) across the org.
- Headcount by country/department.

### 4. Data Seeding
- Repeatable seed script generating 10,000 realistic employees across multiple countries, departments, and currencies.

## Technical Approach (summary)

- **Backend:** Node.js + Express + TypeScript, MySQL via Prisma ORM (migrations, type-safe queries, seed tooling).
- **Frontend:** React + Vite + TypeScript with [component library], charts via Recharts.
- **Tests:** Vitest + Supertest covering CRUD validation, pagination/filtering, and analytics aggregations — fast and deterministic (isolated test database).
- Layered structure: routes → services → repositories, validation via zod.

## Deliberately Out of Scope (and why)

| Excluded | Reasoning |
|---|---|
| Authentication & roles | Single-persona exercise; auth adds setup cost without demonstrating the core problem. Would be the first production addition. |
| Payroll processing / payslips | The problem is managing salary *data*, not executing payroll runs. |
| Live FX rates | A fixed currency conversion table is sufficient for comparative insights; live rates add an external dependency with no assessment value. |
| Bulk Excel import/export | High-value future feature (given the Excel pain point), but CRUD + seeding demonstrates the data model adequately. Noted as the top roadmap item. |
| Audit history of salary changes | Valuable in production for compliance; deferred to keep the schema and UI focused. |

## Success Criteria

- HR Manager can find any employee in under a few seconds despite 10k records.
- All salary changes validated and persisted reliably.
- Insights page answers pay-distribution questions at a glance.
- Codebase is small enough to read in one sitting, with tests documenting core behavior.
