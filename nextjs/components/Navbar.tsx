"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/Button";
import type { User } from "@/types/banking";

type NavbarProps = {
  user: User | null;
  onMenuToggle: () => void;
  onLogoutRequest: () => void;
};

export function Navbar({ user, onMenuToggle, onLogoutRequest }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const initials = useMemo(() => {
    if (!user?.name) {
      return "BL";
    }

    return user.name
      .split(" ")
      .map((chunk) => chunk[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  return (
    <header className="glass-panel sticky top-4 z-30 mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 rounded-[1.75rem] border border-[var(--color-border)] px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white/75 text-xl font-semibold text-[var(--color-text)] lg:hidden"
          aria-label="Open navigation"
        >
          ≡
        </button>
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f4bdc,#3d8bff)] text-lg font-semibold text-white shadow-[var(--shadow-soft)]">
            BL
          </span>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--color-primary)]">BlueLedger</p>
            <p className="text-sm font-semibold text-[var(--color-text)]">Digital Banking</p>
          </div>
        </Link>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-white/80 px-3 py-2 text-left transition hover:bg-white"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-sm font-semibold text-[var(--color-primary)]">
            {initials}
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-semibold text-[var(--color-text)]">{user?.name ?? "Secure session"}</span>
            <span className="block text-xs text-[var(--color-text-muted)]">{user?.email ?? "Signed in"}</span>
          </span>
        </button>

        {open ? (
          <div className="absolute right-0 mt-3 w-60 rounded-[1.5rem] border border-[var(--color-border)] bg-white/95 p-3 shadow-[var(--shadow-card)]">
            <Link
              href="/profile"
              className="block rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-primary-soft)]"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>
            <div className="mt-2">
              <Button variant="ghost" fullWidth onClick={onLogoutRequest}>
                Logout
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}