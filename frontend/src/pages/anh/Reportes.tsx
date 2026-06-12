// src/pages/anh/Reportes.tsx

import { useState } from "react";
import Layout from "../../components/Layout";
import { reportesService } from "../../services/reportes.service";
import { BarChart3, Download, FileText, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";

const FILTROS = [
  { value: "TODOS",            label: "Todos los consumidores",          desc: "Reporte general con estadísticas de todos los consumidores registrados." },
  { value: "BLOQUEADOS",       label: "Consumidores bloqueados",         desc: "Solo consumidores con alerta de repetitividad en estado BLOQUEADO." },
  { value: "EN_REVISION",      label: "Consumidores en revisión",        desc: "Consumidores marcados para revisión por actividad inusual." },
  { value: "SUPERARON_LIMITE", label: "Superaron el límite",             desc: "Consumidores que superaron el límite de solicitudes en el período configurado." },
];

export default function ReportesANH() {
  const [filtro,     setFiltro]     = useState("TODOS");
  const [formato,    setFormato]    = useState<"PDF" | "EXCEL">("EXCEL");
  const [dias,       setDias]       = useState(30);
  const [descargando, setDescargando] = useState(false);
  const [error,      setError]      = useState("");
  const [exito,      setExito]      = useState("");

  const descargar = async () => {
    setDescargando(true);
    setError("");
    setExito("");
    try {
      await reportesService.descargar(filtro, formato, dias);
      setExito(`Reporte ${formato} descargado correctamente.`);
    } catch {
      setError("Error al generar el reporte. Intenta nuevamente.");
    } finally {
      setDescargando(false);
    }
  };

  const filtroSeleccionado = FILTROS.find(f => f.value === filtro);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* TÍTULO */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1a3a5c] rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
            <p className="text-slate-500 text-sm">Genera reportes de consumidores en PDF o Excel</p>
          </div>
        </div>

        {/* ALERTAS */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {exito && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" /> {exito}
          </div>
        )}

        {/* CONFIGURACIÓN */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">Configurar reporte</h2>
          </div>
          <div className="px-6 py-5 space-y-5">

            {/* FILTRO */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Tipo de reporte
              </label>
              <div className="grid grid-cols-1 gap-2">
                {FILTROS.map(f => (
                  <label
                    key={f.value}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      filtro === f.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="filtro"
                      value={f.value}
                      checked={filtro === f.value}
                      onChange={() => setFiltro(f.value)}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <p className={`text-sm font-medium ${filtro === f.value ? "text-blue-700" : "text-slate-700"}`}>
                        {f.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* PERÍODO */}
            {filtro === "SUPERARON_LIMITE" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Período de análisis (días)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[7, 15, 30, 60, 90].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDias(d)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        dias === d
                          ? "bg-[#1a3a5c] text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {d} días
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FORMATO */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Formato de descarga
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  formato === "EXCEL"
                    ? "border-green-500 bg-green-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}>
                  <input
                    type="radio"
                    name="formato"
                    value="EXCEL"
                    checked={formato === "EXCEL"}
                    onChange={() => setFormato("EXCEL")}
                    className="text-green-600"
                  />
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className={`w-5 h-5 ${formato === "EXCEL" ? "text-green-600" : "text-slate-400"}`} />
                    <div>
                      <p className={`text-sm font-medium ${formato === "EXCEL" ? "text-green-700" : "text-slate-700"}`}>Excel</p>
                      <p className="text-xs text-slate-400">.xlsx</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  formato === "PDF"
                    ? "border-red-500 bg-red-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}>
                  <input
                    type="radio"
                    name="formato"
                    value="PDF"
                    checked={formato === "PDF"}
                    onChange={() => setFormato("PDF")}
                    className="text-red-600"
                  />
                  <div className="flex items-center gap-2">
                    <FileText className={`w-5 h-5 ${formato === "PDF" ? "text-red-600" : "text-slate-400"}`} />
                    <div>
                      <p className={`text-sm font-medium ${formato === "PDF" ? "text-red-700" : "text-slate-700"}`}>PDF</p>
                      <p className="text-xs text-slate-400">.pdf</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RESUMEN Y BOTÓN */}
        <div className="bg-[#1a3a5c] rounded-2xl p-6 text-white">
          <h3 className="font-semibold mb-1">Resumen del reporte</h3>
          <p className="text-blue-200 text-sm mb-1">{filtroSeleccionado?.label}</p>
          {filtro === "SUPERARON_LIMITE" && (
            <p className="text-blue-300 text-xs mb-1">Período: últimos {dias} días</p>
          )}
          <p className="text-blue-300 text-xs mb-4">Formato: {formato}</p>
          <button
            onClick={descargar}
            disabled={descargando}
            className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-500 disabled:cursor-not-allowed text-[#1a3a5c] font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {descargando
              ? <div className="w-5 h-5 border-2 border-[#1a3a5c] border-t-transparent rounded-full animate-spin" />
              : <Download className="w-5 h-5" />
            }
            {descargando ? "Generando reporte..." : `Descargar ${formato}`}
          </button>
        </div>
      </div>
    </Layout>
  );
}