import { employeeRepository } from "../repositories/employee.repository";
import { ListEmployeesQuery } from "../validators/employee.validators";

export const employeeService = {
    async list(query: ListEmployeesQuery) {
        const { items, total } = await employeeRepository.findMany(query);
        return {
            items,
            total,
            page: query.page,
            pageSize: query.pageSize,
            totalPages: Math.ceil(total / query.pageSize),
        };
    },

    async getFilterOptions() {
        return employeeRepository.getFilterOptions();
    },
};