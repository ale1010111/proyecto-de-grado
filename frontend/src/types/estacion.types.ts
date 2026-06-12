// src/types/estacion.types.ts

export type EstadoEstacion = "ACTIVA" | "INACTIVA" | "SUSPENDIDA";

export interface EstacionServicio {
  id:        number;
  nombre:    string;
  codigo:    string;
  direccion: string;
  departamento: string;
  municipio: string;
  estado:    EstadoEstacion;
}