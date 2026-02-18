// src/pages/Unauthorized.tsx

import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div style={{ padding: "60px", textAlign: "center" }}>
      <h1>403 - No Autorizado</h1>
      <p>No tienes permisos para acceder a esta sección.</p>

      <Link to="/">
        <button style={{ marginTop: "20px" }}>
          Volver al inicio
        </button>
      </Link>
    </div>
  );
}
