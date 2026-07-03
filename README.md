# ACME Salary Management System

A web application for an HR Manager to manage salary data for 10,000
employees across multiple countries, and answer questions about how the
organization pays people.

**Take-home assessment submission.**

## Features

- **Employee directory** — server-side paginated table over 10,000 records
  with debounced search, country/department filters, and column sorting
- **Salary record management** — create, edit, and delete employees with
  full validation (client + server)
- **Compensation insights** — average/median salary by country and
  department (USD-normalized), salary distribution histogram, headcount
  stats
- **Deterministic seeding** — 10,000 realistic employees, same data every run

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 22, Express, TypeScript, Prisma 6 |
| Database | MySQL 8 |
| Frontend | React 18, Vite, TypeScript, Mantine, React Query, Recharts |
| Tests | Vitest + Supertest (integration tests on a real test database) |

## Documentation

- [Requirements & scope decisions](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [Design decisions & trade-offs](docs/decisions.md)
- [AI usage log](docs/ai-usage.md)

## Getting Started

### Option 1 — Docker (recommended, one command)

Prerequisite: Docker Desktop.

```bash
docker compose up --build
```

Wait for the seed to finish (`Inserted 10000 / 10000` in the logs), then open:

- **App:** http://localhost:5173
- **Login:** `hr@acme.com` / `hr789`
- API runs on http://localhost:3001 (health check: `/health`)

Notes:
- First build takes a few minutes; subsequent starts are fast.
- The database is re-seeded deterministically on each backend start
  (same 10,000 employees every time).

### Option 2 — Manual setup

<details>
<summary>Run backend and frontend directly on your machine</summary>

### Prerequisites

- Node.js 22+ (`nvm use` picks it up from `.nvmrc`)
- MySQL 8 running locally

### 1. Database setup

Create the databases (dev + test):

```sql
CREATE DATABASE IF NOT EXISTS salary;
CREATE DATABASE IF NOT EXISTS salary_test;
```

### 2. Backend

```bash
cd backend
npm install
# configure the connection:
#   copy .env.example to .env and set your MySQL credentials
npx prisma migrate dev     # creates tables
npx prisma db seed         # seeds 10,000 employees (~5 seconds)
npm run dev                # API on http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                # UI on http://localhost:5173
```

### 4. Tests

```bash
cd backend
npm test                   # 26 integration tests against salary_test
```

</details>

### Running tests

Tests run on your machine (not in Docker) against `salary_test`:

```bash
cd backend
npm install
npm test        # 31 integration tests
```

If using the Docker MySQL, the test database is created automatically
and `.env` should contain:
`DATABASE_URL="mysql://root:password@localhost:3306/salary"`
plus the JWT_SECRET / HR_EMAIL / HR_PASSWORD values from `.env.example`.
