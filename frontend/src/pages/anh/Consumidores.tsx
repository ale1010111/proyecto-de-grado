// src/pages/anh/Consumidores.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { AlertaBadge, EstadoIdentidadBadge } from "../../components/ui/EstadoBadge";
import { consumidoresService } from "../../services/consumidores.service";
import type { ConsumidorPerfil } from "../../types/consumidor.types";
import { formatFecha } from "../../utils/format";
import {
  Users, Search, Filter, Eye,
  RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Plus
} from "lucide-react";

const ESTADOS_IDENTIDAD = [
  { value: "",           label: "Todos" },
  { value: "PENDIENTE",  label: "Pendiente" },
  { value: "EN_REVISION",label: "En revisión" },
  { value: "VERIFICADO", label: "Verificado" },
  { value: "RECHAZADO",  label: "Rechazado" },
];

const ALERTAS = [
  { value: "",           label: "Todas las alertas" },
  { value: "NORMAL",     label: "Normal" },
  { value: "EN_REVISION",label: "En revisión" },
  { value: "BLOQUEADO",  label: "Bloqueado" },
];

export default function ConsumidoresANH() {
  const navigate = useNavigate();
  const [consumidores, setConsumidores] = useState<ConsumidorPerfil[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [total,        setTotal]        = useState(0);

  const [busqueda,        setBusqueda]        = useState("");
  const [estadoIdentidad, setEstadoIdentidad] = useState("");
  const [alerta,          setAlerta]          = useState("");
  const [pagina,          setPagina]          = useState(1);
  const POR_PAGINA = 15;

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = { page: String(pagina) };
      if (estadoIdentidad) params.estado_identidad      = estadoIdentidad;
      if (alerta)          params.alerta_repetitividad  = alerta;
      if (busqueda)        params.search                = busqueda;

      const res = await consumidoresService.getAll(params);
      setConsumidores(res.results ?? res as unknown as ConsumidorPerfil[]);
      setTotal((res as { count?: number }).count ?? 0);
    } catch {
      setError("Error al cargar los consumidores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [pagina, estadoIdentidad, alerta]);

  const onBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
    cargar();
  };

  const totalPaginas = Math.ceil(total / POR_PAGINA);

  return (
    <Layout>
      <div className="space-y-5">

        {/* TÍTULO */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navbar rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-navbar-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Consumidores</h1>
              <p className="text-muted-foreground text-sm">{total} registrados en total</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/admin/registrar-consumidor")}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <Plus className="w-4 h-4" /> Registrar consumidor
            </button>
            <button onClick={cargar} className="flex items-center gap-2 px-4 py-2 border border-border text-muted-foreground rounded-xl text-sm hover:bg-card transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FILTROS */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={onBuscar} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, email o CI..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border text-sm bg-input focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-card outline-none"
                />
              </div>
              <button type="submit" className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors">
                Buscar
              </button>
            </form>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={estadoIdentidad}
                onChange={e => { setEstadoIdentidad(e.target.value); setPagina(1); }}
                className="px-3 py-2.5 rounded-xl border border-border text-sm bg-input outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {ESTADOS_IDENTIDAD.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
              <select
                value={alerta}
                onChange={e => { setAlerta(e.target.value); setPagina(1); }}
                className="px-3 py-2.5 rounded-xl border border-border text-sm bg-input outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {ALERTAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>
        </div>

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
          ) : consumidores.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-border mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No se encontraron consumidores</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-background border-b border-border">
                    {["Nombre", "Email", "Municipio", "Identidad", "Alerta", "Registro", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {consumidores.map(c => (
                    <tr key={c.id} className="hover:bg-background transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {(c as any).nombre_completo || `${c.user?.nombres ?? ""} ${c.user?.apellido_paterno ?? ""}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {(c as any).email || c.user?.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{c.municipio_nombre || "—"}</td>
                      <td className="px-4 py-3">
                        <EstadoIdentidadBadge estado={c.estado_identidad} />
                      </td>
                      <td className="px-4 py-3">
                        <AlertaBadge alerta={c.alerta_repetitividad} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatFecha(c.fecha_creacion)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/anh/consumidores/${c.id}`)}
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

          {totalPaginas > 1 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Página {pagina} de {totalPaginas}</p>
              <div className="flex gap-2">
                <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                </button>
                <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                  className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
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