"use client";

import { kebunApi } from "@/api/kebunApi";
import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function AdminPage() {
  const { currentUser } = useAuth();
  const [summary, setSummary] = useState({ totalKebun: 0, kebunWithMandor: 0, totalSupirAssigned: 0 });

  const loadSummary = useCallback(async () => {
    try {
      const kebunList = await kebunApi.list();
      const details = await Promise.all(kebunList.map((item) => kebunApi.getDetail(item.code).catch(() => null)));
      const kebunWithMandor = details.filter((detail) => detail?.mandorId).length;
      const totalSupirAssigned = details.reduce((acc, detail) => acc + (detail?.supirIds.length ?? 0), 0);
      setSummary({
        totalKebun: kebunList.length,
        kebunWithMandor,
        totalSupirAssigned,
      });
    } catch {
      setSummary({ totalKebun: 0, kebunWithMandor: 0, totalSupirAssigned: 0 });
    }
  }, []);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      loadSummary().catch(() => {});
    }, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [loadSummary]);

  return (
    <AuthGuard roles={["ADMIN"]}>
      <AppShell>
        <div className="space-y-6">
          <section className="rounded-3xl border border-emerald-500/25 bg-slate-900/85 p-6 shadow-[0_20px_70px_-35px_rgba(16,185,129,0.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-100">MySawit Admin</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Kelola data kebun dan assignment operasional mandor serta supir untuk setiap area perkebunan.
                </p>
              </div>
              {currentUser && (
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm">
                  <p className="font-semibold text-slate-100">{currentUser.nama}</p>
                  <p className="text-slate-300">{currentUser.email}</p>
                  <p className="text-emerald-300">Admin Utama</p>
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            <SummaryCard label="Total Kebun" value={summary.totalKebun} />
            <SummaryCard label="Kebun dengan Mandor" value={summary.kebunWithMandor} />
            <SummaryCard label="Total Supir Assigned" value={summary.totalSupirAssigned} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <FeatureCard
              title="Manajemen Kebun"
              description="Kelola data kebun, titik koordinat, luas area, dan validasi tumpang tindih batas kebun."
              ctaLabel="Buka Manajemen Kebun"
              href="/admin/kebun"
            />
            <FeatureCard
              title="Assignment Kebun"
              description="Lihat dan atur penugasan mandor serta supir berdasarkan kebun yang dipilih."
              ctaLabel="Lihat Assignment"
              href="/admin/assignments"
            />
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}

function FeatureCard({
  title,
  description,
  ctaLabel,
  href,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
      <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
      >
        {ctaLabel}
      </Link>
    </article>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-emerald-300">{value}</p>
    </article>
  );
}
