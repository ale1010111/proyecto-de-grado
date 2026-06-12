// src/pages/anh/Estaciones.tsx

import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { estacionesService } from "../../services/estaciones.service";
import { catalogosService } from "../../services/catalogos.service";
import type { EstacionServicio, EstadoEstacion } from "../../types/estacion.types";
import { Building2, Plus, Search, RefreshCw, AlertCircle, CheckCircle, X, Edit2 } from "lucide-react";

const ESTADOS: { value: EstadoEstacion | ""; label: string }[] = [
  { value: "",           label: "Todos" },
  { value: "ACTIVA",     label: "Activa" },
  { value: "INACTIVA",   label: "Inactiva" },
  { value: "SUSPENDIDA", label: "Suspendida" },
];

const estadoColor: Record<string, string> = {
  ACTIVA:     "bg-green-100 text-green-700",
  INACTIVA:   "bg-slate-100 text-slate-500",
  SUSPENDIDA: "bg-red-100 text-red-600",
};

interface Depto  { id: number; nombre: string; }
interface Prov   { id: number; nombre: string; }
interface Muni   { id: number; nombre: string; }

export default function EstacionesANH() {
  const [estaciones,    setEstaciones]    = useState<EstacionServicio[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [exito,         setExito]         = useState("");
  const [busqueda,      setBusqueda]      = useState("");
  const [filtroEstado,  setFiltroEstado]  = useState<EstadoEstacion | "">("");

  // Catálogos
  const [deptos,  setDeptos]  = useState<Depto[]>([]);
  const [provs,   setProvs]   = useState<Prov[]>([]);
  const [munis,   setMunis]   = useState<Muni[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);

  // Modal
  const [modal,     setModal]     = useState(false);
  const [editando,  setEditando]  = useState<EstacionServicio | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    nombre:       "",
    codigo:       "",
    direccion:    "",
    departamento: "",
    deptoId:      0,
    provincia:    "",
    provId:       0,
    municipio:    "",
    muniId:       0,
    estado:       "ACTIVA" as EstadoEstacion,
  });

  const cargar = async () => {
    setLoading(true); setError("");
    try {
      const params: Record<string, string> = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (busqueda)     params.search = busqueda;
      const data = await estacionesService.getAll(params);
      setEstaciones(Array.isArray(data) ? data : (data as any).results ?? []);
    } catch {
      setError("Error al cargar las estaciones.");
    } finally { setLoading(false); }
  };

  // Cargar departamentos al montar
  useEffect(() => {
    catalogosService.getDepartamentos()
      .then(setDeptos)
      .catch(() => {});
  }, []);

  useEffect(() => { cargar(); }, [filtroEstado]);

  // Cargar provincias al cambiar depto
  const onDeptoChange = async (deptoId: number, deptoNombre: string) => {
    setForm(f => ({ ...f, deptoId, departamento: deptoNombre, provId: 0, provincia: "", muniId: 0, municipio: "" }));
    setProvs([]); setMunis([]);
    if (!deptoId) return;
    setLoadingCatalogo(true);
    try {
      const data = await catalogosService.getProvincias(deptoId);
      setProvs(data);
    } finally { setLoadingCatalogo(false); }
  };

  // Cargar municipios al cambiar provincia
  const onProvChange = async (provId: number, provNombre: string) => {
    setForm(f => ({ ...f, provId, provincia: provNombre, muniId: 0, municipio: "" }));
    setMunis([]);
    if (!provId) return;
    setLoadingCatalogo(true);
    try {
      const data = await catalogosService.getMunicipios(provId);
      setMunis(data);
    } finally { setLoadingCatalogo(false); }
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm({ nombre: "", codigo: "", direccion: "", departamento: "", deptoId: 0, provincia: "", provId: 0, municipio: "", muniId: 0, estado: "ACTIVA" });
    setProvs([]); setMunis([]);
    setModal(true);
  };

  const abrirEditar = (e: EstacionServicio) => {
    setEditando(e);
    setForm({
      nombre:       e.nombre,
      codigo:       e.codigo,
      direccion:    e.direccion,
      departamento: e.departamento,
      deptoId:      0,
      provincia:    "",
      provId:       0,
      municipio:    e.municipio,
      muniId:       0,
      estado:       e.estado,
    });
    setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.codigo || !form.direccion || !form.municipio || !form.departamento) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setGuardando(true); setError("");
    try {
      const payload = {
        nombre:       form.nombre,
        codigo:       form.codigo,
        direccion:    form.direccion,
        municipio:    form.municipio,
        departamento: form.departamento,
        estado:       form.estado,
      };
      if (editando) {
        await estacionesService.actualizar(editando.id, payload);
        setExito("Estación actualizada correctamente.");
      } else {
        await estacionesService.crear(payload);
        setExito("Estación creada correctamente.");
      }
      setModal(false);
      await cargar();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      const data = e.response?.data;
      if (data) {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join(" | ");
        setError(msgs);
      } else {
        setError("Error al guardar la estación.");
      }
    } finally { setGuardando(false); }
  };

  const cambiarEstado = async (id: number, estado: EstadoEstacion) => {
    try {
      await estacionesService.cambiarEstado(id, estado);
      setExito(`Estado cambiado a ${estado}.`);
      await cargar();
    } catch {
      setError("Error al cambiar el estado.");
    }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none";

  return (
    <Layout>
      <div className="space-y-5">

        {/* TÍTULO */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a3a5c] rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Estaciones</h1>
              <p className="text-slate-500 text-sm">{estaciones.length} estaciones registradas</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={cargar} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={abrirCrear} className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] transition-colors">
              <Plus className="w-4 h-4" /> Nueva estación
            </button>
          </div>
        </div>

        {/* ALERTAS */}
        {error && !modal && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {exito && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" /> {exito}
          </div>
        )}

        {/* FILTROS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key === "Enter" && cargar()}
              placeholder="Buscar estación..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value as EstadoEstacion | "")}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 outline-none">
            {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : estaciones.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-center py-16">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No se encontraron estaciones</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {estaciones.map(e => (
              <div key={e.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{e.nombre}</p>
                    <p className="text-xs text-slate-400 font-mono">{e.codigo}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoColor[e.estado] ?? "bg-slate-100 text-slate-500"}`}>
                    {e.estado}
                  </span>
                </div>
                <div className="px-5 py-3 space-y-1">
                  <p className="text-xs text-slate-600">{e.departamento} — {e.municipio}</p>
                  <p className="text-xs text-slate-400 truncate">{e.direccion}</p>
                </div>
                <div className="px-5 py-3 border-t border-slate-100 flex gap-2 flex-wrap">
                  <button onClick={() => abrirEditar(e)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                  {e.estado !== "ACTIVA" && (
                    <button onClick={() => cambiarEstado(e.id, "ACTIVA")} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">Activar</button>
                  )}
                  {e.estado !== "INACTIVA" && (
                    <button onClick={() => cambiarEstado(e.id, "INACTIVA")} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors">Desactivar</button>
                  )}
                  {e.estado !== "SUSPENDIDA" && (
                    <button onClick={() => cambiarEstado(e.id, "SUSPENDIDA")} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">Suspender</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="font-semibold text-slate-800">
                {editando ? "Editar estación" : "Nueva estación"}
              </h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className={inputCls} placeholder="Nombre de la estación" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Código *</label>
                <input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} className={inputCls} placeholder="Ej: EST-001" />
              </div>

              {/* DEPARTAMENTO */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Departamento *</label>
                {editando ? (
                  <input value={form.departamento} onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))} className={inputCls} placeholder="Departamento" />
                ) : (
                  <select
                    value={form.deptoId}
                    onChange={e => {
                      const id = Number(e.target.value);
                      const nombre = deptos.find(d => d.id === id)?.nombre ?? "";
                      onDeptoChange(id, nombre);
                    }}
                    className={inputCls}
                  >
                    <option value={0}>Seleccionar departamento...</option>
                    {deptos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                )}
              </div>

              {/* PROVINCIA */}
              {!editando && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Provincia *</label>
                  <select
                    value={form.provId}
                    onChange={e => {
                      const id = Number(e.target.value);
                      const nombre = provs.find(p => p.id === id)?.nombre ?? "";
                      onProvChange(id, nombre);
                    }}
                    disabled={!form.deptoId || loadingCatalogo}
                    className={inputCls + " disabled:opacity-50"}
                  >
                    <option value={0}>
                      {loadingCatalogo ? "Cargando..." : "Seleccionar provincia..."}
                    </option>
                    {provs.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
              )}

              {/* MUNICIPIO */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Municipio *</label>
                {editando ? (
                  <input value={form.municipio} onChange={e => setForm(f => ({ ...f, municipio: e.target.value }))} className={inputCls} placeholder="Municipio" />
                ) : (
                  <select
                    value={form.muniId}
                    onChange={e => {
                      const id = Number(e.target.value);
                      const nombre = munis.find(m => m.id === id)?.nombre ?? "";
                      setForm(f => ({ ...f, muniId: id, municipio: nombre }));
                    }}
                    disabled={!form.provId || loadingCatalogo}
                    className={inputCls + " disabled:opacity-50"}
                  >
                    <option value={0}>
                      {loadingCatalogo ? "Cargando..." : "Seleccionar municipio..."}
                    </option>
                    {munis.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Dirección *</label>
                <input value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} className={inputCls} placeholder="Dirección completa" />
              </div>

              {editando && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
                  <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoEstacion }))} className={inputCls}>
                    <option value="ACTIVA">Activa</option>
                    <option value="INACTIVA">Inactiva</option>
                    <option value="SUSPENDIDA">Suspendida</option>
                  </select>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setModal(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando} className="flex items-center gap-2 px-5 py-2 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] disabled:bg-slate-300 transition-colors">
                {guardando ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {editando ? "Actualizar" : "Crear estación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}