import type { ReactNode } from "react";

type CardProps = {
  eyebrow?: string;
  title?: string;
  value?: string;
  children?: ReactNode;
  className?: string;
};

export function Card({ eyebrow, title, value, children, className = "" }: CardProps) {
  return (
    <section className={`glass-panel rounded-[1.75rem] border border-[var(--color-border)] p-6 ${className}`}>
      {eyebrow ? <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--color-primary)]">{eyebrow}</p> : null}
      {title ? <h3 className="mt-3 text-lg font-semibold text-[var(--color-text)]">{title}</h3> : null}
      {value ? <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{value}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}