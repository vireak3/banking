"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Loader } from "@/components/Loader";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { Table } from "@/components/Table";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate, truncateHash } from "@/lib/format";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ToastProvider";
import type { Account, Transaction, User } from "@/types/banking";

export default function DashboardPage() {
  const { user, refreshUser, isReady } = useAuthStore();
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [initialBalance, setInitialBalance] = useState("1000.00");
  const [createAccountError, setCreateAccountError] = useState<string | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);

    let activeUser: User | null = user;

    if (!activeUser) {
      activeUser = await refreshUser();
    }

    if (!activeUser) {
      setLoading(false);
      return;
    }

    const accountsResponse = await apiRequest<Account[]>(`/spring/accounts/user/${activeUser.id}`);
    setAccounts(accountsResponse.data);

    if (accountsResponse.data[0]) {
      const transactionsResponse = await apiRequest<Transaction[]>(
        `/spring/transactions/${accountsResponse.data[0].id}?limit=5&offset=0`,
      );
      setTransactions(transactionsResponse.data);
    } else {
      setTransactions([]);
    }

    setLoading(false);
    return activeUser;
  }

  useEffect(() => {
    async function loadDashboard() {
      try {
        await fetchDashboardData();
      } catch (loadError) {
        setError(getErrorMessage(loadError));
        setLoading(false);
      }
    }

    if (isReady) {
      void loadDashboard();
    }
  }, [isReady, refreshUser, user]);

  async function handleCreateAccount() {
    if (!initialBalance.trim()) {
      setCreateAccountError("Opening balance is required.");
      return;
    }

    const numericBalance = Number(initialBalance);

    if (Number.isNaN(numericBalance) || numericBalance < 0) {
      setCreateAccountError("Opening balance must be zero or greater.");
      return;
    }

    try {
      setCreatingAccount(true);
      setCreateAccountError(null);

      let activeUser: User | null = user;

      if (!activeUser) {
        activeUser = await refreshUser();
      }

      if (!activeUser) {
        throw new Error("User session could not be loaded.");
      }

      await apiRequest<Account>("/spring/accounts", {
        method: "POST",
        body: JSON.stringify({
          userId: activeUser.id,
          balance: numericBalance,
        }),
      });

      await fetchDashboardData();
      setCreateAccountOpen(false);
      setInitialBalance("1000.00");
      showToast({
        title: "Account created",
        description: "The new account is available for transfers and history views.",
        tone: "success",
      });
    } catch (creationError) {
      const message = getErrorMessage(creationError);
      setCreateAccountError(message);
      showToast({ title: "Account creation failed", description: message, tone: "error" });
    } finally {
      setCreatingAccount(false);
    }
  }

  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const primaryAccount = accounts[0] ?? null;
  const lastTransaction = transactions[0] ?? null;

  return (
    <AuthGuard>
      <AppShell>
        {loading ? (
          <Loader label="Loading your dashboard, balances, and recent transfers..." />
        ) : (
          <div className="space-y-8">
            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[2rem] bg-[linear-gradient(135deg,#0d2c70_0%,#1652f0_55%,#64a4ff_100%)] px-6 py-7 text-white shadow-[var(--shadow-card)]">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/68">Portfolio Snapshot</p>
                <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h1 className="text-4xl font-semibold tracking-tight">Welcome back, {user?.name ?? "Banking User"}</h1>
                    <p className="mt-3 max-w-xl text-base text-white/78">
                      Review your liquidity, route transfers through the gateway, and watch ledger activity update in one place.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/14 bg-white/10 px-5 py-4 text-right">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/65">Total balance</p>
                    <p className="mt-2 text-3xl font-semibold">{formatCurrency(totalBalance)}</p>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button variant="secondary" className="bg-white text-[var(--color-primary)] hover:bg-white/90" onClick={() => setCreateAccountOpen(true)}>
                    Open account
                  </Button>
                  <Link href="/transfer">
                    <Button variant="secondary" className="bg-white text-[var(--color-primary)] hover:bg-white/90">
                      Transfer money
                    </Button>
                  </Link>
                  <Link href="/transactions">
                    <Button variant="ghost" className="border border-white/16 bg-white/8 text-white hover:bg-white/14">
                      View full history
                    </Button>
                  </Link>
                </div>
              </div>

              <Card eyebrow="Primary Account" title={primaryAccount ? `Account #${primaryAccount.id}` : "No account found"} value={primaryAccount ? formatCurrency(Number(primaryAccount.balance)) : "$0.00"}>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {primaryAccount
                    ? `Updated ${formatDate(primaryAccount.updatedAt)}`
                    : "Create an account from the backend before attempting transfers."}
                </p>
                {!primaryAccount ? (
                  <div className="mt-4">
                    <Button onClick={() => setCreateAccountOpen(true)}>Create your first account</Button>
                  </div>
                ) : null}
              </Card>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <Card eyebrow="Accounts" title="Open accounts" value={String(accounts.length)}>
                <p className="text-sm text-[var(--color-text-muted)]">All accounts belonging to your authenticated Laravel user.</p>
              </Card>
              <Card eyebrow="Recent Move" title="Latest transaction" value={lastTransaction ? formatCurrency(Number(lastTransaction.amount)) : "$0.00"}>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {lastTransaction ? `${lastTransaction.status} on ${formatDate(lastTransaction.createdAt)}` : "No recent transfer activity yet."}
                </p>
              </Card>
              <Card eyebrow="Gateway" title="Status" value={error ? "Attention needed" : "Healthy"}>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {error ?? "Laravel auth and microservice routing are reachable from the frontend."}
                </p>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--color-primary)]">Recent transactions</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">Latest account activity</h2>
                  </div>
                  <Link href="/transactions" className="text-sm font-semibold text-[var(--color-primary)]">
                    Open ledger
                  </Link>
                </div>
                <Table
                  rows={transactions}
                  emptyState="No transactions found for the primary account yet."
                  columns={[
                    {
                      key: "date",
                      header: "Date",
                      render: (transaction) => (
                        <div>
                          <p className="font-semibold">{formatDate(transaction.createdAt)}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">Hash {truncateHash(transaction.blockchainHash, 6)}</p>
                        </div>
                      ),
                    },
                    {
                      key: "route",
                      header: "Route",
                      render: (transaction) => (
                        <div>
                          <p>From #{transaction.fromAccount}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">To #{transaction.toAccount}</p>
                        </div>
                      ),
                    },
                    {
                      key: "amount",
                      header: "Amount",
                      render: (transaction) => <span className="font-semibold">{formatCurrency(Number(transaction.amount))}</span>,
                    },
                    {
                      key: "status",
                      header: "Status",
                      render: (transaction) => <StatusBadge status={transaction.status} />,
                    },
                  ]}
                />
              </div>

              <Card eyebrow="Quick actions" title="Keep funds moving">
                <div className="space-y-3">
                  <Link href="/transfer" className="block rounded-[1.5rem] border border-[var(--color-border)] bg-white/70 px-4 py-4 transition hover:bg-white">
                    <p className="font-semibold text-[var(--color-text)]">Initiate transfer</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">Move funds between accounts with transaction confirmation.</p>
                  </Link>
                  <Link href="/transactions" className="block rounded-[1.5rem] border border-[var(--color-border)] bg-white/70 px-4 py-4 transition hover:bg-white">
                    <p className="font-semibold text-[var(--color-text)]">Review history</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">Inspect statuses, amounts, and blockchain hashes.</p>
                  </Link>
                  <Link href="/profile" className="block rounded-[1.5rem] border border-[var(--color-border)] bg-white/70 px-4 py-4 transition hover:bg-white">
                    <p className="font-semibold text-[var(--color-text)]">Profile and session</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">Check identity details and manage logout.</p>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setCreateAccountOpen(true)}
                    className="block w-full rounded-[1.5rem] border border-[var(--color-border)] bg-white/70 px-4 py-4 text-left transition hover:bg-white"
                  >
                    <p className="font-semibold text-[var(--color-text)]">Open another account</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">Provision a fresh account directly through the account service route.</p>
                  </button>
                </div>
              </Card>
            </section>
          </div>
        )}

        <Modal
          open={createAccountOpen}
          onClose={() => setCreateAccountOpen(false)}
          title="Create a new banking account"
          description="This posts to the account service through the Laravel gateway and attaches the current user ID automatically."
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateAccountOpen(false)}>
                Cancel
              </Button>
              <Button loading={creatingAccount} onClick={handleCreateAccount}>
                Create account
              </Button>
            </>
          }
        >
          <Input
            label="Opening balance"
            inputMode="decimal"
            value={initialBalance}
            onChange={(event) => setInitialBalance(event.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="1000.00"
            hint="Set 0.00 for an empty account."
            error={createAccountError ?? undefined}
          />
        </Modal>
      </AppShell>
    </AuthGuard>
  );
}