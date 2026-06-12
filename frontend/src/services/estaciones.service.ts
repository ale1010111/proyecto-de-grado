// src/services/estaciones.service.ts

import { api } from "../context/AuthContext";
import type { EstacionServicio } from "../types/estacion.types";

export const estacionesService = {

  getAll: async (params?: Record<string, string>): Promise<EstacionServicio[]> => {
    const res = await api.get("/api/estaciones/", { params });
    return res.data.results ?? res.data;
  },

  getById: async (id: number): Promise<EstacionServicio> => {
    const res = await api.get(`/api/estaciones/${id}/`);
    return res.data;
  },

  crear: async (data: Partial<EstacionServicio>): Promise<EstacionServicio> => {
    const res = await api.post("/api/estaciones/", data);
    return res.data;
  },

  actualizar: async (
    id: number,
    data: Partial<EstacionServicio>
  ): Promise<EstacionServicio> => {
    const res = await api.put(`/api/estaciones/${id}/`, data);
    return res.data;
  },

  cambiarEstado: async (
    id: number,
    estado: string
  ): Promise<EstacionServicio> => {
    const res = await api.post(`/api/estaciones/${id}/cambiar-estado/`, { estado });
    return res.data;
  },
};