import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required" });
    }
    try {
        jwt.verify(header.slice(7), process.env.JWT_SECRET!);
        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}