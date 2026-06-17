// src/types/estacion.types.ts

export type EstadoEstacion = "ACTIVA" | "INACTIVA" | "SUSPENDIDA";

export interface EstacionServicio {
  id:        number;
  nombre:    string;
  codigo:    string;
  direccion: string;
  municipio: number;            // antes: string
  municipio_nombre: string;     // nuevo
  provincia_id: number;         // nuevo
  departamento_id: number;      // nuevo
  departamento_nombre: string;  // nuevo (antes "departamento": string)
  estado:    EstadoEstacion;
}