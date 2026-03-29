import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, className = "", ...props }: InputProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-[var(--color-text)]">{label}</span>
      <input
        {...props}
        className={`w-full rounded-2xl border px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-muted)]/70 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 ${error ? "border-[var(--color-danger)] bg-[var(--color-danger-soft)]/40" : "border-[var(--color-border)] bg-white/80"} ${className}`}
      />
      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      {!error && hint ? <p className="text-sm text-[var(--color-text-muted)]">{hint}</p> : null}
    </label>
  );
}