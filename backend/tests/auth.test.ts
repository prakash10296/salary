import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/index";

describe("POST /api/auth/login", () => {
    it("returns a token for valid credentials", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: process.env.HR_EMAIL,
            password: process.env.HR_PASSWORD,
        });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.role).toBe("HR_MANAGER");
    });

    it("returns 401 for wrong password", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: process.env.HR_EMAIL,
            password: "wrong-password",
        });
        expect(res.status).toBe(401);
    });

    it("returns 422 when fields are missing", async () => {
        const res = await request(app).post("/api/auth/login").send({});
        expect(res.status).toBe(422);
    });
});

describe("protected routes", () => {
    it("rejects requests without a token", async () => {
        const res = await request(app).get("/api/employees");
        expect(res.status).toBe(401);
    });

    it("rejects requests with an invalid token", async () => {
        const res = await request(app)
            .get("/api/employees")
            .set("Authorization", "Bearer not-a-real-token");
        expect(res.status).toBe(401);
    });
});