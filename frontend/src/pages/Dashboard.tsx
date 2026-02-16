// src/pages/Dashboard.tsx

import { useAuth } from "../context/AuthContext";

export default function Dashboard() {

  const { logout } = useAuth();

  return (
    <div>
      <h1>Dashboard protegido</h1>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
