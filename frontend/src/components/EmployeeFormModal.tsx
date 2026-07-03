import { Modal, TextInput, NumberInput, Select, Button, Group, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import { employeeApi } from "../api/client";
import type { Employee, EmployeeFormData } from "../api/client";

const CURRENCIES = ["USD", "INR", "EUR", "GBP", "SGD", "BRL"];

interface Props {
    opened: boolean;
    onClose: () => void;
    employee: Employee | null; // null = create mode, set = edit mode
    countries: string[];
    departments: string[];
}

export function EmployeeFormModal({ opened, onClose, employee, countries, departments }: Props) {
    const queryClient = useQueryClient();
    const isEdit = employee !== null;

    const form = useForm<EmployeeFormData>({
        initialValues: {
            name: employee?.name ?? "",
            email: employee?.email ?? "",
            country: employee?.country ?? "",
            department: employee?.department ?? "",
            jobTitle: employee?.jobTitle ?? "",
            salary: employee ? Number(employee.salary) : 0,
            currency: employee?.currency ?? "USD",
            joiningDate: employee ? employee.joiningDate.slice(0, 10) : "",
        },
        validate: {
            name: (v) => (v.trim() ? null : "Name is required"),
            email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Valid email required"),
            country: (v) => (v ? null : "Country is required"),
            department: (v) => (v ? null : "Department is required"),
            jobTitle: (v) => (v.trim() ? null : "Job title is required"),
            salary: (v) => (v > 0 ? null : "Salary must be positive"),
            joiningDate: (v) => (v ? null : "Joining date is required"),
        },
    });

    const mutation = useMutation({
        mutationFn: (values: EmployeeFormData) =>
            isEdit ? employeeApi.update(employee.id, values) : employeeApi.create(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            notifications.show({
                color: "green",
                message: isEdit ? "Employee updated" : "Employee created",
            });
            onClose();
            form.reset();
        },
        onError: (err) => {
            const message =
                axios.isAxiosError(err) && err.response?.data?.error
                    ? err.response.data.error
                    : "Something went wrong";
            notifications.show({ color: "red", message });
        },
    });

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={isEdit ? `Edit ${employee.name}` : "Add Employee"}
        >
            <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
                <Stack>
                    <TextInput label="Name" required {...form.getInputProps("name")} />
                    <TextInput label="Email" required {...form.getInputProps("email")} />
                    <Select label="Country" required searchable data={countries} {...form.getInputProps("country")} />
                    <Select label="Department" required searchable data={departments} {...form.getInputProps("department")} />
                    <TextInput label="Job Title" required {...form.getInputProps("jobTitle")} />
                    <Group grow>
                        <NumberInput label="Salary" required min={1} thousandSeparator="," {...form.getInputProps("salary")} />
                        <Select label="Currency" required data={CURRENCIES} {...form.getInputProps("currency")} />
                    </Group>
                    <TextInput label="Joining Date" type="date" required {...form.getInputProps("joiningDate")} />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={onClose}>Cancel</Button>
                        <Button type="submit" loading={mutation.isPending}>
                            {isEdit ? "Save Changes" : "Create"}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}