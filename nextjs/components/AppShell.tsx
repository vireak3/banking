"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  function handleLogout() {
    logout();
    setLogoutOpen(false);
    router.replace("/login");
  }

  return (
    <div className="min-h-screen px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <Navbar user={user} onMenuToggle={() => setSidebarOpen((value) => !value)} onLogoutRequest={() => setLogoutOpen(true)} />
      <div className="mx-auto mt-4 grid max-w-[1400px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        <main className="glass-panel min-h-[calc(100vh-7.5rem)] rounded-[2rem] border border-[var(--color-border)] p-5 sm:p-7">
          {children}
        </main>
      </div>

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Sign out of BlueLedger?"
        description="This clears your local session token and returns you to the login screen."
        footer={
          <>
            <Button variant="secondary" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Logout
            </Button>
          </>
        }
      />
    </div>
  );
}