"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", badge: "01" },
  { href: "/transfer", label: "Transfer", badge: "02" },
  { href: "/transactions", label: "Transactions", badge: "03" },
  { href: "/profile", label: "Profile", badge: "04" },
];

type SidebarProps = {
  open: boolean;
  onNavigate: () => void;
};

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`glass-panel fixed inset-y-0 left-4 z-40 mt-24 w-[280px] rounded-[2rem] border border-[var(--color-border)] p-4 transition lg:static lg:mt-0 lg:block lg:w-full ${open ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"}`}
    >
      <div className="rounded-[1.5rem] bg-[linear-gradient(140deg,rgba(31,95,255,0.12),rgba(255,255,255,0.92))] px-4 py-5">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--color-primary)]">Workspace</p>
        <h2 className="mt-3 text-xl font-semibold text-[var(--color-text)]">Secure operations</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Move funds, review ledgers, and keep every operation routed through the gateway.
        </p>
      </div>

      <nav className="mt-5 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center justify-between rounded-[1.35rem] px-4 py-3 text-sm font-semibold transition ${isActive ? "bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]" : "text-[var(--color-text)] hover:bg-white/80"}`}
            >
              <span>{item.label}</span>
              <span className={`rounded-full px-2 py-1 text-[10px] font-mono tracking-[0.2em] ${isActive ? "bg-white/18 text-white" : "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"}`}>
                {item.badge}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}