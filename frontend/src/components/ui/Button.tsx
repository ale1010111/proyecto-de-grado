// ------------------------------------------------
// src/components/ui/Button.tsx
// ------------------------------------------------

import type { ReactNode } from "react";
import { Spinner } from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?:     "sm" | "md" | "lg";
  loading?:  boolean;
  icon?:     ReactNode;
  children:  ReactNode;
}

const variants: Record<string, string> = {
  primary:   "bg-[#1a3a5c] hover:bg-[#152e4d] text-white",
  secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700",
  danger:    "bg-red-600 hover:bg-red-700 text-white",
  ghost:     "hover:bg-slate-100 text-slate-600",
  outline:   "border border-slate-200 hover:bg-slate-50 text-slate-700",
};

const sizes: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size    = "md",
  loading = false,
  icon,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-xl
        transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  );
}