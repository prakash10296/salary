import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../src/index";
import { prisma } from "../src/lib/prisma";
import { getAuthHeader } from "./helpers";

let auth: string;

// Small, fully known dataset — 25 employees across 2 countries / 2 departments
function testEmployees() {
    const rows = [];
    for (let i = 1; i <= 25; i++) {
        const inIndia = i <= 15; // 15 India, 10 US
        rows.push({
            name: `Employee ${String(i).padStart(2, "0")}`,
            email: `employee${i}@test.com`,
            country: inIndia ? "India" : "United States",
            currency: inIndia ? "INR" : "USD",
            department: i % 2 === 0 ? "Engineering" : "Sales",
            jobTitle: "Software Engineer",
            salary: 1000 * i, // strictly increasing — makes sort assertions trivial
            joiningDate: new Date(2020, 0, i),
        });
    }
    return rows;
}

beforeAll(async () => {
    auth = await getAuthHeader();
    await prisma.employee.deleteMany();
    await prisma.employee.createMany({ data: testEmployees() });
});

describe("GET /api/employees", () => {
    it("returns paginated results with correct metadata", async () => {
        const res = await request(app).get("/api/employees").set("Authorization", auth);
        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(20); // default pageSize
        expect(res.body.total).toBe(25);
        expect(res.body.totalPages).toBe(2);
    });

    it("returns the remaining items on page 2", async () => {
        const res = await request(app).get("/api/employees?page=2").set("Authorization", auth);
        expect(res.status).toBe(200);
        expect(res.body.items).toHaveLength(5);
    });

    it("filters by country", async () => {
        const res = await request(app).get("/api/employees?country=India").set("Authorization", auth);
        expect(res.body.total).toBe(15);
        expect(res.body.items.every((e: any) => e.country === "India")).toBe(true);
    });

    it("combines filters (country + department)", async () => {
        const res = await request(app)
            .get("/api/employees?country=India&department=Engineering")
            .set("Authorization", auth);
        expect(res.body.items.every(
            (e: any) => e.country === "India" && e.department === "Engineering"
        )).toBe(true);
    });

    it("searches by name", async () => {
        const res = await request(app).get("/api/employees?search=Employee 07").set("Authorization", auth);
        expect(res.body.total).toBe(1);
        expect(res.body.items[0].email).toBe("employee7@test.com");
    });

    it("sorts by salary descending", async () => {
        const res = await request(app)
            .get("/api/employees?sortBy=salary&sortOrder=desc")
            .set("Authorization", auth);
        expect(Number(res.body.items[0].salary)).toBe(25000);
        expect(Number(res.body.items[1].salary)).toBe(24000);
    });

    it("rejects pageSize above the cap with 422", async () => {
        const res = await request(app).get("/api/employees?pageSize=9999").set("Authorization", auth);
        expect(res.status).toBe(422);
        expect(res.body.error).toBe("Invalid query parameters");
    });

    it("rejects an unknown sortBy with 422", async () => {
        const res = await request(app).get("/api/employees?sortBy=hacker").set("Authorization", auth);
        expect(res.status).toBe(422);
    });
});

describe("GET /api/employees/filter-options", () => {
    it("returns distinct sorted countries and departments", async () => {
        const res = await request(app).get("/api/employees/filter-options").set("Authorization", auth);
        expect(res.status).toBe(200);
        expect(res.body.countries).toEqual(["India", "United States"]);
        expect(res.body.departments).toEqual(["Engineering", "Sales"]);
    });
});