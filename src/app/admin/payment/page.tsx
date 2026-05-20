"use client";

import { useCallback, useEffect, useState } from "react";
import { paymentApi } from "@/api/paymentApi";
import type {
  PayrollResponse,
  PayrollStatus,
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

const sawitDollarFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export default function UpahPage() {
  const adminId = "100";
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
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [toppingUp, setToppingUp] = useState(false);

  const adminIdNumber = Number(adminId);
  const adminIdValid = Number.isFinite(adminIdNumber) && adminIdNumber > 0;

  const loadUpah = useCallback(async () => {
    setErrorUpah(null);
    setLoadingUpah(true);
    try {
      const data = await paymentApi.getUpah("ADMIN");
      setDraft({
        BURUH: String((data.find((item) => item.role === "BURUH")?.upahPerKg ?? 0) * 10000),
        MANDOR: String((data.find((item) => item.role === "MANDOR")?.upahPerKg ?? 0) * 10000),
        SUPIR: String((data.find((item) => item.role === "SUPIR")?.upahPerKg ?? 0) * 10000),
      });
    } catch (e) {
      setErrorUpah(e instanceof Error ? e.message : "Failed to load upah");
    } finally {
      setLoadingUpah(false);
    }
  }, []);

  const loadPayrolls = useCallback(async () => {
    if (!adminIdValid) {
      setErrorPayrolls("Admin ID harus berupa angka positif");
      return;
    }
    setErrorPayrolls(null);
    setLoadingPayrolls(true);
    try {
      const data = await paymentApi.getPayrolls("ADMIN", adminIdNumber);
      const sorted = [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setPayrolls(sorted);
    } catch (e) {
      setErrorPayrolls(e instanceof Error ? e.message : "Failed to load payroll");
    } finally {
      setLoadingPayrolls(false);
    }
  }, [adminIdNumber, adminIdValid]);

  const loadWallet = useCallback(async () => {
    if (!adminIdValid) {
      setWalletError("Admin ID harus berupa angka positif");
      return;
    }
    setWalletError(null);
    try {
      const data = await paymentApi.getWallet(adminIdNumber);
      setWallet(data);
    } catch (e) {
      setWalletError(e instanceof Error ? e.message : "Failed to load wallet");
    }
  }, [adminIdNumber, adminIdValid]);

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

  const handleChange = (role: UpahRole, value: string) => {
    setDraft((prev) => ({ ...prev, [role]: value }));
  };

  const handleSave = async (role: UpahRole) => {
    const valueRupiah = Number(draft[role]);
    if (!Number.isFinite(valueRupiah) || valueRupiah <= 0) {
      setErrorUpah("Upah harus berupa angka positif");
      return;
    }
    const valueSawitDollar = valueRupiah / 10000;
    setErrorUpah(null);
    setSavingRole(role);
    try {
      const updated = await paymentApi.updateUpah("ADMIN", { role, upahPerKg: valueSawitDollar });
      setDraft((prev) => ({ ...prev, [role]: String(updated.upahPerKg * 10000) }));
    } catch (e) {
      setErrorUpah(e instanceof Error ? e.message : "Failed to update upah");
    } finally {
      setSavingRole(null);
    }
  };

  const handlePayrollStatus = async (payrollId: number, status: PayrollStatus) => {
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
      });
      setPayrolls((prev) => prev.map((item) => (item.id === payrollId ? updated : item)));
    } catch (e) {
      setErrorPayrolls(e instanceof Error ? e.message : "Failed to update payroll");
    } finally {
      setPayrollActionId(null);
    }
  };

  const handleTopUp = async () => {
    const valueRupiah = Number(topUpAmount);
    if (!Number.isFinite(valueRupiah) || valueRupiah <= 0) {
      setWalletError("Nominal top up harus angka positif");
      return;
    }
    const valueSawitDollar = valueRupiah / 10000;
    setWalletError(null);
    setToppingUp(true);
    try {
      const updated = await paymentApi.topUp("ADMIN", valueSawitDollar);
      setWallet(updated);
      setTopUpAmount("");
    } catch (e) {
      setWalletError(e instanceof Error ? e.message : "Top up gagal");
    } finally {
      setToppingUp(false);
    }
  };

  const formatRupiah = (value: number) => currency.format(value);
  const formatSawitDollar = (value: number) => `$${sawitDollarFormat.format(value)} Sawit Dolar`;

  const statusStyles: Record<PayrollStatus, string> = {
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    ACCEPTED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f0e6] font-sans text-slate-900">
      <div className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-[#f0c06a] opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-[#4f8c6a] opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#2f3d2e] opacity-20 blur-[120px]" />

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <section className="rounded-3xl border border-[#2f3d2e]/20 bg-white/80 p-8 shadow-[0_24px_60px_-30px_rgba(47,61,46,0.6)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#4f8c6a]">Payment Module</p>
              <h1 className="mt-3 text-3xl font-semibold text-[#2f3d2e] md:text-4xl">Admin Dashboard</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Halaman untuk admin mengatur upah, approval payroll, serta top up dan wallet.
              </p>
            </div>
            <button
              className="h-fit rounded-full border border-[#2f3d2e]/30 px-4 py-2 text-sm font-medium text-[#2f3d2e] transition hover:bg-[#2f3d2e] hover:text-white"
              type="button"
              onClick={handleRefreshAll}
            >
              Refresh
            </button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-[#2f3d2e]/15 bg-white/85 p-8 shadow-[0_20px_50px_-30px_rgba(47,61,46,0.6)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-[#2f3d2e]">Upah</h2>
            </div>

            {loadingUpah ? (
              <p className="mt-6 text-sm text-slate-600">Memuat data upah...</p>
            ) : (
              <div className="mt-6 space-y-4">
                {(["BURUH", "MANDOR", "SUPIR"] as UpahRole[]).map((role) => (
                  <div
                    key={role}
                    className="rounded-2xl border border-[#2f3d2e]/10 bg-[#fdfbf7] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm font-semibold text-[#2f3d2e]">{roleLabel[role]}</p>
                      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
                        <div className="relative w-full max-w-xs">
                          <input
                            className="w-full rounded-2xl border border-[#2f3d2e]/20 bg-white px-3 py-2 text-sm font-medium text-[#2f3d2e] shadow-sm outline-none transition focus:border-[#4f8c6a]"
                            type="text"
                            inputMode="decimal"
                            value={draft[role]}
                            onChange={(event) => handleChange(role, event.target.value)}
                            placeholder="Upah per kg (Rp)"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                        </div>
                        <button
                          className="rounded-2xl bg-[#2f3d2e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f2a1e] disabled:cursor-not-allowed disabled:opacity-60"
                          type="button"
                          onClick={() => handleSave(role)}
                          disabled={savingRole === role}
                        >
                          {savingRole === role ? "Menyimpan..." : "Simpan"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errorUpah && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorUpah}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[#2f3d2e]/15 bg-white/85 p-8 shadow-[0_20px_40px_-30px_rgba(47,61,46,0.6)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#2f3d2e]">Wallet Admin</h2>
            </div>

            <div className="mt-5 rounded-2xl border border-[#2f3d2e]/10 bg-[#fdfbf7] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Saldo Saat Ini</p>
              <p className="mt-2 text-2xl font-semibold text-[#2f3d2e]">
                {wallet ? formatRupiah(wallet.balance * 10000) : "-"}
              </p>
              <p className="text-sm text-slate-500">{wallet ? formatSawitDollar(wallet.balance) : ""}</p>
            </div>

            <div className="mt-6">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Top Up</label>
              <div className="mt-3 flex flex-col gap-3">
                <input
                  className="w-full rounded-2xl border border-[#2f3d2e]/20 bg-white px-4 py-2 text-sm text-[#2f3d2e] outline-none"
                  placeholder="Nominal Rupiah"
                  type="text"
                  inputMode="decimal"
                  value={topUpAmount}
                  onChange={(event) => setTopUpAmount(event.target.value)}
                />
                <button
                  className="rounded-2xl bg-[#2f3d2e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  type="button"
                  onClick={handleTopUp}
                  disabled={toppingUp}
                >
                  {toppingUp ? "Memproses..." : "Top Up"}
                </button>
              </div>
            </div>

            {walletError && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {walletError}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6">
          <div className="rounded-3xl border border-[#2f3d2e]/15 bg-white/90 p-8 shadow-[0_20px_50px_-30px_rgba(47,61,46,0.6)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-[#2f3d2e]">Payroll</h2>
            </div>

            {loadingPayrolls ? (
              <p className="mt-6 text-sm text-slate-600">Memuat payroll...</p>
            ) : payrolls.length === 0 ? (
              <p className="mt-6 text-sm text-slate-600">Belum ada payroll.</p>
            ) : (
              <div className="mt-6 space-y-4">
                {payrolls.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[#2f3d2e]/10 bg-white p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-semibold text-[#2f3d2e]">Payroll #{item.id}</p>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[item.status]}`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">User ID: {item.userId}</p>
                        <p className="text-sm text-slate-600">Amount: {formatRupiah(item.amount * 10000)}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleString("id-ID")}
                        </p>
                      </div>
                      {item.status === "PENDING" ? (
                        <div className="flex w-full flex-col gap-3 md:w-auto">
                          <input
                            className="w-full rounded-2xl border border-[#2f3d2e]/20 bg-white px-4 py-2 text-sm text-[#2f3d2e] outline-none"
                            placeholder="Alasan penolakan"
                            value={rejectionNote[item.id] ?? ""}
                            onChange={(event) =>
                              setRejectionNote((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                          />
                          <div className="flex gap-2">
                            <button
                              className="flex-1 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                              type="button"
                              onClick={() => handlePayrollStatus(item.id, "ACCEPTED")}
                              disabled={payrollActionId === item.id}
                            >
                              Accept
                            </button>
                            <button
                              className="flex-1 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                              type="button"
                              onClick={() => handlePayrollStatus(item.id, "REJECTED")}
                              disabled={payrollActionId === item.id}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">Status sudah final.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errorPayrolls && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorPayrolls}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
