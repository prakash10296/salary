import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

// Country → currency + realistic annual salary range (in local currency)
const COUNTRIES = [
    { country: "United States", currency: "USD", min: 45000, max: 220000 },
    { country: "India", currency: "INR", min: 400000, max: 6000000 },
    { country: "Germany", currency: "EUR", min: 40000, max: 130000 },
    { country: "United Kingdom", currency: "GBP", min: 32000, max: 120000 },
    { country: "Singapore", currency: "SGD", min: 50000, max: 180000 },
    { country: "Brazil", currency: "BRL", min: 60000, max: 350000 },
];

const DEPARTMENTS = [
    "Engineering", "Sales", "Marketing", "Human Resources",
    "Finance", "Operations", "Customer Support", "Product",
];

const JOB_TITLES: Record<string, string[]> = {
    Engineering: ["Software Engineer", "Senior Software Engineer", "Engineering Manager", "QA Engineer", "DevOps Engineer"],
    Sales: ["Sales Executive", "Account Manager", "Sales Director"],
    Marketing: ["Marketing Specialist", "Content Manager", "Marketing Director"],
    "Human Resources": ["HR Executive", "HR Manager", "Recruiter"],
    Finance: ["Accountant", "Financial Analyst", "Finance Manager"],
    Operations: ["Operations Analyst", "Operations Manager"],
    "Customer Support": ["Support Specialist", "Support Team Lead"],
    Product: ["Product Manager", "Product Designer", "Business Analyst"],
};

const TOTAL = 10_000;
const BATCH_SIZE = 1_000;

async function main() {
    faker.seed(42); // deterministic — same 10,000 employees every run

    console.log("Clearing existing employees...");
    await prisma.employee.deleteMany();

    console.log(`Seeding ${TOTAL} employees...`);
    for (let batch = 0; batch < TOTAL / BATCH_SIZE; batch++) {
        const employees = Array.from({ length: BATCH_SIZE }, (_, i) => {
            const loc = faker.helpers.arrayElement(COUNTRIES);
            const department = faker.helpers.arrayElement(DEPARTMENTS);
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const uniqueId = batch * BATCH_SIZE + i;

            return {
                name: `${firstName} ${lastName}`,
                // uniqueId guarantees no duplicate emails at 10k scale
                email: `${firstName}.${lastName}.${uniqueId}@acme.com`
                    .toLowerCase()
                    .replace(/[^a-z0-9.@]/g, ""),
                country: loc.country,
                currency: loc.currency,
                department,
                jobTitle: faker.helpers.arrayElement(JOB_TITLES[department]),
                salary: faker.number.int({ min: loc.min, max: loc.max }),
                joiningDate: faker.date.between({ from: "2015-01-01", to: "2025-12-31" }),
            };
        });

        await prisma.employee.createMany({ data: employees });
        console.log(`  Inserted ${(batch + 1) * BATCH_SIZE} / ${TOTAL}`);
    }

    console.log("Seeding complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());