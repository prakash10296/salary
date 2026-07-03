import axios from "axios";

export const api = axios.create({ baseURL: "http://localhost:3001/api" });

export interface Employee {
    id: number;
    name: string;
    email: string;
    country: string;
    department: string;
    jobTitle: string;
    salary: string; // Prisma Decimal serializes as string
    currency: string;
    joiningDate: string;
}

export interface EmployeeListResponse {
    items: Employee[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface EmployeeListParams {
    page?: number;
    pageSize?: number;
    search?: string;
    country?: string;
    department?: string;
    sortBy?: "name" | "salary" | "joiningDate";
    sortOrder?: "asc" | "desc";
}

export const employeeApi = {
    list: (params: EmployeeListParams) =>
        api.get<EmployeeListResponse>("/employees", { params }).then((r) => r.data),

    filterOptions: () =>
        api
            .get<{ countries: string[]; departments: string[] }>("/employees/filter-options")
            .then((r) => r.data),
};