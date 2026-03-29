import type { TransactionStatus } from "@/types/banking";

const styles: Record<TransactionStatus, string> = {
  COMPLETED: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  PENDING: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  FAILED: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

const dotStyles: Record<TransactionStatus, string> = {
  COMPLETED: "bg-[var(--color-success)]",
  PENDING: "bg-[var(--color-warning)]",
  FAILED: "bg-[var(--color-danger)]",
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      <span className={`status-dot ${dotStyles[status]}`} />
      {status}
    </span>
  );
}