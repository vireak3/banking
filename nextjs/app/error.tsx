"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="glass-panel w-full max-w-2xl rounded-[2rem] border border-[var(--color-border)] px-8 py-10">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-[var(--color-danger)]">Application Error</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--color-text)]">
          The banking frontend hit an unexpected error.
        </h1>
        <p className="mt-3 text-base text-[var(--color-text-muted)]">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}