// src/pages/anh/Solicitudes.tsx

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { EstadoSolicitudBadge } from "../../components/ui/EstadoBadge";
import { solicitudesService } from "../../services/solicitudes.service";
import type { Solicitud } from "../../types/solicitud.types";
import { COMBUSTIBLES } from "../../utils/constants";
import { formatFecha, formatIdPublico } from "../../utils/format";
import {
  FileText, Search, Filter, Eye,
  RefreshCw, AlertCircle, ChevronLeft, ChevronRight
} from "lucide-react";

const ESTADOS = [
  { value: "",           label: "Todos" },
  { value: "PENDIENTE",  label: "Pendiente" },
  { value: "OBSERVADA",  label: "Observada" },
  { value: "APROBADA",   label: "Aprobada" },
  { value: "DESPACHADA", label: "Despachada" },
  { value: "RECHAZADA",  label: "Rechazada" },
  { value: "CANCELADA",  label: "Cancelada" },
  { value: "EXPIRADA",   label: "Expirada" },
];

const POR_PAGINA = 20;

export default function SolicitudesANH() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [total,       setTotal]       = useState(0);

  const [busqueda,      setBusqueda]      = useState("");
  const [busquedaInput, setBusquedaInput] = useState("");
  const [estado,        setEstado]        = useState("PENDIENTE");
  const [pagina,        setPagina]        = useState(1);

  const cargar = useCallback(async (
    paginaActual: number,
    estadoActual: string,
    busquedaActual: string,
  ) => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {
        page: String(paginaActual),
      };

      if (busquedaActual) {
        params.search = busquedaActual;
      } else if (estadoActual) {
        params.estado = estadoActual;
      }

      const res = await solicitudesService.getAll(params);
      setSolicitudes(res.results ?? []);
      setTotal(res.count ?? 0);
    } catch {
      setError("Error al cargar las solicitudes.");
      setSolicitudes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar(pagina, estado, busqueda);
  }, [pagina, estado, busqueda, cargar]);

  const onBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
    setBusqueda(busquedaInput);
  };

  const onLimpiarBusqueda = () => {
    setBusquedaInput("");
    setBusqueda("");
    setPagina(1);
  };

  const onEstadoChange = (nuevoEstado: string) => {
    setEstado(nuevoEstado);
    setPagina(1);
    if (busqueda) {
      setBusqueda("");
      setBusquedaInput("");
    }
  };

  const totalPaginas = total > 0 ? Math.ceil(total / POR_PAGINA) : 1;

  return (
    <Layout>
      <div className="space-y-5">

        {/* TÍTULO */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navbar rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-navbar-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Solicitudes</h1>
              <p className="text-muted-foreground text-sm">{total} solicitudes encontradas</p>
            </div>
          </div>
          <button
            onClick={() => cargar(pagina, estado, busqueda)}
            className="flex items-center gap-2 px-4 py-2 border border-border text-muted-foreground rounded-xl text-sm hover:bg-card transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>

        {/* FILTROS */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={onBuscar} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={busquedaInput}
                  onChange={e => setBusquedaInput(e.target.value)}
                  placeholder="Buscar por N° solicitud o consumidor (busca en todos los estados)..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm bg-input focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-card outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                Buscar
              </button>
              {busqueda && (
                <button
                  type="button"
                  onClick={onLimpiarBusqueda}
                  className="px-4 py-2.5 border border-border text-muted-foreground rounded-xl text-sm hover:bg-background transition-colors"
                >
                  Limpiar
                </button>
              )}
            </form>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={busqueda ? "" : estado}
                onChange={e => onEstadoChange(e.target.value)}
                disabled={!!busqueda}
                className="px-3 py-2.5 rounded-xl border border-border text-sm bg-input outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>

          {busqueda && (
            <p className="text-xs text-primary mt-2 ml-1">
              Buscando "<strong>{busqueda}</strong>" en todos los estados — el filtro de estado está desactivado.
            </p>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* TABLA */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-border mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {busqueda
                  ? `No se encontraron solicitudes para "${busqueda}"`
                  : "No hay solicitudes en este estado"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-background border-b border-border">
                    {["N° Solicitud", "Consumidor", "Combustible", "Litros", "Estado", "Fecha", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {solicitudes.map(s => (
                    <tr key={s.id_publico} className="hover:bg-background transition-colors">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-foreground">
                        #{formatIdPublico(s.id_publico)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {(s.consumidor as any)?.nombre_completo ||
                          (s as any).consumidor_nombre || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {COMBUSTIBLES[s.tipo_combustible] ?? s.tipo_combustible}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {s.litros_solicitados} L
                      </td>
                      <td className="px-4 py-3">
                        <EstadoSolicitudBadge estado={s.estado} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatFecha(s.fecha_creacion)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/anh/solicitudes/${s.id_publico}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Página {pagina} de {totalPaginas} ({total} resultados)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1 || loading}
                  className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                </button>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina >= totalPaginas || loading}
                  className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}