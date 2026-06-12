// src/components/Layout.tsx

import type { ReactNode } from "react";
import Navbar from "./Navbar";

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <footer className="bg-[#1a3a5c] text-blue-300 text-xs text-center py-3">
        © {new Date().getFullYear()} Agencia Nacional de Hidrocarburos — Bolivia
      </footer>
    </div>
  );
}