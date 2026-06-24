// src/components/ui/Card.tsx

import type { ReactNode } from "react";

interface Props {
  children:   ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: Props) {
  return (
    <div className={`bg-card rounded-xl border border-border shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: Props) {
  return (
    <div className={`px-6 py-4 border-b border-border ${className}`}>
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