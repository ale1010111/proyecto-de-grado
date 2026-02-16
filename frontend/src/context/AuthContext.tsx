import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { setAccessToken, clearAccessToken } from "../services/authService";

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const BASE_URL = "http://127.0.0.1:8000";

export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔥 Restaurar sesión al cargar la app
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/refresh/`, {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) throw new Error();

        const data = await response.json();
        setAccessToken(data.access);
        setIsAuthenticated(true);
      } catch {
        clearAccessToken();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch(`${BASE_URL}/api/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setAccessToken(data.access);
    setIsAuthenticated(true);
    return true;
  };

  const logout = async () => {
    await fetch(`${BASE_URL}/api/logout/`, {
      method: "POST",
      credentials: "include",
    });

    clearAccessToken();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
