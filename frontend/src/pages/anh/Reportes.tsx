// src/pages/anh/Reportes.tsx

import { useState, useEffect, useCallback } from "react";
import Layout from "../../components/Layout";
import { reportesService } from "../../services/reportes.service";
import { estacionesService } from "../../services/estaciones.service";
import { api } from "../../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  BarChart3, Download, FileText, FileSpreadsheet,
  AlertCircle, CheckCircle, RefreshCw, Filter,
} from "lucide-react";

// ------------------------------------------------
// CONSTANTES
// ------------------------------------------------

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE:  "#F59E0B",
  OBSERVADA:  "#F97316",
  APROBADA:   "#10B981",
  DESPACHADA: "#3B82F6",
  RECHAZADA:  "#EF4444",
  CANCELADA:  "#6B7280",
  EXPIRADA:   "#9CA3AF",
};

// Colores de las barras: primario verde + acento amber
const COMBUSTIBLE_COLORS = ["#10B981", "#F59E0B"];

const FILTROS_CONSUMIDORES = [
  { value: "TODOS",            label: "Todos los consumidores" },
  { value: "BLOQUEADOS",       label: "Consumidores bloqueados" },
  { value: "EN_REVISION",      label: "Consumidores en revisión" },
  { value: "SUPERARON_LIMITE", label: "Superaron el límite" },
];

const ESTADOS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "PENDIENTE",  label: "Pendiente" },
  { value: "OBSERVADA",  label: "Observada" },
  { value: "APROBADA",   label: "Aprobada" },
  { value: "DESPACHADA", label: "Despachada" },
  { value: "RECHAZADA",  label: "Rechazada" },
  { value: "CANCELADA",  label: "Cancelada" },
  { value: "EXPIRADA",   label: "Expirada" },
];

interface Estadisticas {
  total: number;
  litros: { solicitados: number; aprobados: number; despachados: number };
  por_estado:      { estado: string; total: number }[];
  por_combustible: { tipo_combustible: string; total: number; litros: number }[];
  por_estacion:    { estacion_nombre: string; total: number; litros_despachados: number }[];
  por_mes:         { mes: string; total: number; aprobadas: number; despachadas: number; litros: number }[];
  por_municipio:   { municipio: string; total: number }[];
}

function Metrica({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm px-5 py-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ReportesANH() {
  const [tab, setTab] = useState<"solicitudes" | "consumidores">("solicitudes");

  const [fechaDesde,  setFechaDesde]  = useState("");
  const [fechaHasta,  setFechaHasta]  = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [combustibleFiltro, setCombustibleFiltro] = useState("");
  const [estacionFiltro, setEstacionFiltro] = useState("");
  const [estaciones, setEstaciones]  = useState<{ id: number; nombre: string }[]>([]);

  const [stats,      setStats]      = useState<Estadisticas | null>(null);
  const [loadStats,  setLoadStats]  = useState(false);
  const [errorStats, setErrorStats] = useState("");

  const [formato,      setFormato]      = useState<"PDF" | "EXCEL">("EXCEL");
  const [descargando,  setDescargando]  = useState(false);
  const [error,        setError]        = useState("");
  const [exito,        setExito]        = useState("");

  const [filtroConsumidor, setFiltroConsumidor] = useState("TODOS");
  const [formatoCons,      setFormatoCons]      = useState<"PDF" | "EXCEL">("EXCEL");
  const [diasCons,         setDiasCons]         = useState(30);
  const [descargandoCons,  setDescargandoCons]  = useState(false);

  useEffect(() => {
    estacionesService.getAll({ estado: "ACTIVA" }).then(data => {
      const lista = Array.isArray(data) ? data : (data as any).results ?? [];
      setEstaciones(lista.map((e: any) => ({ id: e.id, nombre: e.nombre })));
    }).catch(() => {});
  }, []);

  const cargarEstadisticas = useCallback(async () => {
    setLoadStats(true); setErrorStats("");
    try {
      const params: Record<string, string> = {};
      if (fechaDesde)        params.fecha_desde  = fechaDesde;
      if (fechaHasta)        params.fecha_hasta  = fechaHasta;
      if (estadoFiltro)      params.estado       = estadoFiltro;
      if (combustibleFiltro) params.combustible  = combustibleFiltro;
      if (estacionFiltro)    params.estacion     = estacionFiltro;

      const res = await api.get("/api/estadisticas/solicitudes/", { params });
      setStats(res.data);
    } catch {
      setErrorStats("Error al cargar las estadísticas.");
    } finally { setLoadStats(false); }
  }, [fechaDesde, fechaHasta, estadoFiltro, combustibleFiltro, estacionFiltro]);

  useEffect(() => {
    if (tab === "solicitudes") cargarEstadisticas();
  }, [tab, cargarEstadisticas]);

  const descargarSolicitudes = async () => {
    setDescargando(true); setError(""); setExito("");
    try {
      const params: Record<string, string> = { formato };
      if (fechaDesde)        params.fecha_desde = fechaDesde;
      if (fechaHasta)        params.fecha_hasta = fechaHasta;
      if (estadoFiltro)      params.estado      = estadoFiltro;
      if (combustibleFiltro) params.combustible = combustibleFiltro;
      if (estacionFiltro)    params.estacion    = estacionFiltro;

      const res = await api.get("/api/reportes/solicitudes/", {
        params,
        responseType: "blob",
      });

      const ext  = formato === "PDF" ? "pdf" : "xlsx";
      const url  = URL.createObjectURL(new Blob([res.data]));
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `reporte_solicitudes.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setExito(`Reporte ${formato} descargado correctamente.`);
    } catch {
      setError("Error al generar el reporte.");
    } finally { setDescargando(false); }
  };

  const descargarConsumidores = async () => {
    setDescargandoCons(true); setError(""); setExito("");
    try {
      await reportesService.descargar(filtroConsumidor, formatoCons, diasCons);
      setExito(`Reporte de consumidores ${formatoCons} descargado.`);
    } catch {
      setError("Error al generar el reporte.");
    } finally { setDescargandoCons(false); }
  };

  const inputCls = "px-3 py-2 rounded-xl border border-border text-sm bg-input focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-card outline-none";

  return (
    <Layout>
      <div className="space-y-5">

        {/* TÍTULO */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-navbar rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-navbar-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
            <p className="text-muted-foreground text-sm">Estadísticas y reportes del sistema ANH</p>
          </div>
        </div>

        {/* ALERTAS */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {exito && (
          <div className="flex items-center gap-3 bg-state-success-bg border border-state-success-fg/20 text-state-success-fg rounded-xl px-4 py-3 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" /> {exito}
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setTab("solicitudes")}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-xl transition-colors ${
              tab === "solicitudes"
                ? "bg-navbar text-navbar-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Solicitudes
          </button>
          <button
            onClick={() => setTab("consumidores")}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-xl transition-colors ${
              tab === "consumidores"
                ? "bg-navbar text-navbar-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Consumidores
          </button>
        </div>

        {/* TAB SOLICITUDES */}
        {tab === "solicitudes" && (
          <div className="space-y-5">

            {/* FILTROS */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Filtros</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Desde</label>
                  <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Hasta</label>
                  <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Estado</label>
                  <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)} className={inputCls}>
                    {ESTADOS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Combustible</label>
                  <select value={combustibleFiltro} onChange={e => setCombustibleFiltro(e.target.value)} className={inputCls}>
                    <option value="">Todos</option>
                    <option value="GASOLINA">Gasolina</option>
                    <option value="DIESEL">Diésel</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Estación</label>
                  <select value={estacionFiltro} onChange={e => setEstacionFiltro(e.target.value)} className={inputCls}>
                    <option value="">Todas</option>
                    {estaciones.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={cargarEstadisticas}
                    disabled={loadStats}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover disabled:bg-slate-300 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadStats ? "animate-spin" : ""}`} />
                    Aplicar
                  </button>
                </div>
              </div>
            </div>

            {/* MÉTRICAS */}
            {stats && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Metrica label="Total solicitudes"    value={stats.total} />
                  <Metrica label="Litros solicitados"   value={`${stats.litros.solicitados.toLocaleString()} L`} />
                  <Metrica label="Litros aprobados"     value={`${stats.litros.aprobados.toLocaleString()} L`} />
                  <Metrica label="Litros despachados"   value={`${stats.litros.despachados.toLocaleString()} L`} />
                </div>

                {/* GRÁFICOS FILA 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* Por estado — Pie */}
                  <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
                    <h3 className="font-semibold text-foreground mb-4 text-sm">Solicitudes por estado</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={stats.por_estado}
                          dataKey="total"
                          nameKey="estado"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ estado, total }) => `${estado}: ${total}`}
                          labelLine={false}
                        >
                          {stats.por_estado.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={ESTADO_COLORS[entry.estado] ?? "#CBD5E1"}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v} solicitudes`]} />
                        <Legend formatter={(v) => v} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Por combustible — Bar */}
                  <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
                    <h3 className="font-semibold text-foreground mb-4 text-sm">Por tipo de combustible</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={stats.por_combustible} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="tipo_combustible" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total"  name="Solicitudes" fill={COMBUSTIBLE_COLORS[0]} radius={[4,4,0,0]} />
                        <Bar dataKey="litros" name="Litros sol." fill={COMBUSTIBLE_COLORS[1]} radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* EVOLUCIÓN MENSUAL */}
                {stats.por_mes.length > 0 && (
                  <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
                    <h3 className="font-semibold text-foreground mb-4 text-sm">Evolución mensual (últimos 12 meses)</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={stats.por_mes} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="total"      name="Total"      stroke="#17212B" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="aprobadas"  name="Aprobadas"  stroke="#10B981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="despachadas" name="Despachadas" stroke="#3B82F6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* GRÁFICOS FILA 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {stats.por_estacion.length > 0 && (
                    <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
                      <h3 className="font-semibold text-foreground mb-4 text-sm">Top estaciones de servicio</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          data={stats.por_estacion}
                          layout="vertical"
                          margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis dataKey="estacion_nombre" type="category" tick={{ fontSize: 10 }} width={120} />
                          <Tooltip />
                          <Bar dataKey="total" name="Solicitudes" fill="#10B981" radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {stats.por_municipio.length > 0 && (
                    <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
                      <h3 className="font-semibold text-foreground mb-4 text-sm">Top municipios</h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          data={stats.por_municipio}
                          layout="vertical"
                          margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis dataKey="municipio" type="category" tick={{ fontSize: 10 }} width={100} />
                          <Tooltip />
                          <Bar dataKey="total" name="Solicitudes" fill="#F59E0B" radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </>
            )}

            {loadStats && !stats && (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {errorStats && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {errorStats}
              </div>
            )}

            {/* DESCARGA */}
            <div className="bg-navbar rounded-2xl p-6 text-navbar-foreground">
              <h3 className="font-semibold mb-3">Descargar reporte de solicitudes</h3>
              <p className="text-navbar-muted text-xs mb-4">
                Descarga el reporte con los mismos filtros aplicados arriba.
              </p>
              <div className="flex gap-3 mb-4">
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                  formato === "EXCEL" ? "border-primary bg-primary/20" : "border-white/20 hover:border-white/40"
                }`}>
                  <input type="radio" name="formato" value="EXCEL" checked={formato === "EXCEL"} onChange={() => setFormato("EXCEL")} className="hidden" />
                  <FileSpreadsheet className="w-4 h-4" /> <span className="text-sm font-medium">Excel</span>
                </label>
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                  formato === "PDF" ? "border-primary bg-primary/20" : "border-white/20 hover:border-white/40"
                }`}>
                  <input type="radio" name="formato" value="PDF" checked={formato === "PDF"} onChange={() => setFormato("PDF")} className="hidden" />
                  <FileText className="w-4 h-4" /> <span className="text-sm font-medium">PDF</span>
                </label>
              </div>
              <button
                onClick={descargarSolicitudes}
                disabled={descargando}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-slate-500 text-primary-foreground font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {descargando
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Download className="w-5 h-5" />
                }
                {descargando ? "Generando..." : `Descargar ${formato}`}
              </button>
            </div>
          </div>
        )}

        {/* TAB CONSUMIDORES */}
        {tab === "consumidores" && (
          <div className="max-w-2xl space-y-5">
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Reporte de consumidores</h2>
              </div>
              <div className="px-6 py-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">Tipo de reporte</label>
                  <div className="grid grid-cols-1 gap-2">
                    {FILTROS_CONSUMIDORES.map(f => (
                      <label key={f.value} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                        filtroConsumidor === f.value ? "border-primary bg-primary/10" : "border-border hover:bg-background"
                      }`}>
                        <input type="radio" name="filtro_cons" value={f.value} checked={filtroConsumidor === f.value}
                          onChange={() => setFiltroConsumidor(f.value)} className="text-primary accent-primary" />
                        <p className={`text-sm font-medium ${filtroConsumidor === f.value ? "text-primary" : "text-foreground"}`}>
                          {f.label}
                        </p>
                      </label>
                    ))}
                  </div>
                </div>

                {filtroConsumidor === "SUPERARON_LIMITE" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Período (días)</label>
                    <div className="flex gap-2 flex-wrap">
                      {[7, 15, 30, 60, 90].map(d => (
                        <button key={d} onClick={() => setDiasCons(d)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            diasCons === d ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-background"
                          }`}>
                          {d} días
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">Formato</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["EXCEL", "PDF"] as const).map(f => (
                      <label key={f} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                        formatoCons === f
                          ? f === "EXCEL" ? "border-primary bg-primary/10" : "border-red-500 bg-red-50"
                          : "border-border hover:bg-background"
                      }`}>
                        <input type="radio" name="formato_cons" value={f} checked={formatoCons === f}
                          onChange={() => setFormatoCons(f)} className="hidden" />
                        {f === "EXCEL"
                          ? <FileSpreadsheet className={`w-5 h-5 ${formatoCons === "EXCEL" ? "text-primary" : "text-muted-foreground"}`} />
                          : <FileText        className={`w-5 h-5 ${formatoCons === "PDF"   ? "text-red-600"   : "text-muted-foreground"}`} />
                        }
                        <p className={`text-sm font-medium ${
                          formatoCons === f
                            ? f === "EXCEL" ? "text-primary" : "text-red-700"
                            : "text-foreground"
                        }`}>{f}</p>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-navbar rounded-2xl p-6 text-navbar-foreground">
              <h3 className="font-semibold mb-1">Resumen</h3>
              <p className="text-navbar-muted text-sm mb-4">
                {FILTROS_CONSUMIDORES.find(f => f.value === filtroConsumidor)?.label} — {formatoCons}
              </p>
              <button
                onClick={descargarConsumidores}
                disabled={descargandoCons}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-slate-500 text-primary-foreground font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {descargandoCons
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Download className="w-5 h-5" />
                }
                {descargandoCons ? "Generando..." : `Descargar ${formatoCons}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}