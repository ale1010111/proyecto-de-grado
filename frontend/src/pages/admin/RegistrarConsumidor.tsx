// src/pages/admin/RegistrarConsumidor.tsx
// Wizard completo para que ADMIN/ANH registren consumidores
// La cuenta se crea activa con correo de verificación

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "../../components/Layout";
import { api } from "../../context/AuthContext";
import { catalogosService } from "../../services/catalogos.service";
import type { Departamento, Provincia, Municipio } from "../../types/consumidor.types";
import { ACTIVIDADES, TIPOS_DOCUMENTO } from "../../utils/constants";
import {
  ChevronRight, ChevronLeft, CheckCircle, AlertCircle,
  Upload, Eye, EyeOff, ArrowLeft, UserPlus
} from "lucide-react";

// ------------------------------------------------
// SCHEMAS
// ------------------------------------------------

const paso1Schema = z.object({
  tipo_documento:        z.string().min(1, "Selecciona el tipo de documento"),
  numero_documento:      z.string()
    .min(7, "Mínimo 7 dígitos").max(9, "Máximo 9 dígitos")
    .regex(/^[0-9]+$/, "Solo dígitos"),
  complemento_documento: z.string().max(10).regex(/^[a-zA-Z0-9\-]*$/, "Solo letras, números y guión").optional(),
  nombres:               z.string().min(2, "Ingresa los nombres").regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ ]+$/, "Solo letras"),
  apellido_paterno:      z.string().min(2, "Ingresa el primer apellido").regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ ]+$/, "Solo letras"),
  apellido_materno:      z.string().regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ ]*$/, "Solo letras").optional(),
  fecha_nacimiento:      z.string().min(1, "Ingresa la fecha de nacimiento"),
});

const paso2Schema = z.object({
  email:        z.string().email("Email inválido"),
  celular:      z.string().min(7, "Ingresa el celular"),
  departamento: z.string().min(1, "Selecciona un departamento"),
  provincia:    z.string().min(1, "Selecciona una provincia"),
  municipio:    z.string().min(1, "Selecciona un municipio"),
  actividad:    z.string().min(1, "Selecciona una actividad"),
  direccion:    z.string().min(5, "Ingresa la dirección").max(100),
});

const paso3Schema = z.object({
  password:  z.string().min(8, "Mínimo 8 caracteres"),
  password2: z.string().min(1, "Repite la contraseña"),
}).refine(d => d.password === d.password2, {
  message: "Las contraseñas no coinciden",
  path: ["password2"],
});

type Paso1Data = z.infer<typeof paso1Schema>;
type Paso2Data = z.infer<typeof paso2Schema>;
type Paso3Data = z.infer<typeof paso3Schema>;

// ------------------------------------------------
// PASO INDICADOR
// ------------------------------------------------
function PasoIndicador({ actual }: { actual: number }) {
  const pasos = ["Identidad", "Datos", "Contraseña", "Documentos"];
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {pasos.map((label, i) => {
        const num      = i + 1;
        const activo   = num === actual;
        const completo = num < actual;
        return (
          <div key={num} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                completo ? "bg-green-500 text-white" :
                activo   ? "bg-[#1a3a5c] text-white" :
                           "bg-slate-200 text-slate-400"
              }`}>
                {completo ? <CheckCircle className="w-4 h-4" /> : num}
              </div>
              <span className={`text-xs hidden sm:block ${activo ? "text-[#1a3a5c] font-medium" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
            {i < pasos.length - 1 && (
              <div className={`w-8 sm:w-12 h-0.5 mb-4 ${num < actual ? "bg-green-500" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------
// COMPONENTE PRINCIPAL
// ------------------------------------------------
export default function RegistrarConsumidor() {
  const navigate = useNavigate();
  const [paso,    setPaso]    = useState(1);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [exito,   setExito]   = useState("");

  // Catálogos
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [provincias,    setProvincias]    = useState<Provincia[]>([]);
  const [municipios,    setMunicipios]    = useState<Municipio[]>([]);

  // Archivos
  const [anverso,         setAnverso]         = useState<File | null>(null);
  const [reverso,         setReverso]         = useState<File | null>(null);
  const [fotoSosteniendo, setFotoSosteniendo] = useState<File | null>(null);

  // Datos acumulados
  const [datosPaso1, setDatosPaso1] = useState<Paso1Data | null>(null);
  const [datosPaso2, setDatosPaso2] = useState<Paso2Data | null>(null);

  const [showPass,  setShowPass]  = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  useEffect(() => {
    catalogosService.getDepartamentos().then(setDepartamentos);
  }, []);

  const form1 = useForm<Paso1Data>({ resolver: zodResolver(paso1Schema) });
  const form2 = useForm<Paso2Data>({ resolver: zodResolver(paso2Schema) });
  const form3 = useForm<Paso3Data>({ resolver: zodResolver(paso3Schema) });

  const onChangeDepartamento = async (id: string) => {
    form2.setValue("provincia", "");
    form2.setValue("municipio", "");
    setMunicipios([]);
    if (id) setProvincias(await catalogosService.getProvincias(Number(id)));
  };

  const onChangeProvincia = async (id: string) => {
    form2.setValue("municipio", "");
    if (id) setMunicipios(await catalogosService.getMunicipios(Number(id)));
  };

  const submitPaso1 = form1.handleSubmit(data => { setDatosPaso1(data); setPaso(2); setError(""); });
  const submitPaso2 = form2.handleSubmit(data => { setDatosPaso2(data); setPaso(3); setError(""); });
  const submitPaso3 = form3.handleSubmit(() => { setPaso(4); setError(""); });

  const submitFinal = async () => {
    if (!anverso || !reverso || !fotoSosteniendo) {
      setError("Debes subir las 3 fotografías del documento.");
      return;
    }
    if (!datosPaso1 || !datosPaso2) return;

    const pass3 = form3.getValues();
    setLoading(true); setError("");

    try {
      const formData = new FormData();
      formData.append("tipo_documento",        datosPaso1.tipo_documento);
      formData.append("numero_documento",       datosPaso1.numero_documento);
      formData.append("complemento_documento",  datosPaso1.complemento_documento ?? "");
      formData.append("nombres",                datosPaso1.nombres);
      formData.append("apellido_paterno",       datosPaso1.apellido_paterno);
      formData.append("apellido_materno",       datosPaso1.apellido_materno ?? "");
      formData.append("fecha_nacimiento",       datosPaso1.fecha_nacimiento);
      formData.append("email",       datosPaso2.email);
      formData.append("celular",     datosPaso2.celular);
      formData.append("departamento", datosPaso2.departamento);
      formData.append("provincia",   datosPaso2.provincia);
      formData.append("municipio",   datosPaso2.municipio);
      formData.append("actividad",   datosPaso2.actividad);
      formData.append("direccion",   datosPaso2.direccion);
      formData.append("password",    pass3.password);
      formData.append("password2",   pass3.password2);
      formData.append("anverso",          anverso);
      formData.append("reverso",          reverso);
      formData.append("foto_sosteniendo", fotoSosteniendo);

      // Usar el mismo endpoint público de registro
      await api.post("/api/users/registro/consumidor/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setExito(
        `Consumidor registrado exitosamente. Se envió un PIN de verificación a ${datosPaso2.email}`
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> | { detail?: string } } };
      const data = e.response?.data;
      if (data && "detail" in data) {
        setError((data as { detail?: string }).detail ?? "Error al registrar.");
      } else if (data) {
        const msgs = Object.entries(data as Record<string, unknown>)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : String(v)}`)
          .join(" | ");
        setError(msgs);
      } else {
        setError("Error al registrar el consumidor.");
      }
    } finally { setLoading(false); }
  };

  const inputCls = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm transition-colors outline-none ${
      hasError
        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-slate-200 bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white"
    }`;

  const selectCls = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm outline-none bg-slate-50 ${
      hasError ? "border-red-300" : "border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
    }`;

  const FileInput = ({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File) => void }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label} *</label>
      <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
        file ? "border-green-400 bg-green-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
      }`}>
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={e => e.target.files?.[0] && onChange(e.target.files[0])} />
        {file
          ? <><CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" /><p className="text-xs text-green-600 truncate max-w-[160px]">{file.name}</p></>
          : <><Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" /><p className="text-xs text-slate-500">JPG, PNG o WebP</p></>
        }
      </label>
    </div>
  );

  // ÉXITO
  if (exito) return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">¡Consumidor registrado!</h2>
          <p className="text-slate-500 text-sm mb-6">{exito}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate("/anh/consumidores")}
              className="px-5 py-2.5 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] transition-colors">
              Ver consumidores
            </button>
            <button onClick={() => { setPaso(1); setExito(""); setDatosPaso1(null); setDatosPaso2(null); form1.reset(); form2.reset(); form3.reset(); setAnverso(null); setReverso(null); setFotoSosteniendo(null); }}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
              Registrar otro
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/anh/consumidores")}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a3a5c] rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Registrar consumidor</h1>
              <p className="text-slate-500 text-sm">El consumidor recibirá un PIN de verificación por correo</p>
            </div>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6">
            <PasoIndicador actual={paso} />

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            )}

            {/* PASO 1 */}
            {paso === 1 && (
              <form onSubmit={submitPaso1} className="space-y-4">
                <h3 className="font-semibold text-slate-700 text-sm mb-3">Datos de identidad</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de documento *</label>
                    <select {...form1.register("tipo_documento")} className={selectCls(!!form1.formState.errors.tipo_documento)}>
                      <option value="">Seleccionar...</option>
                      {TIPOS_DOCUMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    {form1.formState.errors.tipo_documento && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.tipo_documento.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">N° Documento *</label>
                    <input {...form1.register("numero_documento")} placeholder="Ej: 12345678" inputMode="numeric" maxLength={9}
                      onInput={e => { (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, ""); }}
                      className={inputCls(!!form1.formState.errors.numero_documento)} />
                    {form1.formState.errors.numero_documento && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.numero_documento.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Complemento</label>
                    <input {...form1.register("complemento_documento")} placeholder="Ej: 1A" className={inputCls(false)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nombres *</label>
                    <input {...form1.register("nombres", { onChange: e => { e.target.value = e.target.value.toLowerCase().replace(/[^a-záéíóúüñ ]/g, ""); } })}
                      placeholder="Nombres" className={inputCls(!!form1.formState.errors.nombres)} />
                    {form1.formState.errors.nombres && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.nombres.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Primer apellido *</label>
                    <input {...form1.register("apellido_paterno", { onChange: e => { e.target.value = e.target.value.toLowerCase().replace(/[^a-záéíóúüñ ]/g, ""); } })}
                      placeholder="Apellido paterno" className={inputCls(!!form1.formState.errors.apellido_paterno)} />
                    {form1.formState.errors.apellido_paterno && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.apellido_paterno.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Segundo apellido</label>
                    <input {...form1.register("apellido_materno", { onChange: e => { e.target.value = e.target.value.toLowerCase().replace(/[^a-záéíóúüñ ]/g, ""); } })}
                      placeholder="Apellido materno" className={inputCls(false)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de nacimiento *</label>
                    <input type="date" {...form1.register("fecha_nacimiento")} className={inputCls(!!form1.formState.errors.fecha_nacimiento)} />
                    {form1.formState.errors.fecha_nacimiento && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.fecha_nacimiento.message}</p>}
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] transition-colors">
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* PASO 2 */}
            {paso === 2 && (
              <form onSubmit={submitPaso2} className="space-y-4">
                <h3 className="font-semibold text-slate-700 text-sm mb-3">Datos generales</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Correo electrónico *</label>
                    <input type="email" {...form2.register("email", { onChange: e => { e.target.value = e.target.value.toLowerCase(); } })}
                      placeholder="ejemplo@correo.com" className={inputCls(!!form2.formState.errors.email)} />
                    {form2.formState.errors.email && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.email.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Celular *</label>
                    <input {...form2.register("celular")} placeholder="Ej: 70000000" className={inputCls(!!form2.formState.errors.celular)} />
                    {form2.formState.errors.celular && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.celular.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Departamento *</label>
                    <select {...form2.register("departamento")} onChange={e => { form2.setValue("departamento", e.target.value); onChangeDepartamento(e.target.value); }}
                      className={selectCls(!!form2.formState.errors.departamento)}>
                      <option value="">Seleccionar...</option>
                      {departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                    </select>
                    {form2.formState.errors.departamento && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.departamento.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Provincia *</label>
                    <select {...form2.register("provincia")} onChange={e => { form2.setValue("provincia", e.target.value); onChangeProvincia(e.target.value); }}
                      className={selectCls(!!form2.formState.errors.provincia)} disabled={provincias.length === 0}>
                      <option value="">Seleccionar...</option>
                      {provincias.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    {form2.formState.errors.provincia && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.provincia.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Municipio *</label>
                    <select {...form2.register("municipio")} className={selectCls(!!form2.formState.errors.municipio)} disabled={municipios.length === 0}>
                      <option value="">Seleccionar...</option>
                      {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                    {form2.formState.errors.municipio && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.municipio.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Actividad económica *</label>
                    <select {...form2.register("actividad")} className={selectCls(!!form2.formState.errors.actividad)}>
                      <option value="">Seleccionar...</option>
                      {Object.entries(ACTIVIDADES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    {form2.formState.errors.actividad && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.actividad.message}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Dirección *</label>
                    <input {...form2.register("direccion")} placeholder="Calle, N°, Barrio..." maxLength={100} className={inputCls(!!form2.formState.errors.direccion)} />
                    {form2.formState.errors.direccion && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.direccion.message}</p>}
                  </div>
                </div>
                <div className="flex justify-between pt-2">
                  <button type="button" onClick={() => setPaso(1)} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] transition-colors">
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* PASO 3 */}
            {paso === 3 && (
              <form onSubmit={submitPaso3} className="space-y-4">
                <h3 className="font-semibold text-slate-700 text-sm mb-3">Contraseña de acceso</h3>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Contraseña *</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} {...form3.register("password")}
                      placeholder="Mínimo 8 caracteres" className={inputCls(!!form3.formState.errors.password) + " pr-11"} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form3.formState.errors.password && <p className="text-red-500 text-xs mt-1">{form3.formState.errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Repetir contraseña *</label>
                  <div className="relative">
                    <input type={showPass2 ? "text" : "password"} {...form3.register("password2")}
                      placeholder="Repite la contraseña" className={inputCls(!!form3.formState.errors.password2) + " pr-11"} />
                    <button type="button" onClick={() => setShowPass2(!showPass2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form3.formState.errors.password2 && <p className="text-red-500 text-xs mt-1">{form3.formState.errors.password2.message}</p>}
                </div>
                <div className="flex justify-between pt-2">
                  <button type="button" onClick={() => setPaso(2)} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] transition-colors">
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* PASO 4 */}
            {paso === 4 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 text-sm mb-1">Fotografías del documento</h3>
                <p className="text-xs text-slate-500 mb-4">Sube fotos claras del documento de identidad del consumidor.</p>
                <div className="grid grid-cols-1 gap-4">
                  <FileInput label="Anverso (frente)" file={anverso} onChange={setAnverso} />
                  <FileInput label="Reverso (dorso)"  file={reverso} onChange={setReverso} />
                  <FileInput label="Foto sosteniendo el documento" file={fotoSosteniendo} onChange={setFotoSosteniendo} />
                </div>
                <div className="flex justify-between pt-2">
                  <button type="button" onClick={() => setPaso(3)} className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <button onClick={submitFinal} disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors">
                    {loading
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <CheckCircle className="w-4 h-4" />
                    }
                    {loading ? "Registrando..." : "Crear cuenta"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}