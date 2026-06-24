// src/components/ui/Alert.tsx

import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

type AlertType = "error" | "success" | "info" | "warning";

interface AlertProps {
  type:     AlertType;
  message:  string;
  className?: string;
}

const alertConfig: Record<AlertType, { icon: any; classes: string }> = {
  error:   { icon: AlertCircle,   classes: "bg-red-50 border-red-200 text-red-700" },
  success: { icon: CheckCircle,   classes: "bg-state-success-bg border-state-success-fg/20 text-state-success-fg" },
  info:    { icon: Info,          classes: "bg-primary/10 border-primary/30 text-primary" },
  warning: { icon: AlertTriangle, classes: "bg-amber-50 border-amber-200 text-amber-700" },
};

export function Alert({ type, message, className = "" }: AlertProps) {
  const { icon: Icon, classes } = alertConfig[type];
  return (
    <div className={`flex items-start gap-3 border rounded-xl px-4 py-3 text-sm ${classes} ${className}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}