"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("john@example.com");
  const [password, setPassword] = useState("123123123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isReady } = useAuthStore();
  const { showToast } = useToast();

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace(searchParams.get("next") || "/dashboard");
    }
  }, [isAuthenticated, isReady, router, searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login({ email, password });
      showToast({
        title: "Login successful",
        description: "Your secure banking workspace is ready.",
        tone: "success",
      });
      router.replace(searchParams.get("next") || "/dashboard");
    } catch (submissionError) {
      const message = getErrorMessage(submissionError);
      setError(message);
      showToast({ title: "Login failed", description: message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[linear-gradient(180deg,#0c2866_0%,#1447d8_40%,#eef4ff_100%)] p-10 lg:block">
        <div className="grid-overlay absolute inset-0 opacity-40" />
        <div className="relative z-10 flex h-full flex-col justify-between rounded-[2.5rem] border border-white/15 bg-white/8 p-10 text-white backdrop-blur-sm">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.35em] text-white/70">BlueLedger Bank</p>
            <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight">
              A modern banking desk for balances, transfers, and live transaction routing.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/78">
              Built on Next.js and connected to the Laravel gateway that fronts your account, transaction, and blockchain services.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/12 bg-white/10 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/60">Latency</p>
              <p className="mt-2 text-3xl font-semibold">Fast</p>
              <p className="mt-2 text-sm text-white/70">Fetch wrappers keep every request targeted and auth-aware.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/12 bg-white/10 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/60">Security</p>
              <p className="mt-2 text-3xl font-semibold">Guarded</p>
              <p className="mt-2 text-sm text-white/70">Protected routes require a valid gateway-issued bearer token.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/12 bg-white/10 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/60">Coverage</p>
              <p className="mt-2 text-3xl font-semibold">Live</p>
              <p className="mt-2 text-sm text-white/70">Accounts, transfers, and transaction history flow through one frontend.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
        <div className="glass-panel w-full max-w-xl rounded-[2.25rem] border border-[var(--color-border)] px-6 py-8 sm:px-8 sm:py-10">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--color-primary)]">Secure Sign-In</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--color-text)]">Access your banking workspace</h2>
          <p className="mt-3 text-base text-[var(--color-text-muted)]">
            Sign in with your Laravel gateway credentials. The token returned from <span className="font-mono">/api/login</span> is attached to all protected requests.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              error={error ?? undefined}
            />

            <div className="rounded-[1.4rem] border border-[var(--color-border)] bg-white/55 px-4 py-3 text-sm text-[var(--color-text-muted)]">
              Demo credentials are prefilled.
            </div>

            <Button type="submit" fullWidth loading={submitting}>
              Sign in securely
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3 text-sm text-[var(--color-text-muted)]">
            <span>Need a new account?</span>
            <Link href="/register" className="font-semibold text-[var(--color-primary)]">
              Register now
            </Link>
          </div>

          <div className="mt-8 flex flex-col gap-3 rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(31,95,255,0.08),rgba(255,255,255,0.85))] px-5 py-5 text-sm text-[var(--color-text-muted)] sm:flex-row sm:items-center sm:justify-between">
            <span>Need the API details?</span>
            <Link href="/spring/accounts/swagger-ui.html" className="font-semibold text-[var(--color-primary)]">
              Open Swagger
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}