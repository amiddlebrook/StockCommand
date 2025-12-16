
import React, { createContext, useContext, useEffect, useState } from 'react';

// Types
export interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = '/api'; // Vite proxy should handle this locally, or full URL in prod

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSession();
    }, []);

    async function checkSession() {
        try {
            const res = await fetch(`${API_BASE}/auth/me`);
            const data = await res.json() as { user: User | null };
            if (data.user) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Session check failed", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function login(email: string, password: string) {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json() as { user?: User; error?: string };
        if (!res.ok) throw new Error(data.error || 'Login failed');
        if (data.user) setUser(data.user);
    }

    async function register(email: string, password: string) {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json() as { user?: User; error?: string };
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        if (data.user) setUser(data.user);
    }

    async function logout() {
        await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
        setUser(null);
    }

    function loginWithGoogle() {
        window.location.href = `${API_BASE}/auth/google`;
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
