"use client";

import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import Link from "next/link";

export default function HasilPanenHomePage() {
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6">
          <section className="rounded-3xl border border-emerald-500/25 bg-slate-900/85 p-6 shadow-[0_20px_70px_-35px_rgba(16,185,129,0.35)]">
            <h2 className="text-3xl font-bold tracking-tight text-slate-100">Manajemen Hasil Panen</h2>
            <p className="mt-2 text-sm text-slate-400">
              Kelola pelaporan panen harian buruh, proses validasi mandor, dan pantau status laporan panen.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {role === "BURUH" && (
              <>
                <FeatureCard
                  href="/hasil-panen/lapor"
                  title="Lapor Panen"
                  description="Kirim laporan panen hari ini dengan bukti foto."
                  cta="Buat Laporan"
                />
                <FeatureCard
                  href="/hasil-panen/riwayat"
                  title="Riwayat Panen"
                  description="Lihat status laporan panen Anda."
                  cta="Lihat Riwayat"
                />
              </>
            )}

            {role === "MANDOR" && (
              <FeatureCard
                href="/hasil-panen/mandor"
                title="Dashboard Review Mandor"
                description="Validasi laporan panen buruh di bawah pengawasan Anda."
                cta="Buka Dashboard"
              />
            )}

            {(role === "ADMIN" || role === "SUPIR") && (
              <FeatureCard
                href="/hasil-panen"
                title="Monitoring Hasil Panen"
                description="Pantau data laporan panen dan status validasi."
                cta="Lihat Data"
              />
            )}
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}

function FeatureCard({
  href,
  title,
  description,
  cta,
}: Readonly<{
  href: string;
  title: string;
  description: string;
  cta: string;
}>) {
  return (
    <article className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
      <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      <Link
        className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        href={href}
      >
        {cta}
      </Link>
    </article>
  );
}
