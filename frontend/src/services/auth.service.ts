// src/services/auth.service.ts

import { api } from "../context/AuthContext";

export const authService = {

  registro: async (formData: FormData): Promise<void> => {
    await api.post("/api/users/registro/consumidor/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  verificarEmail: async (email: string, pin: string): Promise<void> => {
    await api.post("/api/users/auth/verificar-email/", { 
        email, 
        codigo_pin: pin 
    });
  },
  recuperarPassword: async (email: string): Promise<void> => {
    await api.post("/api/users/auth/recuperar-password/", { email });
  },

  confirmarRecuperacion: async (
    token: string,
    password: string,
    password2: string
  ): Promise<void> => {
    await api.post("/api/users/auth/recuperar-password/confirmar/", {
      token,
      password,
      password2,
    });
  },

  reenviarPin: async (email: string): Promise<void> => {
    await api.post("/api/users/auth/reenviar-pin/", { email });
  },

  cambiarPassword: async (
    password_actual: string,
    password_nuevo: string,
    password_nuevo2: string
  ): Promise<void> => {
    await api.post("/api/users/auth/cambiar-password/", {
      password_actual,
      password_nuevo,
      password_nuevo2,
    });
  },
};