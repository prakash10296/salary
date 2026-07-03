import { useState } from "react";
import {
    Table, TextInput, Select, Group, Pagination, Title, Paper,
    Text, Loader, Center, Stack, Badge, UnstyledButton,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { employeeApi, EmployeeListParams } from "../api/client";

type SortField = NonNullable<EmployeeListParams["sortBy"]>;

export function EmployeeListPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebouncedValue(search, 300);
    const [country, setCountry] = useState<string | null>(null);
    const [department, setDepartment] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortField>("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    const params: EmployeeListParams = {
        page,
        search: debouncedSearch || undefined,
        country: country || undefined,
        department: department || undefined,
        sortBy,
        sortOrder,
    };

    const { data, isLoading, isError } = useQuery({
        queryKey: ["employees", params],
        queryFn: () => employeeApi.list(params),
    });

    const { data: options } = useQuery({
        queryKey: ["filter-options"],
        queryFn: employeeApi.filterOptions,
    });

    function toggleSort(field: SortField) {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
        setPage(1);
    }

    function sortIndicator(field: SortField) {
        if (sortBy !== field) return "";
        return sortOrder === "asc" ? " ▲" : " ▼";
    }

    return (
        <Stack>
            <Title order={2}>Employees</Title>

            <Paper p="md" withBorder>
                <Group>
                    <TextInput
                        placeholder="Search name or email..."
                        value={search}
                        onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
                        style={{ flex: 1 }}
                    />
                    <Select
                        placeholder="Country" clearable data={options?.countries ?? []}
                        value={country} onChange={(v) => { setCountry(v); setPage(1); }}
                    />
                    <Select
                        placeholder="Department" clearable data={options?.departments ?? []}
                        value={department} onChange={(v) => { setDepartment(v); setPage(1); }}
                    />
                </Group>
            </Paper>

            {isLoading && <Center p="xl"><Loader /></Center>}
            {isError && <Text c="red">Failed to load employees. Is the backend running?</Text>}

            {data && (
                <>
                    <Text size="sm" c="dimmed">{data.total.toLocaleString()} employees found</Text>
                    <Paper withBorder>
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>
                                        <UnstyledButton fw={700} onClick={() => toggleSort("name")}>
                                            Name{sortIndicator("name")}
                                        </UnstyledButton>
                                    </Table.Th>
                                    <Table.Th>Email</Table.Th>
                                    <Table.Th>Country</Table.Th>
                                    <Table.Th>Department</Table.Th>
                                    <Table.Th>Job Title</Table.Th>
                                    <Table.Th>
                                        <UnstyledButton fw={700} onClick={() => toggleSort("salary")}>
                                            Salary{sortIndicator("salary")}
                                        </UnstyledButton>
                                    </Table.Th>
                                    <Table.Th>
                                        <UnstyledButton fw={700} onClick={() => toggleSort("joiningDate")}>
                                            Joined{sortIndicator("joiningDate")}
                                        </UnstyledButton>
                                    </Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {data.items.map((emp) => (
                                    <Table.Tr key={emp.id}>
                                        <Table.Td>{emp.name}</Table.Td>
                                        <Table.Td>{emp.email}</Table.Td>
                                        <Table.Td>{emp.country}</Table.Td>
                                        <Table.Td><Badge variant="light">{emp.department}</Badge></Table.Td>
                                        <Table.Td>{emp.jobTitle}</Table.Td>
                                        <Table.Td>
                                            {Number(emp.salary).toLocaleString()} {emp.currency}
                                        </Table.Td>
                                        <Table.Td>{new Date(emp.joiningDate).toLocaleDateString()}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Paper>
                    <Center>
                        <Pagination total={data.totalPages} value={page} onChange={setPage} />
                    </Center>
                </>
            )}
        </Stack>
    );
}