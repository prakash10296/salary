import axios from "axios";

export const api = axios.create({ baseURL: "http://localhost:3001/api" });

const TOKEN_KEY = "salary_app_token";

// Attach the token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Expired/invalid token → clear session and return to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginCall = error.config?.url?.includes("/auth/login");
        if (error.response?.status === 401 && !isLoginCall) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem("salary_app_email");
            window.location.reload(); // AuthProvider re-initializes → login screen
        }
        return Promise.reject(error);
    }
);

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

export interface EmployeeFormData {
    name: string;
    email: string;
    country: string;
    department: string;
    jobTitle: string;
    salary: number;
    currency: string;
    joiningDate: string; // yyyy-mm-dd
}

export interface GroupStats {
    group: string;
    headcount: number;
    avgUsd: number;
    medianUsd: number;
    minUsd: number;
    maxUsd: number;
}

export interface AnalyticsSummary {
    totals: { totalEmployees: number; avgSalaryUsd: number };
    byCountry: GroupStats[];
    byDepartment: GroupStats[];
    histogram: { range: string; count: number }[];
}

export const analyticsApi = {
    summary: () => api.get<AnalyticsSummary>("/analytics/summary").then((r) => r.data),
};

export const employeeApi = {
    list: (params: EmployeeListParams) =>
        api.get<EmployeeListResponse>("/employees", { params }).then((r) => r.data),

    filterOptions: () =>
        api
            .get<{ countries: string[]; departments: string[] }>("/employees/filter-options")
            .then((r) => r.data),

    get: (id: number) => api.get<Employee>(`/employees/${id}`).then((r) => r.data),

    create: (data: EmployeeFormData) =>
        api.post<Employee>("/employees", data).then((r) => r.data),

    update: (id: number, data: Partial<EmployeeFormData>) =>
        api.put<Employee>(`/employees/${id}`, data).then((r) => r.data),

    remove: (id: number) => api.delete(`/employees/${id}`),
};