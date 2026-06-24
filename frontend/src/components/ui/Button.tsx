// src/components/ui/Button.tsx

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
  primary:   "bg-primary hover:bg-primary-hover text-primary-foreground",
  secondary: "bg-background hover:bg-border text-foreground",
  danger:    "bg-red-600 hover:bg-red-700 text-white",
  ghost:     "hover:bg-background text-muted-foreground",
  outline:   "border border-border hover:bg-background text-foreground",
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