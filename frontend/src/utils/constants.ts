// src/utils/constants.ts

export const ESTADOS_SOLICITUD: Record<string, { label: string; color: string }> = {
  PENDIENTE:  { label: "Pendiente",  color: "bg-amber-100 text-amber-700"  },
  OBSERVADA:  { label: "Observada",  color: "bg-orange-100 text-orange-700" },
  APROBADA:   { label: "Aprobada",   color: "bg-green-100 text-green-700"  },
  DESPACHADA: { label: "Despachada", color: "bg-blue-100 text-blue-700"    },
  RECHAZADA:  { label: "Rechazada",  color: "bg-red-100 text-red-700"      },
  CANCELADA:  { label: "Cancelada",  color: "bg-slate-100 text-slate-500"  },
  EXPIRADA:   { label: "Expirada",   color: "bg-gray-100 text-gray-500"    },
};

export const COMBUSTIBLES: Record<string, string> = {
  GASOLINA: "Gasolina",
  DIESEL:   "Diésel",
  GNV:      "GNV",
};

export const ACTIVIDADES: Record<string, string> = {
  AGRICULTURA:  "Agricultura / Ganadería",
  TRANSPORTE:   "Transporte",
  INDUSTRIA:    "Industria / Manufactura",
  PESCA:        "Pesca",
  CONSTRUCCION: "Construcción",
  DOMESTICO:    "Uso doméstico",
  COMERCIO:     "Comercio",
  MINERIA:      "Minería",
  OTRO:         "Otro",
};

export const ALERTAS_CONSUMIDOR: Record<string, { label: string; color: string }> = {
  NORMAL:      { label: "Normal",      color: "bg-green-100 text-green-700" },
  EN_REVISION: { label: "En revisión", color: "bg-amber-100 text-amber-700" },
  BLOQUEADO:   { label: "Bloqueado",   color: "bg-red-100 text-red-700"     },
};

export const TIPOS_DOCUMENTO = [
  { value: "CI",  label: "Cédula de Identidad (CI)" },
  { value: "CIE", label: "Cédula de Identidad de Extranjero (CIE)" },
];