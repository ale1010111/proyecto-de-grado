// src/pages/Login.tsx

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setError(null);

    const success = await login(username, password);

    setSubmitting(false);

    if (success) {
      // 🔥 Dejamos que RoleRedirect maneje la navegación por rol
      navigate("/", { replace: true });
    } else {
      setError("Credenciales inválidas");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <form onSubmit={handleSubmit}>
        <h2>Iniciar Sesión</h2>

        {error && (
          <div style={{ color: "red", marginBottom: "10px" }}>
            {error}
          </div>
        )}

        <div>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>

        <div>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{ width: "100%" }}
        >
          {submitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
