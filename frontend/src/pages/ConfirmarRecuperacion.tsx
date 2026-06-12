// src/pages/ConfirmarRecuperacion.tsx

import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "../services/auth.service";
import { Flame, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

const schema = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres"),
  password2: z.string().min(1, "Repite la contraseña"),
}).refine(d => d.password === d.password2, {
  message: "Las contraseñas no coinciden",
  path: ["password2"],
});

type FormData = z.infer<typeof schema>;

export default function ConfirmarRecuperacion() {
  const navigate                    = useNavigate();
  const [searchParams]              = useSearchParams();
  const token                       = searchParams.get("token") ?? "";

  const [showPass,  setShowPass]    = useState(false);
  const [showPass2, setShowPass2]   = useState(false);
  const [loading,   setLoading]     = useState(false);
  const [error,     setError]       = useState("");
  const [exito,     setExito]       = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setError("Token inválido. Solicita un nuevo enlace de recuperación.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authService.confirmarRecuperacion(token, data.password, data.password2);
      setExito(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; non_field_errors?: string[] } } };
      const msg =
        e.response?.data?.detail ||
        e.response?.data?.non_field_errors?.[0] ||
        "Error al cambiar la contraseña. El enlace puede haber expirado.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm transition-colors outline-none ${
      hasError
        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-slate-200 bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white"
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2744] via-[#1a3a5c] to-[#0f2744] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* HEADER */}
          <div className="bg-[#1a3a5c] px-8 py-8 text-center">
            <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Flame className="w-8 h-8 text-[#1a3a5c]" strokeWidth={2.5} />
            </div>
            <h1 className="text-white text-2xl font-bold">ANH Bolivia</h1>
            <p className="text-blue-300 text-sm mt-1">Nueva contraseña</p>
          </div>

          <div className="px-8 py-8">

            {/* ÉXITO */}
            {exito ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-slate-800 text-xl font-semibold">
                  ¡Contraseña actualizada!
                </h2>
                <p className="text-slate-500 text-sm">
                  Tu contraseña fue cambiada exitosamente.
                  Serás redirigido al login en unos segundos...
                </p>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] transition-colors"
                >
                  Ir al login
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-slate-800 text-xl font-semibold mb-2 text-center">
                  Crea tu nueva contraseña
                </h2>
                <p className="text-slate-500 text-sm text-center mb-6">
                  Ingresa y confirma tu nueva contraseña.
                </p>

                {!token && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Enlace inválido. Solicita un nuevo enlace de recuperación.
                    </span>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        {...register("password")}
                        className={inputCls(!!errors.password) + " pr-11"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPass2 ? "text" : "password"}
                        placeholder="Repite la contraseña"
                        {...register("password2")}
                        className={inputCls(!!errors.password2) + " pr-11"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass2(!showPass2)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPass2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password2 && (
                      <p className="text-red-500 text-xs mt-1">{errors.password2.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full flex items-center justify-center gap-2 bg-[#1a3a5c] hover:bg-[#152e4d] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    {loading
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <CheckCircle className="w-4 h-4" />
                    }
                    {loading ? "Guardando..." : "Cambiar contraseña"}
                  </button>
                </form>

                <p className="text-center text-slate-500 text-sm mt-6">
                  <Link to="/login" className="flex items-center justify-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Volver al login
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}