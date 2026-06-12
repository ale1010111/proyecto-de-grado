// ------------------------------------------------
// src/components/ui/EstadoBadge.tsx
// ------------------------------------------------
import { Badge } from "./Badge";
import { ESTADOS_SOLICITUD, ALERTAS_CONSUMIDOR } from "../../utils/constants";

export function EstadoSolicitudBadge({ estado }: { estado: string }) {
  const config = ESTADOS_SOLICITUD[estado] ?? { label: estado, color: "bg-gray-100 text-gray-500" };
  return <Badge className={config.color}>{config.label}</Badge>;
}

export function AlertaBadge({ alerta }: { alerta: string }) {
  const config = ALERTAS_CONSUMIDOR[alerta] ?? { label: alerta, color: "bg-gray-100 text-gray-500" };
  return <Badge className={config.color}>{config.label}</Badge>;
}