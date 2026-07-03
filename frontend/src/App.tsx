import { useState } from "react";
import { AppShell, Title, Container, Group, Button, Text } from "@mantine/core";
import { EmployeeListPage } from "./pages/EmployeeListPage";
import { InsightsPage } from "./pages/InsightsPage";
import { LoginPage } from "./pages/LoginPage";
import { useAuth } from "./auth/useAuth";

type Page = "employees" | "insights";

export default function App() {
  const { token, email, logout } = useAuth();
  const [page, setPage] = useState<Page>("employees");

  if (!token) return <LoginPage />;

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
            <Text size="sm" c="dimmed">{email}</Text>
            <Button variant="default" onClick={logout}>Logout</Button>
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