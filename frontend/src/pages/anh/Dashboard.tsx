// src/pages/anh/Dashboard.tsx

import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { reportesService } from "../../services/reportes.service";
import {
  LayoutDashboard, FileText, Users, CheckCircle,
  Clock, AlertTriangle, TrendingUp,
  Flame, Building2, RefreshCw
} from "lucide-react";

// ------------------------------------------------
// TIPOS
// ------------------------------------------------

interface DashboardData {
  generado_en: string;
  solicitudes: {
    por_estado: {
      pendientes: number; observadas: number; aprobadas: number;
      despachadas: number; rechazadas: number; canceladas: number; expiradas: number;
    };
    hoy: { nuevas: number; despachos: number };
    mes_actual: {
      total: number; litros_solicitados: number;
      litros_aprobados: number; litros_despachados: number;
    };
    proximas_a_expirar: number;
  };
  consumidores: {
    total: number; verificados: number; pendientes_identidad: number;
    en_revision_identidad: number; bloqueados: number; en_revision_alerta: number;
  };
  por_combustible: { tipo: string; solicitudes: number; litros: number }[];
  top_estaciones:  { nombre: string; municipio: string; despachos: number; litros: number }[];
  tendencia_7_dias: { fecha: string; solicitudes: number; despachos: number }[];
}

// ------------------------------------------------
// COMPONENTES HELPER
// ------------------------------------------------

function StatCard({
  label, value, sub, icon: Icon, color
}: {
  label: string; value: number | string; sub?: string;
  icon: any; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function EstadoRow({
  label, value, color
}: {
  label: string; value: number; color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}

// ------------------------------------------------
// COMPONENTE PRINCIPAL
// ------------------------------------------------

export default function DashboardANH() {
  const [data,     setData]     = useState<DashboardData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const cargar = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await reportesService.getDashboard();
      setData(res);
    } catch {
      setError("Error al cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (error || !data) return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-slate-600">{error || "Sin datos"}</p>
        <button onClick={cargar} className="flex items-center gap-2 px-4 py-2 bg-[#1a3a5c] text-white rounded-xl text-sm">
          <RefreshCw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    </Layout>
  );

  const { solicitudes, consumidores, por_combustible, top_estaciones, tendencia_7_dias } = data;
  const maxTendencia = Math.max(...tendencia_7_dias.map(d => d.solicitudes), 1);

  return (
    <Layout>
      <div className="space-y-6">

        {/* TÍTULO */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a3a5c] rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
              <p className="text-slate-500 text-xs">Actualizado: {data.generado_en}</p>
            </div>
          </div>
          <button
            onClick={cargar}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>

        {/* STATS HOY */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Nuevas hoy"
            value={solicitudes.hoy.nuevas}
            icon={FileText}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            label="Despachos hoy"
            value={solicitudes.hoy.despachos}
            icon={CheckCircle}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            label="Pendientes"
            value={solicitudes.por_estado.pendientes}
            sub="Requieren revisión"
            icon={Clock}
            color="bg-amber-100 text-amber-600"
          />
          <StatCard
            label="Por expirar"
            value={solicitudes.proximas_a_expirar}
            sub="Próximas 24h"
            icon={AlertTriangle}
            color="bg-orange-100 text-orange-600"
          />
        </div>

        {/* FILA 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ESTADOS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Estado de solicitudes
            </h3>
            <div className="divide-y divide-slate-100">
              <EstadoRow label="Pendientes"  value={solicitudes.por_estado.pendientes}  color="bg-amber-400" />
              <EstadoRow label="Observadas"  value={solicitudes.por_estado.observadas}  color="bg-orange-400" />
              <EstadoRow label="Aprobadas"   value={solicitudes.por_estado.aprobadas}   color="bg-green-400" />
              <EstadoRow label="Despachadas" value={solicitudes.por_estado.despachadas} color="bg-blue-400" />
              <EstadoRow label="Rechazadas"  value={solicitudes.por_estado.rechazadas}  color="bg-red-400" />
              <EstadoRow label="Canceladas"  value={solicitudes.por_estado.canceladas}  color="bg-slate-400" />
              <EstadoRow label="Expiradas"   value={solicitudes.por_estado.expiradas}   color="bg-gray-400" />
            </div>
          </div>

          {/* CONSUMIDORES */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Consumidores
            </h3>
            <div className="space-y-3">
              {[
                { label: "Total registrados",    value: consumidores.total,                color: "bg-slate-100 text-slate-700" },
                { label: "Verificados",          value: consumidores.verificados,          color: "bg-green-100 text-green-700" },
                { label: "Pend. verificación",   value: consumidores.pendientes_identidad, color: "bg-amber-100 text-amber-700" },
                { label: "En revisión identidad",value: consumidores.en_revision_identidad,color: "bg-orange-100 text-orange-700" },
                { label: "En revisión alerta",   value: consumidores.en_revision_alerta,   color: "bg-yellow-100 text-yellow-700" },
                { label: "Bloqueados",           value: consumidores.bloqueados,           color: "bg-red-100 text-red-700" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* MES ACTUAL */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Mes actual
            </h3>
            <div className="space-y-4">
              {[
                { label: "Total solicitudes",    value: solicitudes.mes_actual.total,              unit: "" },
                { label: "Litros solicitados",   value: solicitudes.mes_actual.litros_solicitados, unit: " L" },
                { label: "Litros aprobados",     value: solicitudes.mes_actual.litros_aprobados,   unit: " L" },
                { label: "Litros despachados",   value: solicitudes.mes_actual.litros_despachados, unit: " L" },
              ].map(({ label, value, unit }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-xs font-semibold text-slate-700">{value}{unit}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-[#1a3a5c] h-1.5 rounded-full"
                      style={{ width: `${Math.min((value / (solicitudes.mes_actual.litros_solicitados || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FILA 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* TENDENCIA 7 DÍAS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Tendencia últimos 7 días
            </h3>
            <div className="flex items-end gap-2 h-32">
              {tendencia_7_dias.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center gap-0.5" style={{ height: "100px" }}>
                    <div className="flex items-end gap-0.5 h-full w-full">
                      <div
                        className="flex-1 bg-[#1a3a5c] rounded-t-sm transition-all"
                        style={{ height: `${(d.solicitudes / maxTendencia) * 100}%`, minHeight: d.solicitudes ? "4px" : "0" }}
                        title={`Solicitudes: ${d.solicitudes}`}
                      />
                      <div
                        className="flex-1 bg-green-400 rounded-t-sm transition-all"
                        style={{ height: `${(d.despachos / maxTendencia) * 100}%`, minHeight: d.despachos ? "4px" : "0" }}
                        title={`Despachos: ${d.despachos}`}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{d.fecha}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-[#1a3a5c] rounded-sm" />
                <span className="text-xs text-slate-500">Solicitudes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-400 rounded-sm" />
                <span className="text-xs text-slate-500">Despachos</span>
              </div>
            </div>
          </div>

          {/* TOP ESTACIONES */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Top estaciones — mes actual
            </h3>
            {top_estaciones.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">Sin datos de despachos este mes</p>
            ) : (
              <div className="space-y-3">
                {top_estaciones.map((e, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-500">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{e.nombre}</p>
                      <p className="text-xs text-slate-400">{e.municipio}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{e.litros} L</p>
                      <p className="text-xs text-slate-400">{e.despachos} despachos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COMBUSTIBLES */}
        {por_combustible.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              Por tipo de combustible — mes actual
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {por_combustible.map((c, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    {c.tipo || "Sin especificar"}
                  </p>
                  <p className="text-2xl font-bold text-[#1a3a5c]">{c.litros} L</p>
                  <p className="text-xs text-slate-500 mt-1">{c.solicitudes} solicitudes</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}