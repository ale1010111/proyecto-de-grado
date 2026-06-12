// src/context/AuthContext.tsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import axios from "axios";

// ------------------------------------------------
// TIPOS
// ------------------------------------------------

export interface User {
  id: number;
  email: string;
  nombre_completo: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  tipo_usuario: "ADMIN" | "ANH" | "ESS" | "CONS";
  estado_cuenta: string;
  email_verificado: boolean;
  date_joined: string;
  access?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ------------------------------------------------
// AXIOS CONFIG
// ------------------------------------------------

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Rutas públicas que no deben disparar redirect
const RUTAS_PUBLICAS = [
  "/login",
  "/registro",
  "/verificar-email",
  "/recuperar-password",
  "/recuperar-password/confirmar",
];

const esRutaPublica = () =>
  RUTAS_PUBLICAS.some(r => window.location.pathname.startsWith(r));

// URLs que nunca deben interceptarse
const esUrlExcluida = (url?: string) =>
  !url ||
  url.includes("/auth/login/") ||
  url.includes("/auth/refresh/") ||
  url.includes("/auth/logout/");

// ------------------------------------------------
// INTERCEPTOR — renovar token automáticamente
// ------------------------------------------------

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !esUrlExcluida(original?.url)
    ) {
      original._retry = true;
      try {
        await axios.post(
          "http://127.0.0.1:8000/api/users/auth/refresh/",
          {},
          { withCredentials: true }
        );
        return api(original);
      } catch {
        if (!esRutaPublica()) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ------------------------------------------------
// CONTEXTO
// ------------------------------------------------

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get("/api/users/me/");
      setUser(res.data);
    } catch {
      setUser(null);
    }
  }, []);

  // Verificar sesión al cargar — solo si no estamos en ruta pública
  useEffect(() => {
    if (esRutaPublica()) {
      setLoading(false);
      return;
    }
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    // 1. Limpiar header con token expirado
    delete api.defaults.headers.common["Authorization"];

    // 2. Limpiar cookies de sesión anterior usando axios directo
    //    para evitar que el interceptor interfiera
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/users/auth/logout/",
        {},
        { withCredentials: true }
      );
    } catch {
      // ignorar — las cookies pueden ya estar expiradas
    }

    // 3. Hacer login
    const res = await api.post("/api/users/auth/login/", { email, password });

    // 4. Guardar access token
    if (res.data.access) {
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.access}`;
    }

    // 5. Cargar datos del usuario
    const meRes = await api.get("/api/users/me/");
    setUser(meRes.data);
  };

  const logout = async () => {
    try {
      await axios.post(
        "http://127.0.0.1:8000/api/users/auth/logout/",
        {},
        { withCredentials: true }
      );
    } catch {
      // ignorar errores al cerrar sesión
    } finally {
      setUser(null);
      delete api.defaults.headers.common["Authorization"];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}