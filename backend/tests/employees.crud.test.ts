import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/index";
import { prisma } from "../src/lib/prisma";
import { getAuthHeader } from "./helpers";

let auth: string;

const validEmployee = {
    name: "Jane Doe",
    email: "jane.doe@test.com",
    country: "India",
    department: "Engineering",
    jobTitle: "Software Engineer",
    salary: 500000,
    currency: "INR",
    joiningDate: "2023-06-15",
};

beforeEach(async () => {
    auth = await getAuthHeader();
    await prisma.employee.deleteMany();
});

describe("POST /api/employees", () => {
    it("creates an employee and returns 201", async () => {
        const res = await request(app).post("/api/employees").set("Authorization", auth).send(validEmployee);
        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.email).toBe("jane.doe@test.com");
    });

    it("returns 409 for a duplicate email", async () => {
        await request(app).post("/api/employees").set("Authorization", auth).send(validEmployee);
        const res = await request(app).post("/api/employees").set("Authorization", auth).send(validEmployee);
        expect(res.status).toBe(409);
    });

    it("returns 422 for a negative salary", async () => {
        const res = await request(app)
            .post("/api/employees")
            .set("Authorization", auth)
            .send({ ...validEmployee, salary: -100 });
        expect(res.status).toBe(422);
    });

    it("returns 422 for an invalid email", async () => {
        const res = await request(app)
            .post("/api/employees")
            .set("Authorization", auth)
            .send({ ...validEmployee, email: "not-an-email" });
        expect(res.status).toBe(422);
    });

    it("returns 422 when required fields are missing", async () => {
        const res = await request(app).post("/api/employees").set("Authorization", auth).send({ name: "Only Name" });
        expect(res.status).toBe(422);
    });
});

describe("GET /api/employees/:id", () => {
    it("returns the employee when it exists", async () => {
        const created = await request(app).post("/api/employees").set("Authorization", auth).send(validEmployee);
        const res = await request(app).get(`/api/employees/${created.body.id}`).set("Authorization", auth);
        expect(res.status).toBe(200);
        expect(res.body.name).toBe("Jane Doe");
    });

    it("returns 404 for a missing employee", async () => {
        const res = await request(app).get("/api/employees/99999").set("Authorization", auth);
        expect(res.status).toBe(404);
    });

    it("returns 422 for a non-numeric id", async () => {
        const res = await request(app).get("/api/employees/abc").set("Authorization", auth);
        expect(res.status).toBe(422);
    });
});

describe("PUT /api/employees/:id", () => {
    it("updates provided fields only", async () => {
        const created = await request(app).post("/api/employees").set("Authorization", auth).send(validEmployee);
        const res = await request(app)
            .put(`/api/employees/${created.body.id}`)
            .set("Authorization", auth)
            .send({ salary: 750000 });
        expect(res.status).toBe(200);
        expect(Number(res.body.salary)).toBe(750000);
        expect(res.body.name).toBe("Jane Doe"); // unchanged
    });

    it("returns 404 when updating a missing employee", async () => {
        const res = await request(app)
            .put("/api/employees/99999")
            .set("Authorization", auth)
            .send({ salary: 100 });
        expect(res.status).toBe(404);
    });

    it("returns 409 when changing email to one that exists", async () => {
        await request(app).post("/api/employees").set("Authorization", auth).send(validEmployee);
        const other = await request(app)
            .post("/api/employees")
            .set("Authorization", auth)
            .send({ ...validEmployee, email: "other@test.com" });

        const res = await request(app)
            .put(`/api/employees/${other.body.id}`)
            .set("Authorization", auth)
            .send({ email: "jane.doe@test.com" });
        expect(res.status).toBe(409);
    });
});

describe("DELETE /api/employees/:id", () => {
    it("deletes and returns 204, then the employee is gone", async () => {
        const created = await request(app).post("/api/employees").set("Authorization", auth).send(validEmployee);
        const del = await request(app).delete(`/api/employees/${created.body.id}`).set("Authorization", auth);
        expect(del.status).toBe(204);

        const get = await request(app).get(`/api/employees/${created.body.id}`).set("Authorization", auth);
        expect(get.status).toBe(404);
    });

    it("returns 404 for a missing employee", async () => {
        const res = await request(app).delete("/api/employees/99999").set("Authorization", auth);
        expect(res.status).toBe(404);
    });
});
