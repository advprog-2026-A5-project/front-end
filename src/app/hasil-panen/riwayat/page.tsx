"use client";

import { hasilPanenApi } from "@/api/hasilPanenApi";
import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { HarvestStatusBadge } from "@/components/hasil-panen/HarvestStatusBadge";
import {
  HarvestEmptyState,
  HarvestErrorState,
  HarvestLoadingState,
} from "@/components/hasil-panen/HarvestStates";
import {
  formatHarvestDate,
  mapHarvestErrorMessage,
  normalizeHarvestStatus,
} from "@/components/hasil-panen/harvestHelpers";
import type { HarvestStatus, MyHarvestItem } from "@/types/harvest";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const STATUS_OPTIONS: Array<{ value: "" | HarvestStatus; label: string }> = [
  { value: "", label: "Semua" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
];

export default function HarvestHistoryPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<MyHarvestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"" | HarvestStatus>("");

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await hasilPanenApi.myHarvests(token, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: status || undefined,
      });
      setItems(response);
    } catch (historyError) {
      setError(
        mapHarvestErrorMessage(
          historyError,
          "Gagal memuat riwayat laporan panen.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate, status, token]);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      loadHistory().catch(() => {});
    }, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [loadHistory]);

  return (
    <AuthGuard roles={["BURUH"]}>
      <AppShell>
        <div className="space-y-5">
          <section className="rounded-3xl border border-emerald-500/25 bg-slate-900/85 p-6">
            <h2 className="text-2xl font-semibold text-slate-100">Riwayat Hasil Panen</h2>
            <p className="mt-2 text-sm text-slate-400">Lihat status laporan panen Anda dan detail validasi mandor.</p>
          </section>

          <section className="grid gap-3 rounded-3xl border border-slate-700 bg-slate-900/80 p-5 md:grid-cols-4">
            <label className="text-sm text-slate-200">
              Tanggal mulai
              <input
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                data-testid="history-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label className="text-sm text-slate-200">
              Tanggal akhir
              <input
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                data-testid="history-end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
            <label className="text-sm text-slate-200">
              Status
              <select
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                data-testid="history-status-filter"
                value={status}
                onChange={(event) => setStatus(normalizeHarvestStatus(event.target.value))}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button
                className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                data-testid="history-apply-filter"
                type="button"
                onClick={() => {
                  loadHistory().catch(() => {});
                }}
              >
                Terapkan
              </button>
            </div>
          </section>

          {loading && <HarvestLoadingState text="Memuat riwayat laporan panen..." />}
          {!loading && error && (
            <HarvestErrorState
              text={error}
              onRetry={() => {
                loadHistory().catch(() => {});
              }}
            />
          )}
          {!loading && !error && items.length === 0 && (
            <HarvestEmptyState text="Belum ada laporan hasil panen." />
          )}

          {!loading && !error && items.length > 0 && (
            <section className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/80">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-800 text-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">Tanggal Panen</th>
                    <th className="px-4 py-3 text-left">Kilogram</th>
                    <th className="px-4 py-3 text-left">Berita</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Alasan Ditolak</th>
                    <th className="px-4 py-3 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr className="border-t border-slate-700 text-slate-100" key={item.harvestId}>
                      <td className="px-4 py-3">{formatHarvestDate(item.harvestDate)}</td>
                      <td className="px-4 py-3">{item.kilogram ?? "-"}</td>
                      <td className="px-4 py-3">{item.reportText?.slice(0, 80) ?? "-"}</td>
                      <td className="px-4 py-3">
                        <HarvestStatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-red-200">{item.rejectionReason ?? "-"}</td>
                      <td className="px-4 py-3">
                        <Link
                          className="rounded-lg border border-slate-500 px-3 py-1.5 text-xs hover:bg-slate-800"
                          href={`/hasil-panen/${item.harvestId}`}
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
