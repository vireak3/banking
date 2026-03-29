import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="glass-panel grid-overlay w-full max-w-2xl rounded-[2rem] border border-[var(--color-border)] px-8 py-10 text-center">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-[var(--color-primary)]">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--color-text)]">
          This banking screen does not exist.
        </h1>
        <p className="mt-3 text-base text-[var(--color-text-muted)]">
          The route may have expired, or the session redirected you away from a protected page.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)]"
          >
            Return to dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[var(--color-border)] bg-white/60 px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:bg-white"
          >
            Sign in again
          </Link>
        </div>
      </div>
    </div>
  );
}