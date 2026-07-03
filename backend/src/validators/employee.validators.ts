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

export const createEmployeeSchema = z.object({
    name: z.string().trim().min(1).max(150),
    email: z.string().trim().email().max(200),
    country: z.string().trim().min(1).max(100),
    department: z.string().trim().min(1).max(100),
    jobTitle: z.string().trim().min(1).max(150),
    salary: z.coerce.number().positive().max(999_999_999),
    currency: z.string().trim().length(3).toUpperCase(),
    joiningDate: z.coerce.date(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const idParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;