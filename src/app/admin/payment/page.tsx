"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { paymentApi } from "@/api/paymentApi";
import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import type {
  PayrollResponse,
  PayrollStatus,
  TopUpResponse,
  UpahRole,
  WalletResponse,
} from "@/types/payment";

const roleLabel: Record<UpahRole, string> = {
  BURUH: "Buruh",
  MANDOR: "Mandor",
  SUPIR: "Supir",
};

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const statusStyles: Record<PayrollStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  ACCEPTED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  REJECTED: "bg-red-500/15 text-red-300 border-red-500/30",
};

export default function AdminPaymentPage() {
  const { token, currentUser } = useAuth();
  const adminIdNumber = currentUser?.id ?? 0;
  const adminIdValid = Number.isFinite(adminIdNumber) && adminIdNumber > 0;

  const [draft, setDraft] = useState<Record<UpahRole, string>>({
    BURUH: "",
    MANDOR: "",
    SUPIR: "",
  });
  const [loadingUpah, setLoadingUpah] = useState(false);
  const [errorUpah, setErrorUpah] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState<UpahRole | null>(null);

  const [payrolls, setPayrolls] = useState<PayrollResponse[]>([]);
  const [loadingPayrolls, setLoadingPayrolls] = useState(false);
  const [errorPayrolls, setErrorPayrolls] = useState<string | null>(null);
  const [payrollActionId, setPayrollActionId] = useState<number | null>(null);
  const [rejectionNote, setRejectionNote] = useState<Record<number, string>>({});

  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<PayrollStatus | "">("");

  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [toppingUp, setToppingUp] = useState(false);
  const [topUpInvoice, setTopUpInvoice] = useState<TopUpResponse | null>(null);

  const loadUpah = useCallback(async () => {
    if (!token) return;
    setErrorUpah(null);
    setLoadingUpah(true);
    try {
      const data = await paymentApi.getUpah("ADMIN", token);
      setDraft({
        BURUH: String(data.find((item) => item.role === "BURUH")?.upahPerKg ?? 0),
        MANDOR: String(data.find((item) => item.role === "MANDOR")?.upahPerKg ?? 0),
        SUPIR: String(data.find((item) => item.role === "SUPIR")?.upahPerKg ?? 0),
      });
    } catch (e) {
      setErrorUpah(e instanceof Error ? e.message : "Failed to load upah");
    } finally {
      setLoadingUpah(false);
    }
  }, [token]);

  const loadPayrolls = useCallback(async () => {
    if (!token) return;
    if (!adminIdValid) {
      setErrorPayrolls("Admin ID harus berupa angka positif");
      return;
    }
    setErrorPayrolls(null);
    setLoadingPayrolls(true);
    try {
      const data = await paymentApi.getPayrolls("ADMIN", adminIdNumber, token);
      const sorted = [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setPayrolls(sorted);
    } catch (e) {
      setErrorPayrolls(e instanceof Error ? e.message : "Failed to load payroll");
    } finally {
      setLoadingPayrolls(false);
    }
  }, [adminIdNumber, adminIdValid, token]);

  const loadWallet = useCallback(async () => {
    if (!token) return;
    if (!adminIdValid) {
      setWalletError("Admin ID harus berupa angka positif");
      return;
    }
    setWalletError(null);
    try {
      const data = await paymentApi.getWallet(adminIdNumber, token);
      setWallet(data);
    } catch (e) {
      setWalletError(e instanceof Error ? e.message : "Failed to load wallet");
    }
  }, [adminIdNumber, adminIdValid, token]);

  const handleRefreshAll = useCallback(() => {
    void loadUpah();
    void loadPayrolls();
    void loadWallet();
  }, [loadPayrolls, loadUpah, loadWallet]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleRefreshAll();
    }, 0);
    return () => clearTimeout(timer);
  }, [handleRefreshAll]);

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((item) => {
      if (filterStatus && item.status !== filterStatus) return false;
      if (filterStartDate && item.createdAt < filterStartDate) return false;
      if (filterEndDate && item.createdAt.slice(0, 10) > filterEndDate) return false;
      return true;
    });
  }, [payrolls, filterStatus, filterStartDate, filterEndDate]);

  const handleChange = (role: UpahRole, value: string) => {
    setDraft((prev) => ({ ...prev, [role]: value }));
  };

  const handleSave = async (role: UpahRole) => {
    if (!token) return;
    const valueRupiah = Number(draft[role]);
    if (!Number.isFinite(valueRupiah) || valueRupiah <= 0) {
      setErrorUpah("Upah harus berupa angka positif");
      return;
    }
    setErrorUpah(null);
    setSavingRole(role);
    try {
      const updated = await paymentApi.updateUpah("ADMIN", { role, upahPerKg: valueRupiah }, token);
      setDraft((prev) => ({ ...prev, [role]: String(updated.upahPerKg) }));
    } catch (e) {
      setErrorUpah(e instanceof Error ? e.message : "Failed to update upah");
    } finally {
      setSavingRole(null);
    }
  };

  const handlePayrollStatus = async (payrollId: number, status: PayrollStatus) => {
    if (!token) return;
    if (!adminIdValid) {
      setErrorPayrolls("Admin ID harus berupa angka positif");
      return;
    }
    const note = rejectionNote[payrollId] ?? "";
    if (status === "REJECTED" && note.trim().length === 0) {
      setErrorPayrolls("Alasan penolakan wajib diisi");
      return;
    }
    setErrorPayrolls(null);
    setPayrollActionId(payrollId);
    try {
      const updated = await paymentApi.updatePayrollStatus("ADMIN", {
        id: payrollId,
        status,
        alasanPenolakan: status === "REJECTED" ? note : "Approved",
      }, token);
      setPayrolls((prev) => prev.map((item) => (item.id === payrollId ? updated : item)));
    } catch (e) {
      setErrorPayrolls(e instanceof Error ? e.message : "Failed to update payroll");
    } finally {
      setPayrollActionId(null);
    }
  };

  const openTopUpPopup = (url: string) => {
    const w = 520;
    const h = 700;
    const left = Math.max(0, window.screenX + (window.outerWidth - w) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - h) / 2);
    window.open(url, "xendit-topup", `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);
  };

  const handleTopUp = async () => {
    if (!token) return;
    const valueRupiah = Number(topUpAmount);
    if (!Number.isFinite(valueRupiah) || valueRupiah <= 0) {
      setWalletError("Nominal top up harus angka positif");
      return;
    }
    setWalletError(null);
    setTopUpInvoice(null);
    setToppingUp(true);
    try {
      const invoice = await paymentApi.topUp("ADMIN", valueRupiah, token);
      setTopUpInvoice(invoice);
      setTopUpAmount("");
      openTopUpPopup(invoice.invoiceUrl);
    } catch (e) {
      setWalletError(e instanceof Error ? e.message : "Top up gagal");
    } finally {
      setToppingUp(false);
    }
  };

  return (
    <AuthGuard roles={["ADMIN"]}>
      <AppShell>
        <div className="space-y-6">
          <section className="rounded-3xl border border-emerald-500/25 bg-slate-900/85 p-6 shadow-[0_20px_70px_-35px_rgba(16,185,129,0.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Admin Dashboard</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Kelola upah, approval payroll, dan top up wallet admin
                </p>
              </div>
              <button
                className="h-fit rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                type="button"
                onClick={handleRefreshAll}
              >
                Refresh
              </button>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
              <h3 className="text-lg font-semibold text-slate-100">Upah per Kg</h3>

              {loadingUpah ? (
                <p className="mt-4 text-sm text-slate-400">Memuat data upah...</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {(["BURUH", "MANDOR", "SUPIR"] as UpahRole[]).map((role) => (
                    <div
                      key={role}
                      className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3"
                    >
                      <p className="w-14 shrink-0 text-sm font-medium text-slate-200">{roleLabel[role]}</p>
                      <div className="flex flex-1 items-center overflow-hidden rounded-lg border border-slate-600 bg-slate-900 focus-within:border-emerald-500 transition">
                        <span className="shrink-0 border-r border-slate-600 px-3 text-xs text-slate-500">Rp</span>
                        <input
                          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 outline-none"
                          type="text"
                          inputMode="decimal"
                          value={draft[role]}
                          onChange={(event) => handleChange(role, event.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <button
                        className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        type="button"
                        onClick={() => handleSave(role)}
                        disabled={savingRole === role}
                      >
                        {savingRole === role ? "Menyimpan..." : "Simpan"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errorUpah && (
                <p className="mt-4 rounded border border-red-300/20 bg-red-500/10 p-2 text-sm text-red-300">
                  {errorUpah}
                </p>
              )}
            </section>

            <section className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
              <h3 className="text-lg font-semibold text-slate-100">Wallet Admin</h3>

              <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Saldo Saat Ini</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-300">
                  {wallet ? currency.format(wallet.balance) : "—"}
                </p>
              </div>

              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Top Up</p>
                <div className="mt-2 flex flex-col gap-2">
                  <input
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
                    placeholder="Nominal Rupiah"
                    type="text"
                    inputMode="decimal"
                    value={topUpAmount}
                    onChange={(event) => setTopUpAmount(event.target.value)}
                  />
                  <button
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    type="button"
                    onClick={handleTopUp}
                    disabled={toppingUp}
                  >
                    {toppingUp ? "Memproses..." : "Top Up"}
                  </button>
                </div>
              </div>

              {topUpInvoice && (
                <div className="mt-4 rounded border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  <p className="font-medium">Invoice berhasil dibuat.</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                      onClick={() => openTopUpPopup(topUpInvoice.invoiceUrl)}
                    >
                      Buka Pembayaran
                    </button>
                  </div>
                </div>
              )}

              {walletError && (
                <p className="mt-4 rounded border border-red-300/20 bg-red-500/10 p-2 text-sm text-red-300">
                  {walletError}
                </p>
              )}
            </section>
          </div>

          <section className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
            <h3 className="text-lg font-semibold text-slate-100">Payroll</h3>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <label className="text-sm text-slate-300">
                Dari Tanggal
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </label>
              <label className="text-sm text-slate-300">
                Sampai Tanggal
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </label>
              <label className="text-sm text-slate-300">
                Status
                <select
                  className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as PayrollStatus | "")}
                >
                  <option value="">Semua</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  className="w-full rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                  onClick={() => { setFilterStartDate(""); setFilterEndDate(""); setFilterStatus(""); }}
                >
                  Reset Filter
                </button>
              </div>
            </div>

            {loadingPayrolls ? (
              <p className="mt-6 text-sm text-slate-400">Memuat payroll...</p>
            ) : filteredPayrolls.length === 0 ? (
              <p className="mt-6 text-sm text-slate-400">
                {payrolls.length === 0 ? "Belum ada payroll." : "Tidak ada data yang cocok dengan filter."}
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {filteredPayrolls.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-100">Payroll #{item.id}</p>
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[item.status]}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">User ID: {item.userId}</p>
                        <p className="text-sm text-slate-400">Amount: {currency.format(item.amount)}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString("id-ID")}
                        </p>
                      </div>

                      {item.status === "PENDING" ? (
                        <div className="flex w-full flex-col gap-2 md:w-64">
                          <input
                            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-500"
                            placeholder="Alasan penolakan"
                            value={rejectionNote[item.id] ?? ""}
                            onChange={(event) =>
                              setRejectionNote((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                          />
                          <div className="flex gap-2">
                            <button
                              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                              type="button"
                              onClick={() => handlePayrollStatus(item.id, "ACCEPTED")}
                              disabled={payrollActionId === item.id}
                            >
                              Accept
                            </button>
                            <button
                              className="flex-1 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                              type="button"
                              onClick={() => handlePayrollStatus(item.id, "REJECTED")}
                              disabled={payrollActionId === item.id}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Status sudah final.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errorPayrolls && (
              <p className="mt-4 rounded border border-red-300/20 bg-red-500/10 p-2 text-sm text-red-300">
                {errorPayrolls}
              </p>
            )}
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
