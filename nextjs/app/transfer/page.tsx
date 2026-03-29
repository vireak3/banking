"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Loader } from "@/components/Loader";
import { Modal } from "@/components/Modal";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useAuthStore } from "@/store/useAuthStore";
import type { Account, Transaction, User } from "@/types/banking";
import { useToast } from "@/components/ToastProvider";

export default function TransferPage() {
  const { user, refreshUser, isReady } = useAuthStore();
  const { showToast } = useToast();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
        setFromAccount(response.data[0] ? String(response.data[0].id) : "");
      } catch (error) {
        setFormError(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }

    if (isReady) {
      void loadAccounts();
    }
  }, [isReady, refreshUser, user]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => String(account.id) === fromAccount) ?? null,
    [accounts, fromAccount],
  );

  function validateForm() {
    if (!fromAccount || !toAccount || !amount) {
      return "All fields are required.";
    }

    if (fromAccount === toAccount) {
      return "Receiver account must differ from the source account.";
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return "Amount must be greater than zero.";
    }

    if (selectedAccount && numericAmount > Number(selectedAccount.balance)) {
      return "Amount exceeds the selected account balance.";
    }

    return null;
  }

  async function submitTransfer() {
    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const response = await apiRequest<Transaction>("/spring/transactions/transfer", {
        method: "POST",
        body: JSON.stringify({
          fromAccount: Number(fromAccount),
          toAccount: Number(toAccount),
          amount: Number(amount),
        }),
      });

      showToast({
        title: "Transfer completed",
        description: `Blockchain hash ${response.data.blockchainHash}`,
        tone: "success",
      });
      setConfirmOpen(false);
      setAmount("");
      setToAccount("");
      router.push("/transactions");
    } catch (error) {
      const message = getErrorMessage(error);
      setFormError(message);
      showToast({ title: "Transfer failed", description: message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthGuard>
      <AppShell>
        {loading ? (
          <Loader label="Loading your eligible source accounts..." />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card eyebrow="Liquidity" title="Transfer overview" value={selectedAccount ? formatCurrency(Number(selectedAccount.balance)) : "$0.00"}>
              <div className="space-y-3 text-sm text-[var(--color-text-muted)]">
                <p>
                  Select the source account you want to debit. Transfers are submitted to <span className="font-mono">/api/spring/transactions/transfer</span> through the gateway.
                </p>
                <p>
                  Available accounts: <span className="font-semibold text-[var(--color-text)]">{accounts.length}</span>
                </p>
                {!accounts.length ? (
                  <p>
                    No account exists yet. Open one from the <a href="/dashboard" className="font-semibold text-[var(--color-primary)]">dashboard</a> before sending transfers.
                  </p>
                ) : null}
              </div>
            </Card>

            <section className="glass-panel rounded-[1.9rem] border border-[var(--color-border)] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--color-primary)]">Transfer money</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text)]">Move funds securely</h1>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                Pick the source account, enter the receiver account number, and confirm the transfer amount.
              </p>

              <div className="mt-8 space-y-5">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-[var(--color-text)]">From account</span>
                  <select
                    value={fromAccount}
                    onChange={(event) => setFromAccount(event.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white/80 px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10"
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        #{account.id} · {formatCurrency(Number(account.balance))}
                      </option>
                    ))}
                  </select>
                </label>

                <Input
                  label="Receiver account"
                  inputMode="numeric"
                  value={toAccount}
                  onChange={(event) => setToAccount(event.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Example: 2"
                />

                <Input
                  label="Amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="500.00"
                  hint={selectedAccount ? `Available: ${formatCurrency(Number(selectedAccount.balance))}` : undefined}
                  error={formError ?? undefined}
                />

                <Button
                  fullWidth
                  onClick={() => {
                    const validationError = validateForm();
                    setFormError(validationError);
                    if (!validationError) {
                      setConfirmOpen(true);
                    }
                  }}
                  disabled={!accounts.length}
                >
                  Review transfer
                </Button>
              </div>
            </section>
          </div>
        )}

        <Modal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Confirm transfer"
          description="Double-check the account numbers and amount before sending the request."
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                Back
              </Button>
              <Button loading={submitting} onClick={submitTransfer}>
                Submit transfer
              </Button>
            </>
          }
        >
          <div className="grid gap-4 rounded-[1.5rem] bg-[var(--color-primary-soft)]/45 p-4 text-sm text-[var(--color-text)] sm:grid-cols-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--color-primary)]">From</p>
              <p className="mt-2 font-semibold">#{fromAccount}</p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--color-primary)]">To</p>
              <p className="mt-2 font-semibold">#{toAccount}</p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--color-primary)]">Amount</p>
              <p className="mt-2 font-semibold">{formatCurrency(Number(amount || 0))}</p>
            </div>
          </div>
        </Modal>
      </AppShell>
    </AuthGuard>
  );
}