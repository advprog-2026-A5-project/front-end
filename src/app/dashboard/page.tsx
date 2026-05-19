"use client";

import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";

export default function DashboardPage() {
  const { currentUser } = useAuth();

  return (
    <AuthGuard>
      <AppShell>
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="mt-2 text-sm text-slate-600">Welcome, {currentUser?.nama}. Use the sidebar for role-based flows.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Card title="Authentication" subtitle="Login/logout and role-based access" />
          <Card title="Kebun Management" subtitle="Create/list/update/delete kebun data" />
          <Card title="Harvest Validation" subtitle="Buruh submit, Mandor approve/reject, eligibility check" />
        </div>
      </AppShell>
    </AuthGuard>
  );
}

function Card({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded border bg-slate-50 p-3">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}
