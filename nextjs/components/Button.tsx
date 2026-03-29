"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  fullWidth?: boolean;
};

const variantStyles = {
  primary:
    "bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)] hover:bg-[var(--color-primary-strong)]",
  secondary:
    "border border-[var(--color-border)] bg-white/80 text-[var(--color-text)] hover:bg-white",
  ghost:
    "bg-transparent text-[var(--color-text)] hover:bg-white/70",
  danger: "bg-[var(--color-danger)] text-white shadow-[var(--shadow-soft)] hover:brightness-95",
};

export function Button({
  children,
  variant = "primary",
  loading = false,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 disabled:cursor-not-allowed disabled:opacity-60 ${variantStyles[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : null}
      {children}
    </button>
  );
}