import {
    Title, Paper, Text, Grid, Stack, Loader, Center, Table, Tabs,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { analyticsApi } from "../api/client";
import type { GroupStats } from "../api/client";

const fmtUsd = (n: number) => `$${n.toLocaleString()}`;

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <Paper p="md" withBorder>
            <Text size="sm" c="dimmed">{label}</Text>
            <Text size="xl" fw={700}>{value}</Text>
        </Paper>
    );
}

function SalaryBarChart({ data }: { data: GroupStats[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="group" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(value: number) => fmtUsd(value)} />
                <Bar dataKey="avgUsd" name="Avg (USD)" fill="#4c6ef5" />
                <Bar dataKey="medianUsd" name="Median (USD)" fill="#82c91e" />
            </BarChart>
        </ResponsiveContainer>
    );
}

function StatsTable({ data }: { data: GroupStats[] }) {
    return (
        <Table striped>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Group</Table.Th>
                    <Table.Th>Headcount</Table.Th>
                    <Table.Th>Avg</Table.Th>
                    <Table.Th>Median</Table.Th>
                    <Table.Th>Min</Table.Th>
                    <Table.Th>Max</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {data.map((r) => (
                    <Table.Tr key={r.group}>
                        <Table.Td>{r.group}</Table.Td>
                        <Table.Td>{r.headcount.toLocaleString()}</Table.Td>
                        <Table.Td>{fmtUsd(r.avgUsd)}</Table.Td>
                        <Table.Td>{fmtUsd(r.medianUsd)}</Table.Td>
                        <Table.Td>{fmtUsd(r.minUsd)}</Table.Td>
                        <Table.Td>{fmtUsd(r.maxUsd)}</Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
}

export function InsightsPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["analytics-summary"],
        queryFn: analyticsApi.summary,
    });

    if (isLoading) return <Center p="xl"><Loader /></Center>;
    if (isError || !data) return <Text c="red">Failed to load analytics.</Text>;

    return (
        <Stack>
            <Title order={2}>Compensation Insights</Title>
            <Text c="dimmed" size="sm">
                All amounts normalized to USD using fixed conversion rates.
            </Text>

            <Grid>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                    <StatCard label="Total Employees" value={data.totals.totalEmployees.toLocaleString()} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                    <StatCard label="Average Salary (USD)" value={fmtUsd(data.totals.avgSalaryUsd)} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                    <StatCard label="Countries" value={String(data.byCountry.length)} />
                </Grid.Col>
            </Grid>

            <Paper p="md" withBorder>
                <Tabs defaultValue="country">
                    <Tabs.List>
                        <Tabs.Tab value="country">By Country</Tabs.Tab>
                        <Tabs.Tab value="department">By Department</Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="country" pt="md">
                        <Stack>
                            <SalaryBarChart data={data.byCountry} />
                            <StatsTable data={data.byCountry} />
                        </Stack>
                    </Tabs.Panel>
                    <Tabs.Panel value="department" pt="md">
                        <Stack>
                            <SalaryBarChart data={data.byDepartment} />
                            <StatsTable data={data.byDepartment} />
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Paper>

            <Paper p="md" withBorder>
                <Title order={4} mb="md">Salary Distribution (USD)</Title>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.histogram}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" name="Employees" fill="#4c6ef5" />
                    </BarChart>
                </ResponsiveContainer>
            </Paper>
        </Stack>
    );
}