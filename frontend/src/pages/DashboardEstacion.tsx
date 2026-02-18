// src/pages/DashboardEstacion.tsx

import { useAuth } from "../context/AuthContext";

export default function DashboardEstacion() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard Estación de Servicio</h1>

      <hr />

      <p><strong>Usuario:</strong> {user?.username}</p>
      <p><strong>Rol:</strong> {user?.tipo_usuario}</p>
      <p><strong>ID Estación:</strong> {user?.estacion_servicio ?? "No asignada"}</p>

      <div style={{ marginTop: "20px" }}>
        <button onClick={logout}>Cerrar Sesión</button>
      </div>

      <hr />

      <h2>Gestión de Solicitudes</h2>
      <p>Aquí podrás gestionar solicitudes asociadas a tu estación.</p>
    </div>
  );
}
