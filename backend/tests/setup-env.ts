import "dotenv/config";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL!.replace(
    "salary",
    "salary_test"
);