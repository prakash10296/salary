import express from "express";
import cors from "cors";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

if (process.env.NODE_ENV !== "test") {
    app.listen(3001, () => console.log("API running on http://localhost:3001"));
}