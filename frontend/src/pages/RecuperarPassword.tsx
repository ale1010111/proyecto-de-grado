// src/pages/RecuperarPassword.tsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "../services/auth.service";
import { Flame, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Ingresa un email válido"),
});

type FormData = z.infer<typeof schema>;

export default function RecuperarPassword() {
  const [enviado,  setEnviado]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    try {
      await authService.recuperarPassword(data.email);
      setEnviado(true);
    } catch {
      setError("Error al procesar la solicitud. Intenta nuevamente.");
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
            <h1 className="text-white text-2xl font-bold">ANH Bolivia</h1>
            <p className="text-blue-300 text-sm mt-1">Recuperar contraseña</p>
          </div>

          <div className="px-8 py-8">

            {/* ÉXITO */}
            {enviado ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-slate-800 text-xl font-semibold">
                  Revisa tu correo
                </h2>
                <p className="text-slate-500 text-sm">
                  Si el correo está registrado, recibirás un enlace
                  para restablecer tu contraseña en los próximos minutos.
                </p>
                <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-blue-600">
                  Revisa también tu carpeta de spam o correo no deseado.
                </div>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] transition-colors mt-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al login
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-slate-800 text-xl font-semibold mb-2 text-center">
                  ¿Olvidaste tu contraseña?
                </h2>
                <p className="text-slate-500 text-sm text-center mb-6">
                  Ingresa tu correo y te enviaremos un enlace para restablecerla.
                </p>

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
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="ejemplo@correo.com"
                        {...register("email", { onChange: (e) => { e.target.value = e.target.value.toLowerCase(); } })}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors outline-none ${
                          errors.email
                            ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            : "border-slate-200 bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white"
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#1a3a5c] hover:bg-[#152e4d] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    {loading
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Mail className="w-4 h-4" />
                    }
                    {loading ? "Enviando..." : "Enviar enlace"}
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