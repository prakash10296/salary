import { Router } from "express";
import {
    listEmployeesQuerySchema,
    createEmployeeSchema,
    updateEmployeeSchema,
    idParamSchema,
} from "../validators/employee.validators";
import { employeeService } from "../services/employee.service";
import { NotFoundError, ConflictError } from "../lib/errors";

export const employeeRouter = Router();

function handleError(err: unknown, res: any, next: any) {
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    if (err instanceof ConflictError) return res.status(409).json({ error: err.message });
    next(err);
}

employeeRouter.get("/", async (req, res, next) => {
    try {
        const parsed = listEmployeesQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(422).json({ error: "Invalid query parameters", details: parsed.error.flatten() });
        }
        res.json(await employeeService.list(parsed.data));
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

employeeRouter.get("/:id", async (req, res, next) => {
    try {
        const parsed = idParamSchema.safeParse(req.params);
        if (!parsed.success) return res.status(422).json({ error: "Invalid id" });
        res.json(await employeeService.getById(parsed.data.id));
    } catch (err) {
        handleError(err, res, next);
    }
});

employeeRouter.post("/", async (req, res, next) => {
    try {
        const parsed = createEmployeeSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(422).json({ error: "Validation failed", details: parsed.error.flatten() });
        }
        const created = await employeeService.create(parsed.data);
        res.status(201).json(created);
    } catch (err) {
        handleError(err, res, next);
    }
});

employeeRouter.put("/:id", async (req, res, next) => {
    try {
        const idParsed = idParamSchema.safeParse(req.params);
        if (!idParsed.success) return res.status(422).json({ error: "Invalid id" });

        const bodyParsed = updateEmployeeSchema.safeParse(req.body);
        if (!bodyParsed.success) {
            return res.status(422).json({ error: "Validation failed", details: bodyParsed.error.flatten() });
        }
        res.json(await employeeService.update(idParsed.data.id, bodyParsed.data));
    } catch (err) {
        handleError(err, res, next);
    }
});

employeeRouter.delete("/:id", async (req, res, next) => {
    try {
        const parsed = idParamSchema.safeParse(req.params);
        if (!parsed.success) return res.status(422).json({ error: "Invalid id" });
        await employeeService.delete(parsed.data.id);
        res.status(204).send();
    } catch (err) {
        handleError(err, res, next);
    }
});