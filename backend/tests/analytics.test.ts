import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/index";
import { prisma } from "../src/lib/prisma";

// Known dataset with hand-computable answers:
// US:    salaries 50k, 100k, 150k USD → avg 100k, median 100k
// India: 4 employees at 1,000,000 INR → 12,000 USD each (rate 0.012)
const base = { department: "Engineering", jobTitle: "Engineer", joiningDate: new Date("2022-01-01") };

beforeAll(async () => {
    await prisma.employee.deleteMany();
    await prisma.employee.createMany({
        data: [
            { ...base, name: "US 1", email: "us1@test.com", country: "United States", currency: "USD", salary: 50000 },
            { ...base, name: "US 2", email: "us2@test.com", country: "United States", currency: "USD", salary: 100000 },
            { ...base, name: "US 3", email: "us3@test.com", country: "United States", currency: "USD", salary: 150000, department: "Sales" },
            { ...base, name: "IN 1", email: "in1@test.com", country: "India", currency: "INR", salary: 1000000 },
            { ...base, name: "IN 2", email: "in2@test.com", country: "India", currency: "INR", salary: 1000000 },
            { ...base, name: "IN 3", email: "in3@test.com", country: "India", currency: "INR", salary: 1000000 },
            { ...base, name: "IN 4", email: "in4@test.com", country: "India", currency: "INR", salary: 1000000, department: "Sales" },
        ],
    });
});

describe("GET /api/analytics/summary", () => {
    it("returns org totals", async () => {
        const res = await request(app).get("/api/analytics/summary");
        expect(res.status).toBe(200);
        expect(res.body.totals.totalEmployees).toBe(7);
    });

    it("computes average and median by country in USD", async () => {
        const res = await request(app).get("/api/analytics/summary");
        const us = res.body.byCountry.find((c: any) => c.group === "United States");
        const india = res.body.byCountry.find((c: any) => c.group === "India");

        expect(us.headcount).toBe(3);
        expect(us.avgUsd).toBe(100000);
        expect(us.medianUsd).toBe(100000);

        expect(india.headcount).toBe(4);
        expect(india.avgUsd).toBe(12000);   // 1,000,000 INR * 0.012
        expect(india.medianUsd).toBe(12000);
    });

    it("groups by department across currencies", async () => {
        const res = await request(app).get("/api/analytics/summary");
        const eng = res.body.byDepartment.find((d: any) => d.group === "Engineering");
        expect(eng.headcount).toBe(5); // 2 US + 3 India
    });

    it("returns histogram buckets that sum to total employees", async () => {
        const res = await request(app).get("/api/analytics/summary");
        const sum = res.body.histogram.reduce((acc: number, b: any) => acc + b.count, 0);
        expect(sum).toBe(7);
    });
});