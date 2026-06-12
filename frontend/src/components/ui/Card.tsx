// ------------------------------------------------
// src/components/ui/Card.tsx
// ------------------------------------------------

import type { ReactNode } from "react";

interface Props {
  children:   ReactNode;
  className?: string;
}


export function Card({ children, className = "" }: Props) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: Props) {
  return (
    <div className={`px-6 py-4 border-b border-slate-100 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }: Props) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}