"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useAuthStore } from "@/store/useAuthStore";
import type { Account, User } from "@/types/banking";

export default function ProfilePage() {
  const { user, refreshUser, logout, isReady } = useAuthStore();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        let activeUser: User | null = user;

        if (!activeUser) {
          activeUser = await refreshUser();
        }

        if (!activeUser) {
          return;
        }

        const accountsResponse = await apiRequest<Account[]>(`/spring/accounts/user/${activeUser.id}`);
        setAccounts(accountsResponse.data);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      }
    }

    if (isReady) {
      void loadProfile();
    }
  }, [isReady, refreshUser, user]);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + Number(account.balance), 0),
    [accounts],
  );

  function handleLogout() {
    logout();
    setLogoutOpen(false);
    router.replace("/login");
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6">
          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card eyebrow="Identity" title={user?.name ?? "Authenticated user"} value={user?.role ?? "user"}>
              <div className="space-y-3 text-sm text-[var(--color-text-muted)]">
                <p>Email: <span className="font-semibold text-[var(--color-text)]">{user?.email ?? "Unavailable"}</span></p>
                <p>User ID: <span className="font-semibold text-[var(--color-text)]">{user?.id ?? "Unavailable"}</span></p>
                <p>{error ?? "User details are sourced from GET /api/user through the Laravel gateway."}</p>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card eyebrow="Accounts" title="Open accounts" value={String(accounts.length)}>
                <p className="text-sm text-[var(--color-text-muted)]">Accounts linked to your authenticated identity.</p>
              </Card>
              <Card eyebrow="Balance" title="Combined funds" value={formatCurrency(totalBalance)}>
                <p className="text-sm text-[var(--color-text-muted)]">Summed across every account returned by the account service.</p>
              </Card>
            </div>
          </section>

          <Card eyebrow="Session" title="Logout" value="Secure sign-out">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm text-[var(--color-text-muted)]">
                Signing out clears the token stored for route protection and removes your local session state.
              </p>
              <Button variant="danger" onClick={() => setLogoutOpen(true)}>
                Logout now
              </Button>
            </div>
          </Card>
        </div>

        <Modal
          open={logoutOpen}
          onClose={() => setLogoutOpen(false)}
          title="Confirm logout"
          description="You will need to sign in again before accessing dashboard, transfer, or transaction screens."
          footer={
            <>
              <Button variant="secondary" onClick={() => setLogoutOpen(false)}>
                Stay signed in
              </Button>
              <Button variant="danger" onClick={handleLogout}>
                Logout
              </Button>
            </>
          }
        />
      </AppShell>
    </AuthGuard>
  );
}