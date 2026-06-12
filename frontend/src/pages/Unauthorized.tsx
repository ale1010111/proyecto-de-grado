// src/pages/Unauthorized.tsx

import { useNavigate } from "react-router-dom";
import { ShieldX, ArrowLeft } from "lucide-react";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Acceso denegado</h1>
        <p className="text-slate-500 text-sm mb-8">
          No tienes permisos para acceder a esta página.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-[#1a3a5c] text-white rounded-xl text-sm font-medium hover:bg-[#152e4d] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>
    </div>
  );
}