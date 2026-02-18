import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { setAccessToken, clearAccessToken, getAccessToken } from "../services/authService";

interface User {
  id: number;
  username: string;
  tipo_usuario: "ADMIN" | "ANH" | "ESS" | "CONS";
  estacion_servicio: number | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const BASE_URL = "http://127.0.0.1:8000";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // 🔥 Función para obtener usuario autenticado
  const fetchUser = async (accessToken: string) => {
    const response = await fetch(`${BASE_URL}/api/users/me/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    });

    if (!response.ok) throw new Error("No se pudo obtener usuario");

    const userData = await response.json();
    setUser(userData);
  };

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

        await fetchUser(data.access);

        setIsAuthenticated(true);
      } catch {
        clearAccessToken();
        setUser(null);
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

    await fetchUser(data.access);

    setIsAuthenticated(true);
    return true;
  };

  const logout = async () => {
    const accessToken = getAccessToken(); // si tienes helper

    await fetch(`${BASE_URL}/api/logout/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include",
    });

  clearAccessToken();
  setUser(null);
  setIsAuthenticated(false);
};

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, loading, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
