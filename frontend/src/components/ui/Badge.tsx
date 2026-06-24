// src/components/ui/Badge.tsx

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}