import express from "express";
import cors from "cors";
import { employeeRouter } from "./routes/employee.routes";
import { analyticsRouter } from "./routes/analytics.routes";
import { authRouter } from "./routes/auth.routes";
import { requireAuth } from "./middleware/auth";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/employees", requireAuth, employeeRouter);
app.use("/api/analytics", requireAuth, analyticsRouter);

// Central error handler — routes stay clean, errors get one exit point
app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
);

if (process.env.NODE_ENV !== "test") {
    app.listen(3001, () => console.log("API running on http://localhost:3001"));
}