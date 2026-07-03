import { Router } from "express";
import { listEmployeesQuerySchema } from "../validators/employee.validators";
import { employeeService } from "../services/employee.service";

export const employeeRouter = Router();

employeeRouter.get("/", async (req, res, next) => {
    try {
        const parsed = listEmployeesQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(422).json({
                error: "Invalid query parameters",
                details: parsed.error.flatten(),
            });
        }
        const result = await employeeService.list(parsed.data);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

employeeRouter.get("/filter-options", async (_req, res, next) => {
    try {
        res.json(await employeeService.getFilterOptions());
    } catch (err) {
        next(err);
    }
});