// src/pages/DashboardInstitucional.tsx

import { useAuth } from "../context/AuthContext";

export default function DashboardInstitucional() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard Institucional</h1>

      <hr />

      <p><strong>Usuario:</strong> {user?.username}</p>
      <p><strong>Rol:</strong> {user?.tipo_usuario}</p>

      <div style={{ marginTop: "20px" }}>
        <button onClick={logout}>Cerrar Sesión</button>
      </div>

      <hr />

      <h2>Panel Administrativo</h2>
      <ul>
        <li>✔ Ver todas las solicitudes</li>
        <li>✔ Aprobar / Rechazar solicitudes</li>
        <li>✔ Gestión institucional</li>
      </ul>
    </div>
  );
}
