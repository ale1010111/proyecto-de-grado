// src/pages/admin/GestionUsuarios.tsx

import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../context/AuthContext";
import { estacionesService } from "../../services/estaciones.service";
import { authService } from "../../services/auth.service";
import type { EstacionServicio } from "../../types/estacion.types";
import { passwordSeguroSchema, PASSWORD_HELP_TEXT } from "../../utils/passwordSchema";
import { formatFecha } from "../../utils/format";
import {
  Users, Plus, Search, RefreshCw, AlertCircle,
  CheckCircle, Edit2, UserCheck, UserX, X, Shield,
  Eye, KeyRound, ChevronLeft, ChevronRight,
} from "lucide-react";

// ------------------------------------------------
// TIPOS
// ------------------------------------------------

interface Funcionario {
  id:               number;
  email:            string;
  nombres:          string;
  apellido_paterno: string;
  apellido_materno: string;
  nombre_completo:  string;
  tipo_usuario:     string;
  estado_cuenta:    string;
  email_verificado: boolean;
  date_joined:      string;
  perfil: {
    id:                   number | null;
    cargo:                string;
    unidad_departamento:  string;
    numero_funcionario:   string;
    numero_documento:     string;
    tipo_documento:       string;
    celular:              string;
    estacion_servicio_id: number | null;
    estacion_nombre:      string | null;
  } | null;
}

const estadoCuentaColor: Record<string, string> = {
  ACTIVO:     "bg-green-100 text-green-700",
  SUSPENDIDO: "bg-red-100 text-red-600",
  PENDIENTE:  "bg-amber-100 text-amber-700",
};

const tipoLabel: Record<string, string> = {
  ADMIN: "Administrador",
  ANH:   "Operador ANH",
  ESS:   "Estación de Servicio",
};

const tipoColor: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  ANH:   "bg-blue-100 text-blue-700",
  ESS:   "bg-teal-100 text-teal-700",
};

// ------------------------------------------------
// VALIDACIÓN DE CONTRASEÑA
// ------------------------------------------------

function validarPassword(password: string): string | null {
  try {
    passwordSeguroSchema.parse(password);
    return null;
  } catch (e: any) {
    return e.errors?.[0]?.message ?? "Contraseña inválida";
  }
}

// ------------------------------------------------
// COMPONENTE PRINCIPAL
// ------------------------------------------------

export default function GestionUsuarios() {
  const { user } = useAuth();
  const isAdmin  = user?.tipo_usuario === "ADMIN";

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [estaciones,   setEstaciones]   = useState<EstacionServicio[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [exito,        setExito]        = useState("");
  const [busqueda,     setBusqueda]     = useState("");
  const [busquedaInput, setBusquedaInput] = useState("");
  const [filtroTipo,   setFiltroTipo]   = useState<string>(isAdmin ? "" : "ESS");
  const [pagina,       setPagina]       = useState(1);
  const [total,        setTotal]        = useState(0);
  const POR_PAGINA = 20;

  // Modales
  const [modalCrear,   setModalCrear]   = useState(false);
  const [modalEditar,  setModalEditar]  = useState<Funcionario | null>(null);
  const [modalVer,     setModalVer]     = useState<Funcionario | null>(null);
  const [guardando,    setGuardando]    = useState(false);
  const [enviandoReset, setEnviandoReset] = useState<number | null>(null);

  // Errores de contraseña
  const [passError, setPassError] = useState("");

  // Form crear
  const formVacio = {
    email: "", nombres: "", apellido_paterno: "", apellido_materno: "",
    tipo_usuario: isAdmin ? "ANH" : "ESS",
    password: "", password2: "",
    tipo_documento: "CI", numero_documento: "", complemento_documento: "",
    numero_funcionario: "", cargo: "", unidad_departamento: "",
    celular: "", estacion_servicio: 0,
  };
  const [form, setForm] = useState({ ...formVacio });

  // Form editar
  const [formEdit, setFormEdit] = useState({
    nombres: "", apellido_paterno: "", apellido_materno: "",
    cargo: "", unidad_departamento: "", celular: "",
    estacion_servicio_id: 0,
  });

  // ------------------------------------------------
  // CARGAR
  // ------------------------------------------------

  const cargar = async (pag = pagina, tipo = filtroTipo, busq = busqueda) => {
    setLoading(true); setError("");
    try {
      const params: Record<string, string> = { page: String(pag) };
      if (tipo) params.tipo_usuario = tipo;
      if (busq) params.search       = busq;
      const res = await api.get("/api/users/funcionarios/", { params });
      // El endpoint puede devolver array o paginado
      if (Array.isArray(res.data)) {
        setFuncionarios(res.data);
        setTotal(res.data.length);
      } else {
        setFuncionarios(res.data.results ?? res.data);
        setTotal(res.data.count ?? 0);
      }
    } catch {
      setError("Error al cargar los usuarios.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    cargar(1, filtroTipo, busqueda);
    setPagina(1);
  }, [filtroTipo]);

  useEffect(() => {
    estacionesService.getAll({ estado: "ACTIVA" }).then(data =>
      setEstaciones(Array.isArray(data) ? data : (data as any).results ?? [])
    ).catch(() => {});
  }, []);

  const onBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    setBusqueda(busquedaInput);
    setPagina(1);
    cargar(1, filtroTipo, busquedaInput);
  };

  const totalPaginas = total > 0 ? Math.ceil(total / POR_PAGINA) : 1;

  // ------------------------------------------------
  // CREAR FUNCIONARIO
  // ------------------------------------------------

  const onCreate = async () => {
    if (!form.email || !form.nombres || !form.apellido_paterno || !form.password) {
      setError("Completa los campos obligatorios.");
      return;
    }
    const errPass = validarPassword(form.password);
    if (errPass) { setError(errPass); return; }
    if (form.password !== form.password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (form.tipo_usuario === "ESS" && !form.estacion_servicio) {
      setError("Selecciona una estación de servicio.");
      return;
    }
    setGuardando(true); setError("");
    try {
      await api.post("/api/users/funcionarios/crear/", {
        ...form,
        estacion_servicio: form.tipo_usuario === "ESS" ? form.estacion_servicio : null,
      });
      setExito("Funcionario creado correctamente.");
      setModalCrear(false);
      setForm({ ...formVacio });
      await cargar();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> | { detail?: string } } };
      const data = e.response?.data;
      if (data && "detail" in data) {
        setError((data as { detail?: string }).detail ?? "Error al crear.");
      } else if (data) {
        const msgs = Object.entries(data as Record<string, unknown>)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : String(v)}`)
          .join(" | ");
        setError(msgs);
      } else {
        setError("Error al crear el funcionario.");
      }
    } finally { setGuardando(false); }
  };

  // ------------------------------------------------
  // EDITAR FUNCIONARIO
  // ------------------------------------------------

  const abrirEditar = (f: Funcionario) => {
    setModalVer(null);
    setModalEditar(f);
    setFormEdit({
      nombres:              f.nombres,
      apellido_paterno:     f.apellido_paterno,
      apellido_materno:     f.apellido_materno,
      cargo:                f.perfil?.cargo ?? "",
      unidad_departamento:  f.perfil?.unidad_departamento ?? "",
      celular:              f.perfil?.celular ?? "",
      estacion_servicio_id: f.perfil?.estacion_servicio_id ?? 0,
    });
    setError("");
  };

  const onEditar = async () => {
    if (!modalEditar) return;
    setGuardando(true); setError("");
    try {
      await api.put(`/api/users/funcionarios/${modalEditar.id}/`, {
        ...formEdit,
        estacion_servicio_id: modalEditar.tipo_usuario === "ESS"
          ? formEdit.estacion_servicio_id : undefined,
      });
      setExito("Funcionario actualizado correctamente.");
      setModalEditar(null);
      await cargar();
    } catch {
      setError("Error al actualizar el funcionario.");
    } finally { setGuardando(false); }
  };

  // ------------------------------------------------
  // CAMBIAR ESTADO
  // ------------------------------------------------

  const cambiarEstado = async (f: Funcionario, estado: string) => {
    try {
      await api.post(`/api/users/funcionarios/${f.id}/cambiar-estado/`, {
        estado_cuenta: estado,
      });
      setExito(`${f.nombre_completo} — estado cambiado a ${estado}.`);
      await cargar();
    } catch {
      setError("Error al cambiar el estado.");
    }
  };

  // ------------------------------------------------
  // RESTABLECER CONTRASEÑA
  // Reutiliza el flujo de recuperación existente —
  // el sistema envía un email al funcionario con el
  // enlace para que él establezca su nueva contraseña.
  // El admin nunca ve ni ingresa la contraseña nueva.
  // ------------------------------------------------

  const restablecerPassword = async (f: Funcionario) => {
    setEnviandoReset(f.id);
    try {
      await authService.recuperarPassword(f.email);
      setExito(`Email de recuperación enviado a ${f.email}.`);
    } catch {
      setError("Error al enviar el email de recuperación.");
    } finally {
      setEnviandoReset(null);
    }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none";

  const TABS = isAdmin
    ? [
        { value: "",      label: "Todos" },
        { value: "ADMIN", label: "Administradores" },
        { value: "ANH",   label: "Operadores ANH" },
        { value: "ESS",   label: "Estaciones ESS" },
      ]
    : [{ value: "ESS", label: "Operadores ESS" }];

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  return (
    <Layout>
      <div className="space-y-5">

        {/* TÍTULO */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a3a5c] rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
              <p className="text-slate-500 text-sm">{total} usuario(s) registrado(s)</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => cargar()} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => { setModalCrear(true); setError(""); setPassError(""); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] transition-colors">
              <Plus className="w-4 h-4" /> Nuevo usuario
            </button>
          </div>
        </div>

        {/* ALERTAS */}
        {error && !modalCrear && !modalEditar && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {exito && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" /> {exito}
          </div>
        )}

        {/* TABS + BÚSQUEDA */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100 px-4 pt-3 gap-1">
            {TABS.map(t => (
              <button key={t.value} onClick={() => setFiltroTipo(t.value)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  filtroTipo === t.value
                    ? "bg-[#1a3a5c] text-white"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-4">
            <form onSubmit={onBuscar} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={busquedaInput}
                  onChange={e => setBusquedaInput(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <button type="submit" className="px-4 py-2.5 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] transition-colors">
                Buscar
              </button>
              {busqueda && (
                <button type="button" onClick={() => { setBusquedaInput(""); setBusqueda(""); cargar(1, filtroTipo, ""); }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  Limpiar
                </button>
              )}
            </form>
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : funcionarios.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Nombre", "Email", "Rol", "Cargo / Estación", "Estado", "Registro", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {funcionarios.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#1a3a5c] rounded-full flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">
                              {f.nombres.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">{f.nombre_completo}</p>
                            {!f.email_verificado && (
                              <span className="text-xs text-amber-600">Email no verificado</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{f.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tipoColor[f.tipo_usuario] ?? "bg-slate-100 text-slate-500"}`}>
                          {tipoLabel[f.tipo_usuario] ?? f.tipo_usuario}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {f.tipo_usuario === "ESS"
                          ? f.perfil?.estacion_nombre || "—"
                          : f.perfil?.cargo || "—"
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoCuentaColor[f.estado_cuenta] ?? "bg-slate-100 text-slate-500"}`}>
                          {f.estado_cuenta}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatFecha(f.date_joined)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {/* Ver detalle */}
                          <button onClick={() => setModalVer(f)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Ver detalle">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Editar */}
                          <button onClick={() => abrirEditar(f)}
                            className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors" title="Editar">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {/* Restablecer contraseña */}
                          <button
                            onClick={() => restablecerPassword(f)}
                            disabled={enviandoReset === f.id}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors disabled:opacity-50" title="Restablecer contraseña">
                            {enviandoReset === f.id
                              ? <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                              : <KeyRound className="w-3.5 h-3.5" />
                            }
                          </button>
                          {/* Activar / Suspender */}
                          {isAdmin && f.estado_cuenta !== "ACTIVO" && (
                            <button onClick={() => cambiarEstado(f, "ACTIVO")}
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Activar">
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAdmin && f.estado_cuenta === "ACTIVO" && f.id !== user?.id && (
                            <button onClick={() => cambiarEstado(f, "SUSPENDIDO")}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Suspender">
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">Página {pagina} de {totalPaginas} ({total} usuarios)</p>
              <div className="flex gap-2">
                <button onClick={() => { setPagina(p => Math.max(1, p - 1)); cargar(Math.max(1, pagina - 1)); }}
                  disabled={pagina === 1 || loading}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                </button>
                <button onClick={() => { setPagina(p => Math.min(totalPaginas, p + 1)); cargar(Math.min(totalPaginas, pagina + 1)); }}
                  disabled={pagina >= totalPaginas || loading}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Siguiente <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---- MODAL VER DETALLE ---- */}
      {modalVer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalVer(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" /> Detalle del usuario
              </h3>
              <button onClick={() => setModalVer(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Avatar + nombre */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#1a3a5c] rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-xl font-bold">{modalVer.nombres.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-800">{modalVer.nombre_completo}</p>
                  <p className="text-sm text-slate-500">{modalVer.email}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipoColor[modalVer.tipo_usuario] ?? "bg-slate-100 text-slate-500"}`}>
                      {tipoLabel[modalVer.tipo_usuario] ?? modalVer.tipo_usuario}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoCuentaColor[modalVer.estado_cuenta] ?? "bg-slate-100 text-slate-500"}`}>
                      {modalVer.estado_cuenta}
                    </span>
                  </div>
                </div>
              </div>

              {/* Datos institucionales */}
              {modalVer.perfil && (
                <div className="border border-slate-100 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Datos institucionales</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400">N° Funcionario</p>
                      <p className="font-medium text-slate-700">{modalVer.perfil.numero_funcionario || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Documento</p>
                      <p className="font-medium text-slate-700">{modalVer.perfil.tipo_documento} {modalVer.perfil.numero_documento}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Cargo</p>
                      <p className="font-medium text-slate-700">{modalVer.perfil.cargo || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Unidad</p>
                      <p className="font-medium text-slate-700">{modalVer.perfil.unidad_departamento || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Celular</p>
                      <p className="font-medium text-slate-700">{modalVer.perfil.celular || "—"}</p>
                    </div>
                    {modalVer.tipo_usuario === "ESS" && (
                      <div>
                        <p className="text-xs text-slate-400">Estación</p>
                        <p className="font-medium text-slate-700">{modalVer.perfil.estacion_nombre || "—"}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-400">Registro</p>
                      <p className="font-medium text-slate-700">{formatFecha(modalVer.date_joined)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Email verificado</p>
                      <p className={`font-medium ${modalVer.email_verificado ? "text-green-600" : "text-amber-600"}`}>
                        {modalVer.email_verificado ? "Sí" : "No"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setModalVer(null); restablecerPassword(modalVer); }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors">
                <KeyRound className="w-4 h-4" /> Restablecer contraseña
              </button>
              <button onClick={() => abrirEditar(modalVer)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] transition-colors">
                <Edit2 className="w-4 h-4" /> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- MODAL CREAR ---- */}
      {modalCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalCrear(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" /> Nuevo usuario
              </h3>
              <button onClick={() => setModalCrear(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
                </div>
              )}

              {isAdmin && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Rol *</label>
                  <select value={form.tipo_usuario} onChange={e => setForm(f => ({ ...f, tipo_usuario: e.target.value }))} className={inputCls}>
                    <option value="ANH">Operador ANH</option>
                    <option value="ESS">Estación de Servicio (ESS)</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombres *</label>
                  <input value={form.nombres} onChange={e => setForm(f => ({ ...f, nombres: e.target.value.toLowerCase() }))} className={inputCls} placeholder="Nombres" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Primer apellido *</label>
                  <input value={form.apellido_paterno} onChange={e => setForm(f => ({ ...f, apellido_paterno: e.target.value.toLowerCase() }))} className={inputCls} placeholder="Apellido paterno" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Segundo apellido</label>
                  <input value={form.apellido_materno} onChange={e => setForm(f => ({ ...f, apellido_materno: e.target.value.toLowerCase() }))} className={inputCls} placeholder="Apellido materno" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value.toLowerCase() }))} className={inputCls} placeholder="correo@ejemplo.com" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Contraseña *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(f => ({ ...f, password: val }));
                      setPassError(validarPassword(val) ?? "");
                    }}
                    className={inputCls}
                    placeholder="Mínimo 8 caracteres"
                  />
                  {passError
                    ? <p className="text-red-500 text-xs mt-1">{passError}</p>
                    : <p className="text-slate-400 text-xs mt-1">{PASSWORD_HELP_TEXT}</p>
                  }
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Confirmar contraseña *</label>
                  <input type="password" value={form.password2} onChange={e => setForm(f => ({ ...f, password2: e.target.value }))} className={inputCls} placeholder="Repetir contraseña" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Datos institucionales</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tipo documento *</label>
                    <select value={form.tipo_documento} onChange={e => setForm(f => ({ ...f, tipo_documento: e.target.value }))} className={inputCls}>
                      <option value="CI">Cédula de Identidad</option>
                      <option value="CIE">Carnet de Extranjero</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">N° Documento *</label>
                    <input value={form.numero_documento} onChange={e => setForm(f => ({ ...f, numero_documento: e.target.value }))} className={inputCls} placeholder="Ej: 12345678" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">N° Funcionario *</label>
                    <input value={form.numero_funcionario} onChange={e => setForm(f => ({ ...f, numero_funcionario: e.target.value }))} className={inputCls} placeholder="Ej: FUNC-001" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cargo *</label>
                    <input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} className={inputCls} placeholder="Cargo institucional" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Unidad / Departamento *</label>
                    <input value={form.unidad_departamento} onChange={e => setForm(f => ({ ...f, unidad_departamento: e.target.value }))} className={inputCls} placeholder="Unidad o departamento" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Celular</label>
                    <input value={form.celular} onChange={e => setForm(f => ({ ...f, celular: e.target.value }))} className={inputCls} placeholder="Ej: 70000000" />
                  </div>
                  {form.tipo_usuario === "ESS" && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Estación de servicio *</label>
                      <select value={form.estacion_servicio} onChange={e => setForm(f => ({ ...f, estacion_servicio: Number(e.target.value) }))} className={inputCls}>
                        <option value={0}>Seleccionar estación...</option>
                        {estaciones.map(e => (
                          <option key={e.id} value={e.id}>
                            {e.nombre} — {e.municipio_nombre ?? e.municipio}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setModalCrear(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={onCreate} disabled={guardando} className="flex items-center gap-2 px-5 py-2 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] disabled:bg-slate-300 transition-colors">
                {guardando ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Crear usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- MODAL EDITAR ---- */}
      {modalEditar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalEditar(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" /> Editar — {modalEditar.nombre_completo}
              </h3>
              <button onClick={() => setModalEditar(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombres</label>
                  <input value={formEdit.nombres} onChange={e => setFormEdit(f => ({ ...f, nombres: e.target.value.toLowerCase() }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Primer apellido</label>
                  <input value={formEdit.apellido_paterno} onChange={e => setFormEdit(f => ({ ...f, apellido_paterno: e.target.value.toLowerCase() }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Segundo apellido</label>
                  <input value={formEdit.apellido_materno} onChange={e => setFormEdit(f => ({ ...f, apellido_materno: e.target.value.toLowerCase() }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Celular</label>
                  <input value={formEdit.celular} onChange={e => setFormEdit(f => ({ ...f, celular: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cargo</label>
                  <input value={formEdit.cargo} onChange={e => setFormEdit(f => ({ ...f, cargo: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unidad / Departamento</label>
                  <input value={formEdit.unidad_departamento} onChange={e => setFormEdit(f => ({ ...f, unidad_departamento: e.target.value }))} className={inputCls} />
                </div>
                {modalEditar.tipo_usuario === "ESS" && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Estación de servicio</label>
                    <select value={formEdit.estacion_servicio_id} onChange={e => setFormEdit(f => ({ ...f, estacion_servicio_id: Number(e.target.value) }))} className={inputCls}>
                      <option value={0}>Sin estación</option>
                      {estaciones.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.nombre} — {e.municipio_nombre ?? e.municipio}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-between gap-3 sticky bottom-0 bg-white">
              {/* Restablecer contraseña también desde editar */}
              <button
                onClick={() => { setModalEditar(null); restablecerPassword(modalEditar); }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors">
                <KeyRound className="w-4 h-4" /> Restablecer contraseña
              </button>
              <div className="flex gap-3">
                <button onClick={() => setModalEditar(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button onClick={onEditar} disabled={guardando} className="flex items-center gap-2 px-5 py-2 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] disabled:bg-slate-300 transition-colors">
                  {guardando ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}