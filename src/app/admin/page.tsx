"use client";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";

export default function AdminPage() {
  return (
    <AuthGuard roles={["ADMIN"]}>
      <AppShell>
        <h2 className="text-xl font-semibold">Admin Workspace</h2>
        <p className="mt-2 text-sm text-slate-600">Manage users, buruh-mandor assignments, and kebun data from this section.</p>
      </AppShell>
    </AuthGuard>
  );
}
