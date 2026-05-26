"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { paymentApi } from "@/api/paymentApi";
import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import type { PayrollResponse, PayrollStatus, WalletResponse } from "@/types/payment";

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const sawitDollarFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const statusStyles: Record<PayrollStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  ACCEPTED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  REJECTED: "bg-red-500/15 text-red-300 border-red-500/30",
};

const statusLabel: Record<PayrollStatus, string> = {
  PENDING: "Menunggu",
  ACCEPTED: "Diterima",
  REJECTED: "Ditolak",
};

export default function UserWalletPage() {
  const { token, currentUser } = useAuth();
  const userId = currentUser?.id ?? 0;
  const userIdValid = Number.isFinite(userId) && userId > 0;
  const role = currentUser?.role ?? "BURUH";

  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [payrolls, setPayrolls] = useState<PayrollResponse[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollError, setPayrollError] = useState<string | null>(null);

  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<PayrollStatus | "">("");

  const loadWallet = useCallback(async () => {
    if (!token || !userIdValid) return;
    setWalletError(null);
    setWalletLoading(true);
    try {
      const data = await paymentApi.getWallet(userId, token);
      setWallet(data);
    } catch (e) {
      setWalletError(e instanceof Error ? e.message : "Gagal memuat wallet");
    } finally {
      setWalletLoading(false);
    }
  }, [token, userId, userIdValid]);

  const loadPayrolls = useCallback(async () => {
    if (!token || !userIdValid) return;
    setPayrollError(null);
    setPayrollLoading(true);
    try {
      const data = await paymentApi.getPayrolls(role as "BURUH" | "MANDOR" | "SUPIR", userId, token);
      const sorted = [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setPayrolls(sorted);
    } catch (e) {
      setPayrollError(e instanceof Error ? e.message : "Gagal memuat riwayat payroll");
    } finally {
      setPayrollLoading(false);
    }
  }, [token, userId, userIdValid, role]);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void loadWallet();
      void loadPayrolls();
    }, 0);
    return () => globalThis.clearTimeout(timer);
  }, [loadWallet, loadPayrolls]);

  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((item) => {
      if (filterStatus && item.status !== filterStatus) return false;
      if (filterStartDate && item.createdAt < filterStartDate) return false;
      if (filterEndDate && item.createdAt.slice(0, 10) > filterEndDate) return false;
      return true;
    });
  }, [payrolls, filterStatus, filterStartDate, filterEndDate]);

  return (
    <AuthGuard roles={["BURUH", "MANDOR", "SUPIR"]}>
      <AppShell>
        <div className="space-y-6">
          <section className="rounded-3xl border border-emerald-500/25 bg-slate-900/85 p-6 shadow-[0_20px_70px_-35px_rgba(16,185,129,0.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Payment</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Wallet Saya</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Saldo dan riwayat pembayaran upah Anda.
                </p>
              </div>
              <button
                className="h-fit rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                type="button"
                onClick={() => { void loadWallet(); void loadPayrolls(); }}
              >
                Refresh
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
            <h3 className="text-lg font-semibold text-slate-100">Saldo</h3>

            {walletLoading ? (
              <p className="mt-4 text-sm text-slate-400">Memuat saldo...</p>
            ) : walletError ? (
              <p className="mt-4 rounded border border-red-300/20 bg-red-500/10 p-2 text-sm text-red-300">
                {walletError}
              </p>
            ) : (
              <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/50 p-5">
                <p className="text-xs uppercase tracking-widest text-slate-500">Saldo Saat Ini</p>
                <p className="mt-2 text-3xl font-bold text-emerald-300">
                  {wallet ? currency.format(wallet.balance * 10000) : "—"}
                </p>
                {wallet && (
                  <p className="mt-1 text-sm text-slate-400">
                    {`$${sawitDollarFormat.format(wallet.balance)} Sawit Dolar`}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
            <h3 className="text-lg font-semibold text-slate-100">Riwayat Payroll</h3>

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
                  <option value="PENDING">Menunggu</option>
                  <option value="ACCEPTED">Diterima</option>
                  <option value="REJECTED">Ditolak</option>
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

            {payrollLoading ? (
              <p className="mt-6 text-sm text-slate-400">Memuat riwayat payroll...</p>
            ) : payrollError ? (
              <p className="mt-6 rounded border border-red-300/20 bg-red-500/10 p-2 text-sm text-red-300">
                {payrollError}
              </p>
            ) : filteredPayrolls.length === 0 ? (
              <p className="mt-6 text-sm text-slate-400">
                {payrolls.length === 0 ? "Belum ada riwayat payroll." : "Tidak ada data yang cocok dengan filter."}
              </p>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-800 text-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">#</th>
                      <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                      <th className="px-4 py-3 text-right font-medium">Jumlah</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayrolls.map((item) => (
                      <tr key={item.id} className="border-t border-slate-700 text-slate-100">
                        <td className="px-4 py-3 text-slate-400">{item.id}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {new Date(item.createdAt).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-300">
                          {currency.format(item.amount * 10000)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[item.status]}`}>
                            {statusLabel[item.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
