// src/components/Navbar.tsx

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Flame,
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  UserCog,
} from "lucide-react";

// ------------------------------------------------
// NAVEGACIÓN POR ROL
// ------------------------------------------------

const navItems: Record<string, { label: string; path: string; icon: any }[]> = {
  CONS: [
    { label: "Mi Solicitud",  path: "/consumidor/solicitud", icon: FileText },
    { label: "Mi Perfil",     path: "/consumidor/perfil",    icon: User },
  ],
  ESS: [
    { label: "Solicitudes",   path: "/estacion/solicitudes", icon: FileText },
  ],
  ANH: [
    { label: "Dashboard",     path: "/anh/dashboard",        icon: LayoutDashboard },
    { label: "Solicitudes",   path: "/anh/solicitudes",      icon: FileText },
    { label: "Consumidores",  path: "/anh/consumidores",     icon: Users },
    { label: "Estaciones",    path: "/anh/estaciones",       icon: Building2 },
    { label: "Reportes",      path: "/anh/reportes",         icon: BarChart3 },
  ],
  ADMIN: [
    { label: "Dashboard",     path: "/anh/dashboard",        icon: LayoutDashboard },
    { label: "Solicitudes",   path: "/anh/solicitudes",      icon: FileText },
    { label: "Consumidores",  path: "/anh/consumidores",     icon: Users },
    { label: "Estaciones",    path: "/anh/estaciones",       icon: Building2 },
    { label: "Reportes",      path: "/anh/reportes",         icon: BarChart3 },
    { label: "Usuarios",      path: "/admin/usuarios",       icon: UserCog },
  ],
};

const rolLabels: Record<string, string> = {
  CONS:  "Consumidor",
  ESS:   "Estación de Servicio",
  ANH:   "Operador ANH",
  ADMIN: "Administrador",
};

// ------------------------------------------------
// NAVBAR COMPONENT
// ------------------------------------------------

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  if (!user) return null;

  const items = navItems[user.tipo_usuario] || [];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  return (
    <nav className="bg-[#1a3a5c] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ---- LOGO ---- */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-amber-400 rounded-lg flex items-center justify-center shadow-md group-hover:bg-amber-300 transition-colors">
              <Flame className="w-5 h-5 text-[#1a3a5c]" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-sm leading-tight tracking-wide">ANH Bolivia</p>
              <p className="text-blue-300 text-xs leading-tight">Gestión de Combustible</p>
            </div>
          </Link>

          {/* ---- NAV ITEMS (desktop) ---- */}
          <div className="hidden md:flex items-center gap-1">
            {items.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive(path)
                    ? "bg-white/15 text-white"
                    : "text-blue-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* ---- USER MENU (desktop) ---- */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white transition-all"
            >
              <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
                <span className="text-[#1a3a5c] font-bold text-sm">
                  {user.nombres?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-medium leading-tight">
                  {user.nombres}
                </p>
                <p className="text-blue-300 text-xs leading-tight">
                  {rolLabels[user.tipo_usuario]}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-slate-800 font-semibold text-sm truncate">
                    {user.nombres} {user.apellido_paterno}
                  </p>
                  <p className="text-slate-500 text-xs truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

          {/* ---- HAMBURGER (mobile) ---- */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ---- MOBILE MENU ---- */}
      {menuOpen && (
        <div className="md:hidden bg-[#152e4d] border-t border-white/10 px-4 py-3 space-y-1">
          {items.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(path)
                  ? "bg-white/15 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <div className="border-t border-white/10 pt-2 mt-2">
            <div className="px-3 py-2">
              <p className="text-white text-sm font-medium">{user.nombres} {user.apellido_paterno}</p>
              <p className="text-blue-300 text-xs">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}