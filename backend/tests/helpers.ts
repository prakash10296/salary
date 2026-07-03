import request from "supertest";
import { app } from "../src/index";

let cached: string | null = null;

/** Logs in once and returns "Bearer <token>" for use with .set() */
export async function getAuthHeader(): Promise<string> {
    if (!cached) {
        const res = await request(app).post("/api/auth/login").send({
            email: process.env.HR_EMAIL,
            password: process.env.HR_PASSWORD,
        });
        cached = `Bearer ${res.body.token}`;
    }
    return cached;
}