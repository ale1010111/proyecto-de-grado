// src/pages/anh/DetalleConsumidor.tsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { EstadoSolicitudBadge, AlertaBadge } from "../../components/ui/EstadoBadge";
import { consumidoresService } from "../../services/consumidores.service";
import type { ConsumidorPerfil } from "../../types/consumidor.types";
import { ACTIVIDADES } from "../../utils/constants";
import { formatFecha } from "../../utils/format";
import {
  ArrowLeft, User, MapPin, Briefcase, Shield,
  FileImage, AlertCircle, CheckCircle, ShieldAlert, ShieldOff
} from "lucide-react";

function Dato({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value ?? "—"}</p>
    </div>
  );
}

export default function DetalleConsumidor() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();

  const [perfil,     setPerfil]     = useState<ConsumidorPerfil | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [exito,      setExito]      = useState("");
  const [procesando, setProcesando] = useState(false);

  const [accionIdentidad, setAccionIdentidad] = useState<string | null>(null);
  const [accionAlerta,    setAccionAlerta]    = useState<string | null>(null);
  const [motivo,          setMotivo]          = useState("");

  useEffect(() => {
    if (!id) return;
    consumidoresService.getById(Number(id))
      .then(setPerfil)
      .catch(() => setError("Error al cargar el consumidor."))
      .finally(() => setLoading(false));
  }, [id]);

  const cambiarIdentidad = async (estado: string) => {
    if (!perfil) return;
    setProcesando(true); setError("");
    try {
      const p = await consumidoresService.verificarIdentidad(perfil.id, {
        estado_identidad: estado,
        observacion:      motivo,
      });
      setPerfil(p);
      setAccionIdentidad(null);
      setMotivo("");
      setExito(`Estado de identidad actualizado a: ${estado}`);
    } catch {
      setError("Error al cambiar el estado de identidad.");
    } finally { setProcesando(false); }
  };

  const cambiarAlerta = async (alerta: string) => {
    if (!perfil) return;
    setProcesando(true); setError("");
    try {
      const p = await consumidoresService.cambiarAlerta(perfil.id, {
        alerta_repetitividad: alerta,
        motivo,
      });
      setPerfil(p);
      setAccionAlerta(null);
      setMotivo("");
      setExito(`Alerta actualizada a: ${alerta}`);
    } catch {
      setError("Error al cambiar la alerta.");
    } finally { setProcesando(false); }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (!perfil) return (
    <Layout>
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-muted-foreground">{error || "Consumidor no encontrado."}</p>
      </div>
    </Layout>
  );

  const textareaCls = "w-full px-4 py-2.5 rounded-xl border border-border text-sm bg-input focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-card outline-none resize-none";

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/anh/consumidores")} className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-card transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {perfil.user.nombres} {perfil.user.apellido_paterno} {perfil.user.apellido_materno}
            </h1>
            <p className="text-muted-foreground text-sm">{perfil.user.email}</p>
          </div>
          <div className="flex gap-2">
            <EstadoSolicitudBadge estado={perfil.estado_identidad} />
            <AlertaBadge alerta={perfil.alerta_repetitividad} />
          </div>
        </div>

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

        {/* DATOS PERSONALES */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Datos personales</h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-2 gap-4">
            <Dato label="Nombres"          value={perfil.user.nombres} />
            <Dato label="Primer apellido"  value={perfil.user.apellido_paterno} />
            <Dato label="Segundo apellido" value={perfil.user.apellido_materno} />
            <Dato label="Email"            value={perfil.user.email} />
            <Dato label="Celular"          value={perfil.celular || "—"} />
            <Dato label="Fecha nacimiento" value={formatFecha(perfil.fecha_nacimiento)} />
            <Dato label="Registro"         value={formatFecha(perfil.fecha_creacion, true)} />
          </div>
        </div>

        {/* UBICACIÓN */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Ubicación</h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-2 gap-4">
            <Dato label="Departamento" value={perfil.departamento_nombre} />
            <Dato label="Provincia"    value={perfil.provincia_nombre} />
            <Dato label="Municipio"    value={perfil.municipio_nombre} />
            <Dato label="Dirección"    value={perfil.direccion} />
          </div>
        </div>

        {/* ACTIVIDAD */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Actividad económica</h2>
          </div>
          <div className="px-6 py-4">
            <Dato label="Actividad" value={ACTIVIDADES[perfil.actividad] ?? perfil.actividad} />
          </div>
        </div>

        {/* VERIFICACIÓN DE IDENTIDAD */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Verificación de identidad</h2>
            </div>
            <EstadoSolicitudBadge estado={perfil.estado_identidad} />
          </div>
          <div className="px-6 py-4">
            {!accionIdentidad ? (
              <div className="flex gap-2 flex-wrap">
                {perfil.estado_identidad !== "VERIFICADO" && (
                  <button onClick={() => { setAccionIdentidad("VERIFICADO"); setMotivo(""); }}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Verificar
                  </button>
                )}
                {perfil.estado_identidad !== "EN_REVISION" && (
                  <button onClick={() => { setAccionIdentidad("EN_REVISION"); setMotivo(""); }}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-xl text-xs font-medium hover:bg-amber-600 transition-colors">
                    <ShieldAlert className="w-3.5 h-3.5" /> En revisión
                  </button>
                )}
                {perfil.estado_identidad !== "RECHAZADO" && (
                  <button onClick={() => { setAccionIdentidad("RECHAZADO"); setMotivo(""); }}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700 transition-colors">
                    <ShieldOff className="w-3.5 h-3.5" /> Rechazar
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Cambiar a: <span className="text-primary">{accionIdentidad}</span>
                </p>
                <textarea
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  rows={2}
                  placeholder={accionIdentidad === "RECHAZADO" ? "Motivo del rechazo (obligatorio)..." : "Observación (opcional)..."}
                  className={textareaCls}
                />
                <div className="flex gap-2">
                  <button onClick={() => setAccionIdentidad(null)} className="px-3 py-2 border border-border text-muted-foreground rounded-xl text-xs hover:bg-background transition-colors">
                    Cancelar
                  </button>
                  <button onClick={() => cambiarIdentidad(accionIdentidad)} disabled={procesando}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary-hover disabled:bg-slate-300 transition-colors">
                    {procesando ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ALERTA DE REPETITIVIDAD */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Alerta de repetitividad</h2>
            </div>
            <AlertaBadge alerta={perfil.alerta_repetitividad} />
          </div>
          <div className="px-6 py-4">
            {perfil.motivo_bloqueo && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-3">
                {perfil.motivo_bloqueo}
              </p>
            )}
            {perfil.fecha_alerta && (
              <p className="text-xs text-muted-foreground mb-3">
                Alerta desde: {formatFecha(perfil.fecha_alerta, true)}
              </p>
            )}
            {!accionAlerta ? (
              <div className="flex gap-2 flex-wrap">
                {perfil.alerta_repetitividad !== "NORMAL" && (
                  <button onClick={() => { setAccionAlerta("NORMAL"); setMotivo(""); }}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Resolver alerta
                  </button>
                )}
                {perfil.alerta_repetitividad !== "EN_REVISION" && (
                  <button onClick={() => { setAccionAlerta("EN_REVISION"); setMotivo(""); }}
                    className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-xl text-xs font-medium hover:bg-amber-600 transition-colors">
                    <ShieldAlert className="w-3.5 h-3.5" /> Poner en revisión
                  </button>
                )}
                {perfil.alerta_repetitividad !== "BLOQUEADO" && (
                  <button onClick={() => { setAccionAlerta("BLOQUEADO"); setMotivo(""); }}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700 transition-colors">
                    <ShieldOff className="w-3.5 h-3.5" /> Bloquear
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Cambiar alerta a: <span className="text-primary">{accionAlerta}</span>
                </p>
                <textarea
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  rows={2}
                  placeholder={accionAlerta === "BLOQUEADO" ? "Motivo del bloqueo (obligatorio)..." : "Observación (opcional)..."}
                  className={textareaCls}
                />
                <div className="flex gap-2">
                  <button onClick={() => setAccionAlerta(null)} className="px-3 py-2 border border-border text-muted-foreground rounded-xl text-xs hover:bg-background transition-colors">
                    Cancelar
                  </button>
                  <button onClick={() => cambiarAlerta(accionAlerta)} disabled={procesando}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary-hover disabled:bg-slate-300 transition-colors">
                    {procesando ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DOCUMENTOS */}
        {perfil.documentos.length > 0 && (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <FileImage className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Documentos de identidad</h2>
            </div>
            {perfil.documentos.map(doc => (
              <div key={doc.id} className="px-6 py-4 border-b border-border last:border-0">
                <p className="text-sm font-semibold text-foreground mb-1">{doc.tipo_documento_display}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  N°: {doc.numero_documento} {doc.complemento_documento}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Anverso", url: doc.anverso },
                    { label: "Reverso", url: doc.reverso },
                    { label: "Sosteniendo", url: doc.foto_sosteniendo },
                  ].map(({ label, url }) => url ? (
                    <a key={label} href={url} target="_blank" rel="noreferrer"
                      className="block rounded-xl overflow-hidden border border-border hover:border-primary transition-colors">
                      <img src={url} alt={label} className="w-full h-24 object-cover" />
                      <p className="text-xs text-center text-muted-foreground py-1">{label}</p>
                    </a>
                  ) : null)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}