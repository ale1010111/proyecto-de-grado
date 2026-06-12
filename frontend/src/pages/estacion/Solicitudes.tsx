// src/pages/estacion/Solicitudes.tsx
//
// IMPLEMENTACIÓN:
// 1. Copiar a src/pages/estacion/Solicitudes.tsx
// 2. Ejecutar en el backend antes de probar:
//    python manage.py expirar_solicitudes
// 3. El componente filtra automáticamente solicitudes
//    vencidas en el frontend aunque el cron no haya corrido

import { useState, useEffect, useMemo } from "react";
import Layout from "../../components/Layout";
import { EstadoSolicitudBadge } from "../../components/ui/EstadoBadge";
import { solicitudesService } from "../../services/solicitudes.service";
import type { Solicitud } from "../../types/solicitud.types";
import { COMBUSTIBLES } from "../../utils/constants";
import { formatFecha, formatIdPublico } from "../../utils/format";
import { useAuth } from "../../context/AuthContext";
import {
  FileText, RefreshCw, AlertCircle, CheckCircle,
  Search, Truck, X, Droplets, Clock, AlertTriangle,
  CheckCircle2
} from "lucide-react";

// ------------------------------------------------
// HELPER — días restantes hasta vencimiento
// ------------------------------------------------
const tiempoRestante = (fecha: string | null): {
  horas: number;
  urgencia: "ok" | "advertencia" | "critico" | "vencido"
} => {
  if (!fecha) return { horas: 0, urgencia: "ok" };
  const diff  = new Date(fecha).getTime() - Date.now();
  const horas = Math.floor(diff / (1000 * 60 * 60));

  if (diff <= 0)      return { horas: 0,     urgencia: "vencido"    };
  if (horas <= 6)     return { horas,         urgencia: "critico"    };
  if (horas <= 24)    return { horas,         urgencia: "advertencia" };
  return               { horas,               urgencia: "ok"          };
};

const urgenciaConfig = {
  ok:          { color: "bg-green-50 border-green-200",  badge: "bg-green-100 text-green-700",  icono: CheckCircle2,    texto: "h" },
  advertencia: { color: "bg-amber-50 border-amber-200",  badge: "bg-amber-100 text-amber-700",  icono: Clock,           texto: "h" },
  critico:     { color: "bg-red-50 border-red-200",      badge: "bg-red-100 text-red-700",      icono: AlertTriangle,   texto: "h restantes" },
  vencido:     { color: "bg-slate-50 border-slate-200",  badge: "bg-slate-100 text-slate-500",  icono: AlertTriangle,   texto: "Vencida" },
};

export default function SolicitudesESS() {
  const { user }  = useAuth();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [exito,       setExito]       = useState("");
  const [busqueda,    setBusqueda]    = useState("");
  const [mostrarVencidas, setMostrarVencidas] = useState(false);

  // Modal despacho
  const [modalSolicitud,    setModalSolicitud]    = useState<Solicitud | null>(null);
  const [litrosDespachados, setLitrosDespachados] = useState<number>(0);
  const [observacion,       setObservacion]       = useState("");
  const [despachando,       setDespachando]       = useState(false);

  const cargar = async () => {
    setLoading(true); setError("");
    try {
      const params: Record<string, string> = {
        estado:   "APROBADA",
        ordering: "fecha_expiracion",
      };
      if (busqueda) params.search = busqueda;
      const res = await solicitudesService.getAll(params);
      setSolicitudes(res.results ?? res as unknown as Solicitud[]);
    } catch {
      setError("Error al cargar las solicitudes.");
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  // ------------------------------------------------
  // FILTRAR — separar vigentes y vencidas
  // (el cron puede no haber corrido aún)
  // ------------------------------------------------
  const { vigentes, vencidas } = useMemo(() => {
    const v:  Solicitud[] = [];
    const ve: Solicitud[] = [];
    solicitudes.forEach(s => {
      const { urgencia } = tiempoRestante(s.fecha_expiracion);
      if (urgencia === "vencido") ve.push(s);
      else v.push(s);
    });
    // Ordenar vigentes por urgencia — más urgentes primero
    v.sort((a, b) => {
      const ta = new Date(a.fecha_expiracion ?? "").getTime();
      const tb = new Date(b.fecha_expiracion ?? "").getTime();
      return ta - tb;
    });
    return { vigentes: v, vencidas: ve };
  }, [solicitudes]);

  // ------------------------------------------------
  // ESTADÍSTICAS
  // ------------------------------------------------
  const totalLitrosPendientes = vigentes.reduce(
    (acc, s) => acc + (s.litros_aprobados ?? 0), 0
  );
  const solicitudesUrgentes = vigentes.filter(s =>
    tiempoRestante(s.fecha_expiracion).urgencia === "critico"
  ).length;

  // ------------------------------------------------
  // DESPACHO
  // ------------------------------------------------
  const onBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargar();
  };

  const abrirDespacho = (s: Solicitud) => {
    setModalSolicitud(s);
    setLitrosDespachados(s.litros_aprobados ?? 0);
    setObservacion("");
    setError("");
  };

  const confirmarDespacho = async () => {
    if (!modalSolicitud) return;
    const maxLitros = modalSolicitud.litros_aprobados ?? 0;
    if (litrosDespachados <= 0) { setError("Ingresa los litros despachados."); return; }
    if (litrosDespachados > maxLitros) { setError(`No puedes despachar más de ${maxLitros} L aprobados.`); return; }

    setDespachando(true); setError("");
    try {
      await solicitudesService.despachar(modalSolicitud.id_publico, {
        litros_despachados: litrosDespachados,
        observacion,
      });
      setExito(`✓ Solicitud #${formatIdPublico(modalSolicitud.id_publico)} despachada — ${litrosDespachados} L de ${COMBUSTIBLES[modalSolicitud.tipo_combustible_aprobado ?? ""] ?? "combustible"}.`);
      setModalSolicitud(null);
      await cargar();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0] : (detail ?? "Error al despachar la solicitud."));
    } finally { setDespachando(false); }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none";

  // ------------------------------------------------
  // CARD DE SOLICITUD
  // ------------------------------------------------
  const SolicitudCard = ({ s }: { s: Solicitud }) => {
    const { horas, urgencia } = tiempoRestante(s.fecha_expiracion);
    const cfg = urgenciaConfig[urgencia];
    const IconoUrgencia = cfg.icono;
    const esVencida = urgencia === "vencido";

    return (
      <div className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${cfg.color}`}>
        <div className="px-5 py-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              esVencida ? "bg-slate-200" : "bg-green-100"
            }`}>
              <FileText className={`w-5 h-5 ${esVencida ? "text-slate-400" : "text-green-600"}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="font-semibold text-slate-800 text-sm">
                  #{formatIdPublico(s.id_publico)}
                </p>
                <EstadoSolicitudBadge estado={s.estado} />
                {/* Badge de urgencia */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
                  <IconoUrgencia className="w-3 h-3" />
                  {esVencida ? "Vencida" : `${horas}${cfg.texto}`}
                </span>
              </div>
              <p className="text-sm text-slate-700 font-medium">
                {(s as any).consumidor_nombre ?? s.consumidor?.nombre_completo ?? "—"}
              </p>
              <p className="text-xs text-slate-400">
                {(s as any).consumidor_email ?? s.consumidor?.email ?? "—"}
              </p>
            </div>
          </div>

          {/* LITROS APROBADOS */}
          <div className="text-right shrink-0">
            <p className={`text-2xl font-bold ${esVencida ? "text-slate-400" : "text-green-600"}`}>
              {s.litros_aprobados ?? "—"} L
            </p>
            <p className="text-xs text-slate-500">
              {COMBUSTIBLES[s.tipo_combustible_aprobado ?? ""] ?? s.tipo_combustible_aprobado ?? "—"}
            </p>
            <p className="text-xs text-slate-400">aprobados</p>
          </div>
        </div>

        {/* DETALLES */}
        <div className="px-5 pb-3 grid grid-cols-3 gap-3 border-t border-white/50 pt-3">
          <div>
            <p className="text-xs text-slate-400">Fecha aprobación</p>
            <p className="text-xs font-medium text-slate-600">{formatFecha(s.fecha_aprobacion)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Válido hasta</p>
            <p className={`text-xs font-medium ${
              urgencia === "critico" ? "text-red-600" :
              urgencia === "advertencia" ? "text-amber-600" :
              urgencia === "vencido" ? "text-slate-400" : "text-green-600"
            }`}>
              {formatFecha(s.fecha_expiracion, true)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Uso declarado</p>
            <p className="text-xs text-slate-600 truncate">{s.uso_combustible || "—"}</p>
          </div>
        </div>

        {/* BOTÓN DESPACHAR */}
        {!esVencida && (
          <div className="px-5 py-3 border-t border-white/50">
            <button
              onClick={() => abrirDespacho(s)}
              className={`flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-medium transition-colors ${
                urgencia === "critico"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              <Truck className="w-4 h-4" />
              {urgencia === "critico" ? "¡Despachar urgente!" : "Registrar despacho"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-5">

        {/* TÍTULO */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a3a5c] rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Solicitudes para despacho</h1>
              <p className="text-slate-500 text-sm">{user?.nombres} — {vigentes.length} vigente(s)</p>
            </div>
          </div>
          <button onClick={cargar} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{vigentes.length}</p>
                <p className="text-xs text-slate-500">Pendientes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                <Droplets className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{totalLitrosPendientes} L</p>
                <p className="text-xs text-slate-500">Por despachar</p>
              </div>
            </div>
          </div>
          <div className={`rounded-2xl border shadow-sm p-4 ${solicitudesUrgentes > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${solicitudesUrgentes > 0 ? "bg-red-100" : "bg-slate-100"}`}>
                <AlertTriangle className={`w-4 h-4 ${solicitudesUrgentes > 0 ? "text-red-600" : "text-slate-400"}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${solicitudesUrgentes > 0 ? "text-red-600" : "text-slate-800"}`}>{solicitudesUrgentes}</p>
                <p className="text-xs text-slate-500">Urgentes (&lt;6h)</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-400">{vencidas.length}</p>
                <p className="text-xs text-slate-500">Vencidas</p>
              </div>
            </div>
          </div>
        </div>

        {/* ALERTAS */}
        {solicitudesUrgentes > 0 && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>{solicitudesUrgentes} solicitud(es)</strong> vencen en menos de 6 horas.
              Despáchalas a la brevedad posible.
            </span>
          </div>
        )}
        {error && !modalSolicitud && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {exito && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" /> {exito}
          </div>
        )}

        {/* BÚSQUEDA */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <form onSubmit={onBuscar} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por N° solicitud o consumidor..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] transition-colors">
              Buscar
            </button>
          </form>
        </div>

        {/* LISTA VIGENTES */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : vigentes.length === 0 && vencidas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-center py-16">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold">Sin solicitudes pendientes</p>
            <p className="text-slate-400 text-sm mt-1">Todas las solicitudes han sido despachadas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vigentes.map(s => <SolicitudCard key={s.id_publico} s={s} />)}
          </div>
        )}

        {/* SECCIÓN VENCIDAS */}
        {vencidas.length > 0 && (
          <div>
            <button
              onClick={() => setMostrarVencidas(!mostrarVencidas)}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm transition-colors"
            >
              <Clock className="w-4 h-4" />
              {mostrarVencidas ? "Ocultar" : "Mostrar"} {vencidas.length} solicitud(es) vencida(s)
            </button>
            {mostrarVencidas && (
              <div className="space-y-3 mt-3">
                {vencidas.map(s => <SolicitudCard key={s.id_publico} s={s} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DESPACHO */}
      {modalSolicitud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalSolicitud(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Registrar despacho</h3>
              <button onClick={() => setModalSolicitud(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* INFO */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                {[
                  ["N° Solicitud", `#${formatIdPublico(modalSolicitud.id_publico)}`],
                  ["Consumidor", (modalSolicitud as any).consumidor_nombre ?? modalSolicitud.consumidor?.nombre_completo ?? "—"],
                  ["Válido hasta", formatFecha(modalSolicitud.fecha_expiracion, true)],
                  ["Combustible", COMBUSTIBLES[modalSolicitud.tipo_combustible_aprobado ?? ""] ?? "—"],
                ].map(([label, valor]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-xs font-medium text-slate-700">{valor}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-xs text-slate-500">Litros aprobados</span>
                  <span className="text-lg font-bold text-green-600">{modalSolicitud.litros_aprobados ?? "—"} L</span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Litros despachados *
                </label>
                <input
                  type="number"
                  min={1}
                  max={modalSolicitud.litros_aprobados ?? 120}
                  value={litrosDespachados}
                  onChange={e => setLitrosDespachados(Number(e.target.value))}
                  className={inputCls}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Máximo: {modalSolicitud.litros_aprobados ?? "—"} L aprobados
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Observación (opcional)
                </label>
                <textarea
                  value={observacion}
                  onChange={e => setObservacion(e.target.value)}
                  rows={2}
                  placeholder="Notas sobre el despacho..."
                  className={inputCls + " resize-none"}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setModalSolicitud(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={confirmarDespacho}
                disabled={despachando}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
              >
                {despachando
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Truck className="w-4 h-4" />
                }
                {despachando ? "Despachando..." : "Confirmar despacho"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}