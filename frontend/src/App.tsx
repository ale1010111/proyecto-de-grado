// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import PerfilConsumidor from "./pages/PerfilConsumidor";
import DashboardEstacion from "./pages/DashboardEstacion";
import DashboardInstitucional from "./pages/DashboardInstitucional";
import Unauthorized from "./pages/Unauthorized";

/**
 * 🔥 Redirección automática según rol
 */
function RoleRedirect() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.tipo_usuario) {
    case "CONS":
      return <Navigate to="/perfil" replace />;

    case "ESS":
      return <Navigate to="/dashboard-estacion" replace />;

    case "ADMIN":
    case "ANH":
      return <Navigate to="/dashboard-institucional" replace />;

    default:
      return <Navigate to="/login" replace />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Redirección inteligente */}
      <Route path="/" element={<RoleRedirect />} />

      {/* ================= CONSUMIDOR ================= */}
      <Route
        path="/perfil"
        element={
          <ProtectedRoute allowedRoles={["CONS"]}>
            <PerfilConsumidor />
          </ProtectedRoute>
        }
      />

      {/* ================= ESTACIÓN ================= */}
      <Route
        path="/dashboard-estacion"
        element={
          <ProtectedRoute allowedRoles={["ESS"]}>
            <DashboardEstacion />
          </ProtectedRoute>
        }
      />

      {/* ================= ADMIN / ANH ================= */}
      <Route
        path="/dashboard-institucional"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "ANH"]}>
            <DashboardInstitucional />
          </ProtectedRoute>
        }
      />

      {/* No autorizado */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
