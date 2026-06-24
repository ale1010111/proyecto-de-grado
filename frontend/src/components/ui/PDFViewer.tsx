// src/components/ui/PDFViewer.tsx
// Modal para visualizar PDFs inline sin descargar

import { useState, useEffect } from "react";
import { X, Download, Loader } from "lucide-react";


interface PDFViewerProps {
  titulo:    string;
  onClose:   () => void;
  fetchPDF:  () => Promise<Blob>;
  onDescargar?: () => void;
}

export default function PDFViewer({ titulo, onClose, fetchPDF, onDescargar }: PDFViewerProps) {
  const [url,     setUrl]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    let objectUrl: string;
    fetchPDF()
      .then(blob => {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => setError("No se pudo cargar el PDF."))
      .finally(() => setLoading(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background shrink-0">
          <h3 className="font-semibold text-foreground text-sm">{titulo}</h3>
          <div className="flex items-center gap-2">
            {onDescargar && (
              <button
                onClick={onDescargar}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary-hover transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Descargar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-border transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-hidden bg-border">
          {loading && (
            <div className="flex items-center justify-center h-full gap-3">
              <Loader className="w-6 h-6 text-primary animate-spin" />
              <p className="text-muted-foreground text-sm">Cargando PDF...</p>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
          {url && !loading && (
            <iframe
              src={url}
              className="w-full h-full border-0"
              title={titulo}
            />
          )}
        </div>
      </div>
    </div>
  );
}