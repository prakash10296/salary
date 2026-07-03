import { useState } from "react";
import {
    Paper, TextInput, PasswordInput, Button, Title, Stack, Text, Center, Alert,
} from "@mantine/core";
import { useAuth } from "../auth/useAuth";

export function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
        } catch {
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Center h="100vh" bg="gray.0">
            <Paper p="xl" withBorder w={380}>
                <Stack>
                    <Title order={3} ta="center">ACME Salary Management</Title>
                    <Text c="dimmed" size="sm" ta="center">HR Manager sign in</Text>

                    {error && <Alert color="red">{error}</Alert>}

                    <TextInput
                        label="Email"
                        placeholder="hr@acme.com"
                        value={email}
                        onChange={(e) => setEmail(e.currentTarget.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    />
                    <PasswordInput
                        label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    />
                    <Button fullWidth loading={loading} onClick={handleSubmit}>
                        Sign in
                    </Button>

                    <Text c="dimmed" size="xs" ta="center">
                        Demo credentials: hr@acme.com / hr789
                    </Text>
                </Stack>
            </Paper>
        </Center>
    );
}