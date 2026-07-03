import { z } from "zod";

export const listEmployeesQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    department: z.string().trim().max(100).optional(),
    sortBy: z.enum(["name", "salary", "joiningDate"]).default("name"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
