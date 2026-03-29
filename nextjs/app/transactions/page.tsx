"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Loader } from "@/components/Loader";
import { StatusBadge } from "@/components/StatusBadge";
import { Table } from "@/components/Table";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate, truncateHash } from "@/lib/format";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ToastProvider";
import type { Account, BlockchainVerification, Transaction, User } from "@/types/banking";

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const { user, refreshUser, isReady } = useAuthStore();
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hashInput, setHashInput] = useState("");
  const [verificationResult, setVerificationResult] = useState<BlockchainVerification | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function loadAccounts() {
      try {
        let activeUser: User | null = user;

        if (!activeUser) {
          activeUser = await refreshUser();
        }

        if (!activeUser) {
          return;
        }

        const response = await apiRequest<Account[]>(`/spring/accounts/user/${activeUser.id}`);
        setAccounts(response.data);
        setSelectedAccountId((current) => current || String(response.data[0]?.id ?? ""));
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      }
    }

    if (isReady) {
      void loadAccounts();
    }
  }, [isReady, refreshUser, user]);

  useEffect(() => {
    async function loadTransactions() {
      if (!selectedAccountId) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await apiRequest<Transaction[]>(
          `/spring/transactions/${selectedAccountId}?limit=${PAGE_SIZE}&offset=${offset}`,
        );
        setTransactions(response.data);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    }

    if (isReady) {
      void loadTransactions();
    }
  }, [isReady, offset, selectedAccountId]);

  async function handleVerifyHash(hashValue?: string) {
    const candidate = (hashValue ?? hashInput).trim();

    if (!candidate) {
      setError("Provide a blockchain hash to verify.");
      return;
    }

    try {
      setVerifying(true);
      setError(null);
      const response = await apiRequest<BlockchainVerification>(`/spring/blockchain/verify/${encodeURIComponent(candidate)}`);
      setHashInput(candidate);
      setVerificationResult(response.data);
      showToast({
        title: response.data.valid ? "Hash verified" : "Hash not found",
        description: response.data.message,
        tone: response.data.valid ? "success" : "info",
      });
    } catch (verificationError) {
      const message = getErrorMessage(verificationError);
      setError(message);
      setVerificationResult(null);
      showToast({ title: "Verification failed", description: message, tone: "error" });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6">
          <section className="flex flex-col gap-4 rounded-[2rem] bg-[linear-gradient(135deg,rgba(13,44,112,0.98),rgba(22,82,240,0.92))] px-6 py-7 text-white md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/65">Transactions</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">Ledger activity</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/76">
                Switch between your accounts to inspect paginated transfers, statuses, and blockchain hash references.
              </p>
            </div>
            <div className="w-full max-w-sm rounded-[1.5rem] border border-white/14 bg-white/10 p-4">
              <label className="block space-y-2 text-left">
                <span className="text-sm font-semibold text-white">Account</span>
                <select
                  value={selectedAccountId}
                  onChange={(event) => {
                    setSelectedAccountId(event.target.value);
                    setOffset(0);
                  }}
                  className="w-full rounded-2xl border border-white/14 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      #{account.id} · {formatCurrency(Number(account.balance))}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card eyebrow="Timeline" title="Transaction history">
              {loading ? (
                <Loader label="Loading transaction history..." />
              ) : (
                <>
                  <Table
                    rows={transactions}
                    emptyState={error ?? "No transactions found for this account."}
                    columns={[
                      {
                        key: "date",
                        header: "Date",
                        render: (transaction) => (
                          <div>
                            <p className="font-semibold">{formatDate(transaction.createdAt)}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{truncateHash(transaction.blockchainHash, 8)}</p>
                          </div>
                        ),
                      },
                      {
                        key: "direction",
                        header: "Sender / Receiver",
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
                      {
                        key: "verify",
                        header: "Hash",
                        render: (transaction) => (
                          <Button variant="ghost" className="px-0 py-0 text-[var(--color-primary)] hover:bg-transparent" onClick={() => void handleVerifyHash(transaction.blockchainHash)}>
                            Verify
                          </Button>
                        ),
                      },
                    ]}
                  />

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-[var(--color-text-muted)]">Page offset: {offset}</p>
                    <div className="flex gap-3">
                      <Button variant="secondary" disabled={offset === 0} onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}>
                        Previous
                      </Button>
                      <Button variant="secondary" disabled={transactions.length < PAGE_SIZE} onClick={() => setOffset((current) => current + PAGE_SIZE)}>
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>

            <Card eyebrow="Blockchain" title="Verify transaction hash">
              <div className="space-y-4">
                <Input
                  label="Blockchain hash"
                  value={hashInput}
                  onChange={(event) => setHashInput(event.target.value)}
                  placeholder="Paste a 64-character transaction hash"
                  hint="Use a hash from the ledger table or paste one manually."
                />
                <Button loading={verifying} onClick={() => void handleVerifyHash()}>
                  Verify hash
                </Button>
                {verificationResult ? (
                  <div className={`rounded-[1.4rem] border px-4 py-4 text-sm ${verificationResult.valid ? "border-[var(--color-success)]/20 bg-[var(--color-success-soft)] text-[var(--color-success)]" : "border-[var(--color-warning)]/25 bg-[var(--color-warning-soft)] text-[var(--color-warning)]"}`}>
                    <p className="font-semibold">{verificationResult.valid ? "Hash found in ledger" : "Hash not present"}</p>
                    <p className="mt-1">{verificationResult.message}</p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)]">Verification results will appear here after calling the blockchain service.</p>
                )}
              </div>
            </Card>
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}