// src/pages/Login.tsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { Flame, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

const schema = z.object({
  email:    z.string().email("Ingresa un email válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const { login }               = useAuth();
  const navigate                = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError("");
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { detail?: string; non_field_errors?: string[] } }
      };
      const msg =
        axiosErr.response?.data?.detail ||
        axiosErr.response?.data?.non_field_errors?.[0] ||
        "Error al iniciar sesión. Verifica tus credenciales.";
        
        // Si no verificó el email → redirigir a verificación
      if (msg.includes("verificar su correo")) {
        navigate(`/verificar-email?email=${encodeURIComponent(data.email)}`);
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-white text-2xl font-bold tracking-tight">ANH Bolivia</h1>
            <p className="text-blue-300 text-sm mt-1">Sistema de Gestión de Combustible</p>
          </div>

          {/* FORM */}
          <div className="px-8 py-8">
            <h2 className="text-slate-800 text-xl font-semibold mb-6 text-center">
              Iniciar sesión
            </h2>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="ejemplo@correo.com"
                  {...register("email", { onChange: (e) => { e.target.value = e.target.value.toLowerCase(); } })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors outline-none ${
                    errors.email
                      ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-slate-200 bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register("password")}
                    className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm transition-colors outline-none ${
                      errors.password
                        ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-slate-200 bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="text-right">
                <Link
                  to="/recuperar-password"
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#1a3a5c] hover:bg-[#152e4d] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <LogIn className="w-4 h-4" />
                }
                {loading ? "Iniciando sesión..." : "Ingresar"}
              </button>

            </form>

            <p className="text-center text-slate-500 text-sm mt-6">
              ¿No tienes cuenta?{" "}
              <Link
                to="/registro"
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-blue-300/50 text-xs mt-4">
          Sistema ANH Bolivia v1.0 — Estado Plurinacional de Bolivia
        </p>
      </div>
    </div>
  );
}