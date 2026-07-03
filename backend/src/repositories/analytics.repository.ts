import { prisma } from "../lib/prisma";
import { FX_TO_USD } from "../config/fx";

// SQL expression converting each row's salary to USD.
// Built from the static FX config (trusted, not user input) — safe to inline.
const USD = `(salary * CASE currency ${Object.entries(FX_TO_USD)
    .map(([code, rate]) => `WHEN '${code}' THEN ${rate}`)
    .join(" ")} ELSE 0 END)`;

// Only these two columns may be grouped on — never interpolate user input.
type GroupColumn = "country" | "department";

const BUCKET_SIZE = 25_000; // histogram bucket width in USD

export const analyticsRepository = {
    // Headcount, average, min, max per group
    async groupStats(column: GroupColumn) {
        const rows = await prisma.$queryRawUnsafe<
            { grp: string; headcount: bigint; avgUsd: number; minUsd: number; maxUsd: number }[]
        >(`
      SELECT ${column} AS grp,
             COUNT(*)   AS headcount,
             AVG(${USD}) AS avgUsd,
             MIN(${USD}) AS minUsd,
             MAX(${USD}) AS maxUsd
      FROM Employee
      GROUP BY ${column}
      ORDER BY ${column} ASC
    `);
        return rows.map((r) => ({
            group: r.grp,
            headcount: Number(r.headcount),
            avgUsd: Math.round(Number(r.avgUsd)),
            minUsd: Math.round(Number(r.minUsd)),
            maxUsd: Math.round(Number(r.maxUsd)),
        }));
    },

    // Median per group: rank rows within each group; the median is the middle
    // row (odd count) or the average of the two middle rows (even count).
    async groupMedians(column: GroupColumn) {
        const rows = await prisma.$queryRawUnsafe<{ grp: string; medianUsd: number }[]>(`
      WITH ranked AS (
        SELECT ${column} AS grp,
               ${USD} AS usd,
               ROW_NUMBER() OVER (PARTITION BY ${column} ORDER BY ${USD}) AS rn,
               COUNT(*)    OVER (PARTITION BY ${column})                  AS cnt
        FROM Employee
      )
      SELECT grp, AVG(usd) AS medianUsd
      FROM ranked
      WHERE rn IN (FLOOR((cnt + 1) / 2), CEIL((cnt + 1) / 2))
      GROUP BY grp
    `);
        return new Map(rows.map((r) => [r.grp, Math.round(Number(r.medianUsd))]));
    },

    // Salary distribution in fixed USD buckets
    async histogram() {
        const rows = await prisma.$queryRawUnsafe<{ bucket: bigint; count: bigint }[]>(`
      SELECT FLOOR(${USD} / ${BUCKET_SIZE}) AS bucket, COUNT(*) AS count
      FROM Employee
      GROUP BY bucket
      ORDER BY bucket ASC
    `);
        return rows.map((r) => {
            const b = Number(r.bucket);
            return {
                range: `$${(b * BUCKET_SIZE) / 1000}k–$${((b + 1) * BUCKET_SIZE) / 1000}k`,
                count: Number(r.count),
            };
        });
    },

    async orgTotals() {
        const rows = await prisma.$queryRawUnsafe<
            { total: bigint; avgUsd: number }[]
        >(`SELECT COUNT(*) AS total, AVG(${USD}) AS avgUsd FROM Employee`);
        return {
            totalEmployees: Number(rows[0].total),
            avgSalaryUsd: Math.round(Number(rows[0].avgUsd)),
        };
    },
};