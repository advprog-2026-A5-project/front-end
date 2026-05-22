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
import { formatHarvestDate, mapHarvestErrorMessage } from "@/components/hasil-panen/harvestHelpers";
import type { MandorHarvestItem } from "@/types/harvest";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function MandorBuruhHarvestPage() {
  const { token } = useAuth();
  const params = useParams<{ buruhId: string }>();
  const buruhId = params.buruhId;
  const [harvestDate, setHarvestDate] = useState("");
  const [items, setItems] = useState<MandorHarvestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!token || !buruhId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await hasilPanenApi.mandorBuruhHarvests(token, buruhId, {
        harvestDate: harvestDate || undefined,
      });
      setItems(response);
    } catch (historyError) {
      setError(mapHarvestErrorMessage(historyError, "Gagal memuat riwayat panen buruh."));
    } finally {
      setLoading(false);
    }
  }, [buruhId, harvestDate, token]);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      loadHistory().catch(() => {});
    }, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [loadHistory]);

  const buruhName = items[0]?.buruhName;

  return (
    <AuthGuard roles={["MANDOR"]}>
      <AppShell>
        <div className="space-y-5">
          <section className="rounded-3xl border border-emerald-500/25 bg-slate-900/85 p-6">
            <h2 className="text-2xl font-semibold text-slate-100">Riwayat Panen Buruh</h2>
            <p className="mt-2 text-sm text-slate-400">
              {buruhName ? `Buruh: ${buruhName}` : "Lihat riwayat laporan panen buruh terpilih."}
            </p>
            <p className="mt-1 text-xs text-slate-500">ID Buruh: {buruhId}</p>
          </section>

          <section className="flex flex-wrap items-end gap-3 rounded-3xl border border-slate-700 bg-slate-900/80 p-5">
            <label className="text-sm text-slate-200">
              Filter tanggal panen
              <input
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                data-testid="mandor-buruh-date-filter"
                type="date"
                value={harvestDate}
                onChange={(event) => setHarvestDate(event.target.value)}
              />
            </label>
            <button
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              type="button"
              onClick={() => {
                loadHistory().catch(() => {});
              }}
            >
              Terapkan
            </button>
            <Link
              className="rounded-xl border border-slate-500 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              href="/hasil-panen/mandor"
            >
              Kembali ke Dashboard
            </Link>
          </section>

          {loading && <HarvestLoadingState text="Memuat riwayat panen buruh..." />}
          {!loading && error && <HarvestErrorState onRetry={() => void loadHistory()} text={error} />}
          {!loading && !error && items.length === 0 && (
            <HarvestEmptyState text="Belum ada laporan panen untuk buruh ini." />
          )}

          {!loading && !error && items.length > 0 && (
            <section className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/80">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-800 text-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">Tanggal Panen</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Alasan Ditolak</th>
                    <th className="px-4 py-3 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr className="border-t border-slate-700 text-slate-100" key={item.harvestId}>
                      <td className="px-4 py-3">{formatHarvestDate(item.harvestDate)}</td>
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
