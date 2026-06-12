// src/services/reportes.service.ts

import { api } from "../context/AuthContext";

export const reportesService = {

  descargar: async (
    filtro: string,
    formato: "PDF" | "EXCEL",
    dias: number = 30
  ): Promise<void> => {
    const res = await api.get("/api/reportes/consumidores/", {
      params:       { filtro, formato, dias },
      responseType: "blob",
    });
    const extension = formato === "PDF" ? "pdf" : "xlsx";
    const url       = URL.createObjectURL(new Blob([res.data]));
    const a         = document.createElement("a");
    a.href          = url;
    a.download      = `reporte_ANH_${filtro}_${new Date().toISOString().slice(0, 10)}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  },

  getDashboard: async () => {
    const res = await api.get("/api/dashboard/");
    return res.data;
  },
};