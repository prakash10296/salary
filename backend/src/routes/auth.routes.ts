import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";

export const authRouter = Router();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

authRouter.post("/login", (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(422).json({ error: "Email and password are required" });
    }

    const { email, password } = parsed.data;
    // Mock auth: single HR Manager user from environment config.
    if (email !== process.env.HR_EMAIL || password !== process.env.HR_PASSWORD) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
        { sub: "hr-manager", role: "HR_MANAGER", email },
        process.env.JWT_SECRET!,
        { expiresIn: "8h" }
    );

    res.json({ token, user: { email, role: "HR_MANAGER" } });
});