import { useState } from "react";
import { AppShell, Title, Container, Group, Button } from "@mantine/core";
import { EmployeeListPage } from "./pages/EmployeeListPage";
import { InsightsPage } from "./pages/InsightsPage";

type Page = "employees" | "insights";

export default function App() {
  const [page, setPage] = useState<Page>("employees");

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header p="md">
        <Group justify="space-between">
          <Title order={3}>ACME Salary Management</Title>
          <Group>
            <Button
              variant={page === "employees" ? "filled" : "subtle"}
              onClick={() => setPage("employees")}
            >
              Employees
            </Button>
            <Button
              variant={page === "insights" ? "filled" : "subtle"}
              onClick={() => setPage("insights")}
            >
              Insights
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl">
          {page === "employees" ? <EmployeeListPage /> : <InsightsPage />}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}