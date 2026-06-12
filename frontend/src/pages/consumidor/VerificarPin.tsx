// src/pages/consumidor/VerificarPin.tsx

import { useState, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { Flame, CheckCircle, AlertCircle, Mail, RefreshCw } from "lucide-react";

export default function VerificarPin() {
  const navigate                    = useNavigate();
  const [searchParams]              = useSearchParams();
  const email                       = searchParams.get("email") ?? "";
  const [pins, setPins]             = useState(["", "", "", "", "", ""]);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [reenvioOk, setReenvioOk]   = useState(false);
  const [reenviando, setReeviando]  = useState(false);
  const inputsRef                   = useRef<(HTMLInputElement | null)[]>([]);

  // ------------------------------------------------
  // MANEJO DE INPUTS DEL PIN
  // ------------------------------------------------

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const nuevo = [...pins];
    nuevo[i]    = val.slice(-1);
    setPins(nuevo);
    // Avanzar al siguiente campo automáticamente
    if (val && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    // Retroceder al campo anterior con Backspace
    if (e.key === "Backspace" && !pins[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  // Pegar el PIN completo desde el portapapeles
  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setPins(text.split(""));
      inputsRef.current[5]?.focus();
    }
  };

  // ------------------------------------------------
  // VERIFICAR PIN
  // ------------------------------------------------

  const onSubmit = async () => {
    const pin = pins.join("");
    if (pin.length < 6) {
      setError("Ingresa el PIN de 6 dígitos.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.verificarEmail(email, pin);
      navigate("/login?verificado=1");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail ?? "PIN incorrecto o expirado.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------
  // REENVIAR PIN
  // ------------------------------------------------

  const onReenviar = async () => {
    if (!email) {
      setError("No se encontró el email. Vuelve al registro.");
      return;
    }
    setReeviando(true);
    setReenvioOk(false);
    setError("");
    try {
      await authService.reenviarPin(email);
      setReenvioOk(true);
      // Limpiar campos del PIN
      setPins(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      const msg = e.response?.data?.detail;
      if (msg?.includes("verificada")) {
        setError("Esta cuenta ya está verificada. Inicia sesión.");
      } else {
        setError("Error al reenviar el PIN. Intenta nuevamente.");
      }
    } finally {
      setReeviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2744] via-[#1a3a5c] to-[#0f2744] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* HEADER */}
          <div className="bg-[#1a3a5c] px-8 py-8 text-center">
            <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Flame className="w-8 h-8 text-[#1a3a5c]" strokeWidth={2.5} />
            </div>
            <h1 className="text-white text-xl font-bold">Verificar correo</h1>
            <p className="text-blue-300 text-sm mt-1">ANH Bolivia</p>
          </div>

          <div className="px-8 py-8 text-center">

            {/* ÍCONO */}
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-blue-600" />
            </div>

            <h2 className="text-slate-800 font-semibold text-lg mb-2">
              Ingresa tu PIN
            </h2>
            <p className="text-slate-500 text-sm mb-1">
              Enviamos un código de 6 dígitos a:
            </p>
            <p className="text-blue-600 font-medium text-sm mb-6">{email || "tu correo"}</p>

            {/* ERRORES */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm text-left">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* REENVÍO EXITOSO */}
            {reenvioOk && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-5 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Nuevo PIN enviado. Revisa tu correo.</span>
              </div>
            )}

            {/* INPUTS DEL PIN */}
            <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
              {pins.map((p, i) => (
                <input
                  key={i}
                  ref={el => { inputsRef.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={p}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 border-slate-200"
                />
              ))}
            </div>

            {/* BOTÓN VERIFICAR */}
            <button
              onClick={onSubmit}
              disabled={loading || pins.join("").length < 6}
              className="w-full flex items-center justify-center gap-2 bg-[#1a3a5c] hover:bg-[#152e4d] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mb-4"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <CheckCircle className="w-4 h-4" />
              }
              {loading ? "Verificando..." : "Verificar cuenta"}
            </button>

            {/* BOTÓN REENVIAR */}
            <button
              onClick={onReenviar}
              disabled={reenviando}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 rounded-xl transition-colors text-sm mb-4"
            >
              {reenviando
                ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                : <RefreshCw className="w-4 h-4" />
              }
              {reenviando ? "Reenviando..." : "Reenviar PIN"}
            </button>

            <p className="text-center text-slate-500 text-xs">
              <Link to="/login" className="text-blue-600 hover:text-blue-800 transition-colors">
                Volver al login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}