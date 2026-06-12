// src/services/catalogos.service.ts

import { api } from "../context/AuthContext";
import type { Departamento, Provincia, Municipio } from "../types/consumidor.types";

export const catalogosService = {

  getDepartamentos: async (): Promise<Departamento[]> => {
    const res = await api.get("/api/catalogos/departamentos/");
    return res.data;
  },

  getProvincias: async (departamentoId: number): Promise<Provincia[]> => {
    const res = await api.get(
      `/api/catalogos/departamentos/${departamentoId}/provincias/`
    );
    return res.data;
  },

  getMunicipios: async (provinciaId: number): Promise<Municipio[]> => {
    const res = await api.get(
      `/api/catalogos/provincias/${provinciaId}/municipios/`
    );
    return res.data;
  },
};