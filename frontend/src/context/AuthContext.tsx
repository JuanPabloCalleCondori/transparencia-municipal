import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { apiRequest } from "../api/api";
import type {
  LoginResponse,
  User,
} from "../types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<User>;

  logout: () => void;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response =
          await apiRequest<{
            status: string;
            usuario: User;
          }>("/auth/me");

        setUser(response.usuario);
      } catch {
        localStorage.removeItem(
          "token"
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(
  email: string,
  password: string
): Promise<User> {
  const response =
    await apiRequest<LoginResponse>(
      "/auth/login",
      {
        method: "POST",

        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

  localStorage.setItem(
    "token",
    response.token
  );

  try {
    const me =
      await apiRequest<{
        status: string;
        usuario: User;
      }>("/auth/me");

    setUser(me.usuario);

    return me.usuario;
  } catch (error) {
    localStorage.removeItem(
      "token"
    );

    throw error;
  }
}

  function logout() {
    localStorage.removeItem(
      "token"
    );

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated:
          user !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider"
    );
  }

  return context;
}
