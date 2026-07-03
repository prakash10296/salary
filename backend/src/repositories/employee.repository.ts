import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ListEmployeesQuery } from "../validators/employee.validators";

function buildWhere(query: ListEmployeesQuery): Prisma.EmployeeWhereInput {
    const where: Prisma.EmployeeWhereInput = {};

    if (query.search) {
        where.OR = [
            { name: { contains: query.search } },
            { email: { contains: query.search } },
        ];
    }
    if (query.country) where.country = query.country;
    if (query.department) where.department = query.department;

    return where;
}

export const employeeRepository = {
    async findMany(query: ListEmployeesQuery) {
        const where = buildWhere(query);

        const [items, total] = await Promise.all([
            prisma.employee.findMany({
                where,
                orderBy: { [query.sortBy]: query.sortOrder },
                skip: (query.page - 1) * query.pageSize,
                take: query.pageSize,
            }),
            prisma.employee.count({ where }),
        ]);

        return { items, total };
    },

    // Distinct values for the UI filter dropdowns
    async getFilterOptions() {
        const [countries, departments] = await Promise.all([
            prisma.employee.findMany({
                distinct: ["country"],
                select: { country: true },
                orderBy: { country: "asc" },
            }),
            prisma.employee.findMany({
                distinct: ["department"],
                select: { department: true },
                orderBy: { department: "asc" },
            }),
        ]);
        return {
            countries: countries.map((c) => c.country),
            departments: departments.map((d) => d.department),
        };
    },
};
