import { execSync } from "node:child_process";
import "dotenv/config";

export default function setup() {
    const testUrl = process.env.DATABASE_URL!.replace("salary", "salary_test");
    execSync("npx prisma db push --skip-generate", {
        env: { ...process.env, DATABASE_URL: testUrl },
        stdio: "inherit",
    });
}