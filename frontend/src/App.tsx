import { AppShell, Title, Container } from "@mantine/core";
import { EmployeeListPage } from "./pages/EmployeeListPage";

export default function App() {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header p="md">
        <Title order={3}>ACME Salary Management</Title>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl">
          <EmployeeListPage />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}