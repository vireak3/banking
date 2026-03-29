export function Loader({ label = "Loading your banking data..." }: { label?: string }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-primary-soft)] border-t-[var(--color-primary)]" />
        <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      </div>
    </div>
  );
}