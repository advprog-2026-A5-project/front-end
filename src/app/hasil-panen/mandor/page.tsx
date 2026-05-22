"use client";

import { hasilPanenApi } from "@/api/hasilPanenApi";
import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { HarvestDecisionModal } from "@/components/hasil-panen/HarvestDecisionModal";
import { HarvestStatusBadge } from "@/components/hasil-panen/HarvestStatusBadge";
import {
  HarvestEmptyState,
  HarvestErrorState,
  HarvestLoadingState,
} from "@/components/hasil-panen/HarvestStates";
import { formatHarvestDate, mapHarvestErrorMessage } from "@/components/hasil-panen/harvestHelpers";
import type { HarvestDetail, MandorHarvestItem } from "@/types/harvest";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ModalState =
  | { open: false }
  | { open: true; mode: "approve" | "reject"; harvestId: string };

export default function MandorHarvestDashboardPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<MandorHarvestItem[]>([]);
  const [detailsById, setDetailsById] = useState<Record<string, HarvestDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [harvestDate, setHarvestDate] = useState("");
  const [buruhName, setBuruhName] = useState("");
  const [modalState, setModalState] = useState<ModalState>({ open: false });
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const activeMode = modalState.open ? modalState.mode : "approve";

  const hydrateDetails = useCallback(
    async (reports: MandorHarvestItem[]) => {
      if (!token || reports.length === 0) {
        setDetailsById({});
        return;
      }
      const details = await Promise.all(
        reports.map(async (report) => {
          try {
            const detail = await hasilPanenApi.getHarvestDetail(token, report.harvestId);
            return [report.harvestId, detail] as const;
          } catch {
            return null;
          }
        }),
      );
      const mapped: Record<string, HarvestDetail> = {};
      details.forEach((entry) => {
        if (!entry) return;
        mapped[entry[0]] = entry[1];
      });
      setDetailsById(mapped);
    },
    [token],
  );

  const loadReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const reports = await hasilPanenApi.mandorHarvests(token, {
        harvestDate: harvestDate || undefined,
        buruhName: buruhName || undefined,
      });
      setItems(reports);
      await hydrateDetails(reports);
    } catch (loadError) {
      setError(mapHarvestErrorMessage(loadError, "Gagal memuat dashboard review panen."));
    } finally {
      setLoading(false);
    }
  }, [buruhName, harvestDate, hydrateDetails, token]);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      loadReports().catch(() => {});
    }, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [loadReports]);

  const submitDecision = async (reason?: string) => {
    if (!token || !modalState.open) return;
    setSubmittingDecision(true);
    setFeedback(null);
    try {
      if (modalState.mode === "approve") {
        await hasilPanenApi.approve(token, modalState.harvestId);
        setFeedback("Laporan panen berhasil disetujui.");
      } else {
        await hasilPanenApi.reject(token, modalState.harvestId, reason ?? "");
        setFeedback("Laporan panen berhasil ditolak.");
      }
      setModalState({ open: false });
      await loadReports();
    } catch (submitError) {
      setError(mapHarvestErrorMessage(submitError, "Gagal memproses validasi panen."));
    } finally {
      setSubmittingDecision(false);
    }
  };

  return (
    <AuthGuard roles={["MANDOR"]}>
      <AppShell>
        <div className="space-y-5">
          <section className="rounded-3xl border border-emerald-500/25 bg-slate-900/85 p-6">
            <h2 className="text-2xl font-semibold text-slate-100">Dashboard Review Panen Mandor</h2>
            <p className="mt-2 text-sm text-slate-400">
              Tinjau laporan panen dari buruh yang berada di bawah pengawasan Anda.
            </p>
          </section>

          <section className="grid gap-3 rounded-3xl border border-slate-700 bg-slate-900/80 p-5 md:grid-cols-4">
            <label className="text-sm text-slate-200">
              Tanggal panen
              <input
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                data-testid="mandor-harvest-date-filter"
                type="date"
                value={harvestDate}
                onChange={(event) => setHarvestDate(event.target.value)}
              />
            </label>
            <label className="text-sm text-slate-200">
              Nama Buruh
              <input
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                data-testid="mandor-buruh-name-filter"
                placeholder="Cari nama buruh"
                value={buruhName}
                onChange={(event) => setBuruhName(event.target.value)}
              />
            </label>
            <div className="flex items-end">
              <button
                className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                type="button"
                onClick={() => {
                  loadReports().catch(() => {});
                }}
              >
                Terapkan
              </button>
            </div>
            <div className="flex items-end">
              <button
                className="w-full rounded-xl border border-slate-500 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                type="button"
                onClick={() => {
                  setHarvestDate("");
                  setBuruhName("");
                }}
              >
                Reset
              </button>
            </div>
          </section>

          {feedback && (
            <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {feedback}
            </div>
          )}
          {error && <HarvestErrorState text={error} onRetry={() => void loadReports()} />}
          {loading && <HarvestLoadingState text="Memuat daftar laporan panen..." />}
          {!loading && !error && items.length === 0 && (
            <HarvestEmptyState text="Belum ada laporan panen dari buruh Anda." />
          )}

          {!loading && !error && items.length > 0 && (
            <section className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/80">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-800 text-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">Buruh</th>
                    <th className="px-4 py-3 text-left">Kode Kebun</th>
                    <th className="px-4 py-3 text-left">Tanggal</th>
                    <th className="px-4 py-3 text-left">Kilogram</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Foto</th>
                    <th className="px-4 py-3 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const detail = detailsById[item.harvestId];
                    return (
                      <tr className="border-t border-slate-700 text-slate-100" key={item.harvestId}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.buruhName}</div>
                          <div className="text-xs text-slate-400">ID: {item.buruhId}</div>
                        </td>
                        <td className="px-4 py-3">{detail?.kebunCode ?? item.kebunCode ?? "-"}</td>
                        <td className="px-4 py-3">{formatHarvestDate(item.harvestDate)}</td>
                        <td className="px-4 py-3">{detail?.kilogram ?? item.kilogram ?? "-"}</td>
                        <td className="px-4 py-3">
                          <HarvestStatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3">{detail?.photos?.length ?? item.photos?.length ?? 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              className="rounded-lg border border-slate-500 px-3 py-1.5 text-xs hover:bg-slate-800"
                              href={`/hasil-panen/${item.harvestId}`}
                            >
                              Detail
                            </Link>
                            <Link
                              className="rounded-lg border border-slate-500 px-3 py-1.5 text-xs hover:bg-slate-800"
                              href={`/hasil-panen/mandor/buruh/${item.buruhId}`}
                            >
                              Profil Buruh
                            </Link>
                            {item.status === "PENDING" && (
                              <>
                                <button
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                                  data-testid={`approve-button-${item.harvestId}`}
                                  type="button"
                                  onClick={() =>
                                    setModalState({
                                      open: true,
                                      mode: "approve",
                                      harvestId: item.harvestId,
                                    })
                                  }
                                >
                                  Setujui
                                </button>
                                <button
                                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                                  data-testid={`reject-button-${item.harvestId}`}
                                  type="button"
                                  onClick={() =>
                                    setModalState({
                                      open: true,
                                      mode: "reject",
                                      harvestId: item.harvestId,
                                    })
                                  }
                                >
                                  Tolak
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}
        </div>

        <HarvestDecisionModal
          key={modalState.open ? `${modalState.harvestId}-${modalState.mode}` : "closed"}
          description={
            activeMode === "approve"
              ? "Pastikan data laporan panen sudah sesuai sebelum disetujui."
              : "Tuliskan alasan penolakan laporan panen."
          }
          loading={submittingDecision}
          mode={activeMode}
          open={modalState.open}
          title={activeMode === "approve" ? "Setujui laporan panen?" : "Tolak laporan panen?"}
          onClose={() => setModalState({ open: false })}
          onSubmit={submitDecision}
        />
      </AppShell>
    </AuthGuard>
  );
}
