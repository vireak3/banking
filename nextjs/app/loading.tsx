export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-panel grid-overlay flex w-full max-w-md items-center gap-4 rounded-[2rem] border border-[var(--color-border)] px-6 py-6">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-primary-soft)] border-t-[var(--color-primary)]" />
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">Syncing your banking workspace</p>
          <p className="text-sm text-[var(--color-text-muted)]">Fetching accounts, balances, and recent activity.</p>
        </div>
      </div>
    </div>
  );
}