// src/utils/format.ts

export const formatFecha = (fecha: string | null, conHora = false): string => {
  if (!fecha) return "—";
  const d = new Date(fecha);
  const opciones: Intl.DateTimeFormatOptions = {
    day:   "2-digit",
    month: "2-digit",
    year:  "numeric",
    ...(conHora && { hour: "2-digit", minute: "2-digit" }),
  };
  return d.toLocaleDateString("es-BO", opciones);
};

export const formatLitros = (litros: number | null): string => {
  if (litros === null || litros === undefined) return "—";
  return `${litros} L`;
};

export const formatIdPublico = (id: string): string =>
  id.slice(0, 8).toUpperCase();

