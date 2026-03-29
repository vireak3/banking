"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useToast } from "@/components/ToastProvider";
import { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

export default function RegisterPage() {
  const { register, isAuthenticated, isReady } = useAuthStore();
  const { showToast } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isReady, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Use at least 8 characters for the password.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await register({ name, email, password, role: "user" });
      showToast({
        title: "Registration successful",
        description: "Your user profile was created and signed in.",
        tone: "success",
      });
      router.replace("/dashboard");
    } catch (submissionError) {
      const message = getErrorMessage(submissionError);
      setError(message);
      showToast({ title: "Registration failed", description: message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 overflow-hidden lg:grid-cols-[0.92fr_1.08fr]">
      <section className="flex items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
        <div className="glass-panel w-full max-w-xl rounded-[2.25rem] border border-[var(--color-border)] px-6 py-8 sm:px-8 sm:py-10">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--color-primary)]">New Banking Profile</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--color-text)]">Create your BlueLedger access</h1>
          <p className="mt-3 text-base text-[var(--color-text-muted)]">
            Register through <span className="font-mono">/api/register</span>. The frontend signs you in immediately after the gateway returns the token.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jane Doe" required />
            <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jane@example.com" required />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Use a strong password"
              hint="Minimum 8 characters."
              required
            />
            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              error={error ?? undefined}
              required
            />
            <Button type="submit" fullWidth loading={submitting}>
              Create profile
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3 text-sm text-[var(--color-text-muted)]">
            <span>Already registered?</span>
            <Link href="/login" className="font-semibold text-[var(--color-primary)]">
              Go to login
            </Link>
          </div>
        </div>
      </section>

      <section className="relative hidden overflow-hidden bg-[linear-gradient(180deg,#ebf2ff_0%,#d8e7ff_30%,#0f3fb7_100%)] p-10 lg:block">
        <div className="grid-overlay absolute inset-0 opacity-45" />
        <div className="relative z-10 flex h-full flex-col justify-between rounded-[2.5rem] border border-white/18 bg-white/12 p-10 text-slate-950 backdrop-blur-sm">
          <div>
            <p className="font-mono text-sm uppercase tracking-[0.35em] text-slate-700/80">Digital Onboarding</p>
            <h2 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight text-slate-950">
              Sign up once, then open accounts and move funds from one workspace.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-900/8 bg-white/55 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-primary)]">Step 1</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">Register</p>
              <p className="mt-2 text-sm text-slate-700">Create a gateway-backed user and receive a bearer token.</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-900/8 bg-white/55 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-primary)]">Step 2</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">Open account</p>
              <p className="mt-2 text-sm text-slate-700">Create your first banking account with an opening balance from the dashboard.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}