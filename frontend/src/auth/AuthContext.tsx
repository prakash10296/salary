import { useState, type ReactNode } from "react";
import { api } from "../api/client";
import { AuthContext } from "./useAuth";

const TOKEN_KEY = "salary_app_token";
const EMAIL_KEY = "salary_app_email";

export function AuthProvider({ children }: { children: ReactNode }) {
    // Initialize from localStorage so a page refresh keeps the session
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [email, setEmail] = useState<string | null>(() => localStorage.getItem(EMAIL_KEY));

    async function login(email: string, password: string) {
        const res = await api.post("/auth/login", { email, password });
        localStorage.setItem(TOKEN_KEY, res.data.token);
        localStorage.setItem(EMAIL_KEY, res.data.user.email);
        setToken(res.data.token);
        setEmail(res.data.user.email);
    }

    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EMAIL_KEY);
        setToken(null);
        setEmail(null);
    }

    return (
        <AuthContext.Provider value={{ token, email, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
