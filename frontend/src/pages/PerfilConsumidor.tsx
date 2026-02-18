// src/pages/PerfilConsumidor.tsx

import { useAuth } from "../context/AuthContext";

export default function PerfilConsumidor() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: "40px" }}>
      <h1>Perfil del Consumidor</h1>

      <hr />

      <p><strong>Usuario:</strong> {user?.username}</p>
      <p><strong>Rol:</strong> {user?.tipo_usuario}</p>

      <div style={{ marginTop: "20px" }}>
        <button onClick={logout}>Cerrar Sesión</button>
      </div>

      <hr />

      <h2>Solicitudes</h2>
      <p>Aquí podrás crear y ver tus solicitudes.</p>
      {/* Aquí luego conectamos el formulario de solicitud */}
    </div>
  );
}
