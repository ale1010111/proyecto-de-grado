import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      return (
        <div style={{ padding: 20, fontFamily: "monospace", color: "#B71C1C", maxHeight: "100vh", overflow: "auto" }}>
          <h2 style={{ color: "#B71C1C" }}>Error en la pagina</h2>
          <p><strong>{err?.name}:</strong> {err?.message}</p>
          <pre style={{ fontSize: 11, whiteSpace: "pre-wrap", background: "#FFEBEE", padding: 10, borderRadius: 8 }}>
            {err?.stack}
          </pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/login"; }}
            style={{ marginTop: 16, padding: "10px 20px", background: "#10B981", color: "white", border: "none", borderRadius: 8, fontFamily: "sans-serif" }}
          >
            Volver al login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}