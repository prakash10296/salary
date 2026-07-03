import { employeeRepository } from "../repositories/employee.repository";
import {
    ListEmployeesQuery,
    CreateEmployeeInput,
    UpdateEmployeeInput,
} from "../validators/employee.validators";
import { NotFoundError, ConflictError } from "../lib/errors";

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

    async getById(id: number) {
        const employee = await employeeRepository.findById(id);
        if (!employee) throw new NotFoundError(`Employee ${id} not found`);
        return employee;
    },

    async create(input: CreateEmployeeInput) {
        const existing = await employeeRepository.findByEmail(input.email);
        if (existing) throw new ConflictError(`Email ${input.email} already exists`);
        return employeeRepository.create(input);
    },

    async update(id: number, input: UpdateEmployeeInput) {
        await this.getById(id); // throws NotFoundError if missing

        if (input.email) {
            const existing = await employeeRepository.findByEmail(input.email);
            if (existing && existing.id !== id) {
                throw new ConflictError(`Email ${input.email} already exists`);
            }
        }
        return employeeRepository.update(id, input);
    },

    async delete(id: number) {
        await this.getById(id);
        await employeeRepository.delete(id);
    },
};