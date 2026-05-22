"use client";

import { hasilPanenApi } from "@/api/hasilPanenApi";
import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { HarvestStatusBadge } from "@/components/hasil-panen/HarvestStatusBadge";
import {
  HarvestErrorState,
  HarvestLoadingState,
} from "@/components/hasil-panen/HarvestStates";
import { formatDateTime, formatHarvestDate } from "@/components/hasil-panen/harvestHelpers";
import type { HarvestDetail } from "@/types/harvest";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function HarvestDetailPage() {
  const { token } = useAuth();
  const params = useParams<{ id: string }>();
  const harvestId = params.id;
  const [detail, setDetail] = useState<HarvestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !harvestId) return;
    const timeoutId = globalThis.setTimeout(async () => {
      try {
        setLoading(true);
        const response = await hasilPanenApi.getHarvestDetail(token, harvestId);
        setDetail(response);
        setError(null);
      } catch (detailError) {
        setError(
          detailError instanceof Error
            ? detailError.message
            : "Gagal memuat detail laporan panen.",
        );
      } finally {
        setLoading(false);
      }
    }, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [harvestId, token]);

  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-100">Detail Laporan Panen</h2>
            <Link
              className="rounded-xl border border-slate-500 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              href="/hasil-panen/riwayat"
            >
              Kembali
            </Link>
          </div>

          {loading && <HarvestLoadingState text="Memuat detail laporan..." />}
          {!loading && error && <HarvestErrorState text={error} />}

          {!loading && !error && detail && (
            <>
              <section className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">ID Laporan</p>
                    <p className="font-mono text-sm text-slate-200">{detail.harvestId}</p>
                  </div>
                  <HarvestStatusBadge status={detail.status} />
                </div>

                <div className="mt-5 grid gap-4 text-sm md:grid-cols-2">
                  <DetailItem label="Tanggal panen" value={formatHarvestDate(detail.harvestDate)} />
                  <DetailItem label="Nama Buruh" value={detail.buruhName || "-"} />
                  <DetailItem label="Buruh ID" value={String(detail.buruhId)} />
                  <DetailItem label="Kode Kebun" value={detail.kebunCode || "-"} />
                  <DetailItem label="Kilogram" value={String(detail.kilogram)} />
                  <DetailItem label="Dibuat" value={formatDateTime(detail.createdAt)} />
                  <DetailItem label="Disetujui pada" value={formatDateTime(detail.approvedAt)} />
                  <DetailItem label="Ditolak pada" value={formatDateTime(detail.rejectedAt)} />
                </div>

                <div className="mt-5">
                  <p className="text-sm text-slate-400">Berita hasil panen</p>
                  <p className="mt-2 rounded-2xl border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-200">
                    {detail.reportText}
                  </p>
                </div>

                {detail.rejectionReason && (
                  <div className="mt-4 rounded-xl border border-red-300/30 bg-red-500/10 p-3 text-sm text-red-200">
                    <p className="font-semibold">Alasan penolakan</p>
                    <p>{detail.rejectionReason}</p>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
                <h3 className="text-lg font-semibold text-slate-100">Galeri Bukti Foto</h3>
                {detail.photos.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">Tidak ada foto bukti tersedia.</p>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {detail.photos.map((photo, index) => (
                      <a
                        className="group overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/70"
                        href={photo}
                        key={`${photo}-${index}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={`Bukti panen ${index + 1}`}
                          className="h-44 w-full object-cover transition group-hover:scale-105"
                          src={photo}
                        />
                      </a>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
      <p className="text-slate-400">{label}</p>
      <p className="mt-1 text-slate-200">{value}</p>
    </div>
  );
}
