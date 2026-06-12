// src/pages/anh/DetalleSolicitud.tsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "../../components/Layout";
import { EstadoSolicitudBadge } from "../../components/ui/EstadoBadge";
import { solicitudesService } from "../../services/solicitudes.service";
import { estacionesService } from "../../services/estaciones.service";
import type { Solicitud } from "../../types/solicitud.types";
import type { EstacionServicio } from "../../types/estacion.types";
import { COMBUSTIBLES } from "../../utils/constants";
import { formatFecha, formatIdPublico } from "../../utils/format";
import {
  ArrowLeft, CheckCircle, Eye, AlertCircle,
  Download, FileText, MessageSquare, XCircle
} from "lucide-react";
import PDFViewer from "../../components/ui/PDFViewer";

// Schemas
const aprobarSchema = z.object({
  tipo_combustible_aprobado: z.string().min(1, "Selecciona el tipo"),
  litros_aprobados:          z.number().int().min(1).max(120),
  estacion_servicio:         z.number().min(1, "Selecciona una estación"),
  observacion_anh:           z.string().optional(),
});

const observarSchema = z.object({
  observacion_anh: z.string().min(10, "Mínimo 10 caracteres"),
});

const rechazarSchema = z.object({
  observacion_anh: z.string().min(10, "Mínimo 10 caracteres"),
});

type AprobarData = {
  tipo_combustible_aprobado: string;
  litros_aprobados:          number;
  estacion_servicio:         number;
  observacion_anh?:          string;
};
type ObservarData = z.infer<typeof observarSchema>;
type RechazarData = z.infer<typeof rechazarSchema>;

// Sección de datos
function Dato({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value ?? "—"}</p>
    </div>
  );
}

export default function DetalleSolicitudANH() {
  const { idPublico } = useParams<{ idPublico: string }>();
  const navigate      = useNavigate();

  const [solicitud,   setSolicitud]   = useState<Solicitud | null>(null);
  const [estaciones,  setEstaciones]  = useState<EstacionServicio[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [accion,      setAccion]      = useState<"aprobar" | "observar" | "rechazar" | null>(null);
  const [procesando,  setProcesando]  = useState(false);
  const [error,       setError]       = useState("");
  const [exito,       setExito]       = useState("");
  const [pdfViewer,   setPdfViewer]   = useState<"declaracion" | "comprobante" | null>(null);

  const formAprobar = useForm<AprobarData>({
    resolver: zodResolver(aprobarSchema),
    defaultValues: {
      tipo_combustible_aprobado: "",
      litros_aprobados:          1,
      estacion_servicio:         0,
      observacion_anh:           "",
    }
  });
  const formObservar = useForm<ObservarData>({ resolver: zodResolver(observarSchema) });
  const formRechazar = useForm<RechazarData>({ resolver: zodResolver(rechazarSchema) });

  useEffect(() => {
    if (!idPublico) return;
    Promise.all([
      solicitudesService.getById(idPublico),
      estacionesService.getAll({ estado: "ACTIVA" }),
    ]).then(([s, e]) => {
      setSolicitud(s);
      setEstaciones(e);
    }).catch(() => setError("Error al cargar la solicitud."))
    .finally(() => setLoading(false));
  }, [idPublico]);

  const onAprobar = async (data: AprobarData) => {
    if (!idPublico) return;
    setProcesando(true); setError("");
    try {
      const s = await solicitudesService.aprobar(idPublico, data);
      setSolicitud(s);
      setAccion(null);
      setExito("Solicitud aprobada exitosamente.");
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const data2 = e.response?.data;
      if (data2) {
        const msgs = Object.entries(data2)
          .map(([, v]) => Array.isArray(v) ? v[0] : String(v))
          .join(" | ");
        setError(msgs);
      } else {
        setError("Error al aprobar la solicitud.");
      }
    } finally { setProcesando(false); }
  };

  const onObservar = async (data: ObservarData) => {
    if (!idPublico) return;
    setProcesando(true); setError("");
    try {
      const s = await solicitudesService.observar(idPublico, data.observacion_anh);
      setSolicitud(s);
      setAccion(null);
      setExito("Solicitud observada. El consumidor será notificado.");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail ?? "Error al observar la solicitud.");
    } finally { setProcesando(false); }
  };

  const onRechazar = async (data: RechazarData) => {
    if (!idPublico) return;
    setProcesando(true); setError("");
    try {
      const s = await solicitudesService.rechazar(idPublico, data.observacion_anh);
      setSolicitud(s);
      setAccion(null);
      setExito("Solicitud rechazada. El consumidor será notificado.");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail ?? "Error al rechazar la solicitud.");
    } finally { setProcesando(false); }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none";
  const selectCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none";

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (!solicitud) return (
    <Layout>
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-slate-600">{error || "Solicitud no encontrada."}</p>
      </div>
    </Layout>
  );

  const puedeAprobar  = ["PENDIENTE", "OBSERVADA"].includes(solicitud.estado);
  const puedeObservar = solicitud.estado === "PENDIENTE";
  const puedeRechazar = ["PENDIENTE", "OBSERVADA"].includes(solicitud.estado);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/anh/solicitudes")}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800">
                Solicitud #{formatIdPublico(solicitud.id_publico)}
              </h1>
              <EstadoSolicitudBadge estado={solicitud.estado} />
            </div>
            <p className="text-slate-500 text-sm">{formatFecha(solicitud.fecha_creacion, true)}</p>
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

        {/* DATOS CONSUMIDOR */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">Datos del solicitante</h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-2 gap-4">
            <Dato label="Nombre completo" value={solicitud.consumidor?.nombre_completo} />
            <Dato label="Email"           value={solicitud.consumidor?.email} />
          </div>
        </div>

        {/* DATOS SOLICITUD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">Datos de la solicitud</h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-2 gap-4">
            <Dato label="Tipo combustible"   value={COMBUSTIBLES[solicitud.tipo_combustible] ?? solicitud.tipo_combustible} />
            <Dato label="Litros solicitados" value={`${solicitud.litros_solicitados} L`} />
            <Dato label="Uso / destino"      value={solicitud.uso_combustible} />
            <Dato label="Fecha solicitud"    value={formatFecha(solicitud.fecha_creacion, true)} />
            {solicitud.observacion_anh && (
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-1">Observación ANH</p>
                <p className="text-sm text-slate-700 bg-amber-50 rounded-xl px-4 py-2">
                  {solicitud.observacion_anh}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* DATOS APROBACIÓN */}
        {solicitud.litros_aprobados && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700">Datos de aprobación</h2>
            </div>
            <div className="px-6 py-4 grid grid-cols-2 gap-4">
              <Dato label="Combustible aprobado" value={COMBUSTIBLES[solicitud.tipo_combustible_aprobado ?? ""] ?? solicitud.tipo_combustible_aprobado} />
              <Dato label="Litros aprobados"     value={`${solicitud.litros_aprobados} L`} />
              <Dato label="Fecha aprobación"     value={formatFecha(solicitud.fecha_aprobacion, true)} />
              <Dato label="Válido hasta"         value={formatFecha(solicitud.fecha_expiracion, true)} />
              {solicitud.litros_despachados && (
                <Dato label="Litros despachados" value={`${solicitud.litros_despachados} L`} />
              )}
            </div>
          </div>
        )}

        {/* ALERTA IDENTIDAD NO VERIFICADA */}
        {solicitud.consumidor && (solicitud as any).consumidor_estado_identidad &&
         (solicitud as any).consumidor_estado_identidad !== "VERIFICADO" && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              <strong>Atención:</strong> El consumidor no tiene su identidad verificada.
              Verifique los documentos antes de aprobar la solicitud.
            </span>
          </div>
        )}

        {/* ACCIONES */}
        {(puedeAprobar || puedeObservar || puedeRechazar) && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700">Acciones</h2>
            </div>
            <div className="px-6 py-4">

              {/* BOTONES */}
              {!accion && (
                <div className="flex gap-3 flex-wrap">
                  {puedeAprobar && (
                    <button onClick={() => setAccion("aprobar")} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
                      <CheckCircle className="w-4 h-4" /> Aprobar
                    </button>
                  )}
                  {puedeObservar && (
                    <button onClick={() => setAccion("observar")} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors">
                      <MessageSquare className="w-4 h-4" /> Observar
                    </button>
                  )}
                  {puedeRechazar && (
                    <button onClick={() => setAccion("rechazar")} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
                      <XCircle className="w-4 h-4" /> Rechazar
                    </button>
                  )}
                </div>
              )}

              {/* FORM APROBAR */}
              {accion === "aprobar" && (
                <form onSubmit={formAprobar.handleSubmit(onAprobar)} className="space-y-4">
                  <h3 className="font-medium text-green-700 text-sm">Aprobar solicitud</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Combustible a aprobar *</label>
                      <select {...formAprobar.register("tipo_combustible_aprobado")} className={selectCls}>
                        <option value="">Seleccionar...</option>
                        {Object.entries(COMBUSTIBLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      {formAprobar.formState.errors.tipo_combustible_aprobado && <p className="text-red-500 text-xs mt-1">{formAprobar.formState.errors.tipo_combustible_aprobado.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Litros aprobados *</label>
                      <input type="number" min={1} max={120} {...formAprobar.register("litros_aprobados", { valueAsNumber: true })} className={inputCls} placeholder="Máx. 120 L" />
                      {formAprobar.formState.errors.litros_aprobados && <p className="text-red-500 text-xs mt-1">{formAprobar.formState.errors.litros_aprobados.message}</p>}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Estación de servicio *</label>
                      <select {...formAprobar.register("estacion_servicio", { valueAsNumber: true })} className={selectCls}>
                        <option value="">Seleccionar estación...</option>
                        {estaciones.map(e => <option key={e.id} value={e.id}>{e.nombre} — {e.municipio}</option>)}
                      </select>
                      {formAprobar.formState.errors.estacion_servicio && <p className="text-red-500 text-xs mt-1">{formAprobar.formState.errors.estacion_servicio.message}</p>}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Observación (opcional)</label>
                      <textarea {...formAprobar.register("observacion_anh")} rows={2} className={inputCls + " resize-none"} placeholder="Notas para el consumidor..." />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setAccion(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
                    <button type="submit" disabled={procesando} className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:bg-slate-300 transition-colors">
                      {procesando ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Confirmar aprobación
                    </button>
                  </div>
                </form>
              )}

              {/* FORM OBSERVAR */}
              {accion === "observar" && (
                <form onSubmit={formObservar.handleSubmit(onObservar)} className="space-y-4">
                  <h3 className="font-medium text-amber-700 text-sm">Observar solicitud</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Motivo de la observación *</label>
                    <textarea {...formObservar.register("observacion_anh")} rows={3} className={inputCls + " resize-none"} placeholder="Describe qué debe corregir o justificar el consumidor..." />
                    {formObservar.formState.errors.observacion_anh && <p className="text-red-500 text-xs mt-1">{formObservar.formState.errors.observacion_anh.message}</p>}
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setAccion(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
                    <button type="submit" disabled={procesando} className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 disabled:bg-slate-300 transition-colors">
                      {procesando ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                      Enviar observación
                    </button>
                  </div>
                </form>
              )}

              {/* FORM RECHAZAR */}
              {accion === "rechazar" && (
                <form onSubmit={formRechazar.handleSubmit(onRechazar)} className="space-y-4">
                  <h3 className="font-medium text-red-700 text-sm">Rechazar solicitud</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Motivo del rechazo *</label>
                    <textarea {...formRechazar.register("observacion_anh")} rows={3} className={inputCls + " resize-none"} placeholder="Describe el motivo del rechazo..." />
                    {formRechazar.formState.errors.observacion_anh && <p className="text-red-500 text-xs mt-1">{formRechazar.formState.errors.observacion_anh.message}</p>}
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setAccion(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">Cancelar</button>
                    <button type="submit" disabled={procesando} className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:bg-slate-300 transition-colors">
                      {procesando ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Confirmar rechazo
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* DOCUMENTOS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">Documentos</h2>
          </div>
          <div className="px-6 py-4 flex gap-3 flex-wrap">
            <button
              onClick={() => setPdfViewer("declaracion")}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <Eye className="w-4 h-4" /> Ver declaración jurada
            </button>
            {solicitud.estado === "APROBADA" && (
              <button
                onClick={() => setPdfViewer("comprobante")}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors"
              >
                <Eye className="w-4 h-4" /> Ver comprobante
              </button>
            )}
            {solicitud.documento_justificativo && (
              <a
                href={solicitud.documento_justificativo}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                <Eye className="w-4 h-4" /> Doc. justificativo
              </a>
            )}
          </div>
        </div>

      </div>

      {/* PDF VIEWER MODAL */}
      {pdfViewer === "declaracion" && (
        <PDFViewer
          titulo={"Declaración Jurada — #" + formatIdPublico(solicitud.id_publico)}
          onClose={() => setPdfViewer(null)}
          fetchPDF={() => solicitudesService.getDeclaracionJuradaBlob(solicitud.id_publico)}
          onDescargar={() => solicitudesService.descargarDeclaracionJurada(solicitud.id_publico)}
        />
      )}
      {pdfViewer === "comprobante" && (
        <PDFViewer
          titulo={"Comprobante — #" + formatIdPublico(solicitud.id_publico)}
          onClose={() => setPdfViewer(null)}
          fetchPDF={() => solicitudesService.getComprobanteBlob(solicitud.id_publico)}
          onDescargar={() => solicitudesService.descargarComprobante(solicitud.id_publico)}
        />
      )}

    </Layout>
  );
}