import { analyticsRepository } from "../repositories/analytics.repository";

async function groupSummary(column: "country" | "department") {
    const [stats, medians] = await Promise.all([
        analyticsRepository.groupStats(column),
        analyticsRepository.groupMedians(column),
    ]);
    return stats.map((s) => ({ ...s, medianUsd: medians.get(s.group) ?? 0 }));
}

export const analyticsService = {
    async summary() {
        const [byCountry, byDepartment, histogram, totals] = await Promise.all([
            groupSummary("country"),
            groupSummary("department"),
            analyticsRepository.histogram(),
            analyticsRepository.orgTotals(),
        ]);
        return { totals, byCountry, byDepartment, histogram };
    },
};