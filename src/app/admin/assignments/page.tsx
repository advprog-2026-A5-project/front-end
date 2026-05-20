"use client";

import { authApi } from "@/api/authApi";
import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import type { UserModel } from "@/types/auth";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function AdminAssignmentsPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserModel[]>([]);
  const [selectedBuruh, setSelectedBuruh] = useState<number | "">("");
  const [selectedMandor, setSelectedMandor] = useState<number | "">("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const data = await authApi.users(token);
    setUsers(data);
  }, [token]);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      load().catch(() => {});
    }, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [load]);

  const buruhs = useMemo(() => users.filter((user) => user.role === "BURUH"), [users]);
  const mandors = useMemo(() => users.filter((user) => user.role === "MANDOR"), [users]);

  const assign = async () => {
    if (!token || !selectedBuruh || !selectedMandor) return;
    setMessage(null);
    setError(null);
    try {
      const result = await authApi.assignBuruhToMandor(token, Number(selectedBuruh), Number(selectedMandor));
      setMessage(result.message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assign failed");
    }
  };

  const unassign = async () => {
    if (!token || !selectedBuruh) return;
    setMessage(null);
    setError(null);
    try {
      const result = await authApi.unassignBuruh(token, Number(selectedBuruh));
      setMessage(result.message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unassign failed");
    }
  };

  return (
    <AuthGuard roles={["ADMIN"]}>
      <AppShell>
        <h2 className="text-xl font-semibold">Buruh - Mandor Assignments</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <select className="rounded border px-2 py-1" value={selectedBuruh} onChange={(e) => setSelectedBuruh(Number(e.target.value))}>
            <option value="">Select Buruh</option>
            {buruhs.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nama} ({b.id})
              </option>
            ))}
          </select>
          <select className="rounded border px-2 py-1" value={selectedMandor} onChange={(e) => setSelectedMandor(Number(e.target.value))}>
            <option value="">Select Mandor</option>
            {mandors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nama} ({m.id})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button className="rounded bg-green-700 px-3 py-1 text-white" onClick={assign} type="button">
              Assign
            </button>
            <button className="rounded bg-amber-600 px-3 py-1 text-white" onClick={unassign} type="button">
              Unassign
            </button>
          </div>
        </div>
        {message && <p className="mt-3 rounded bg-green-50 p-2 text-sm text-green-700">{message}</p>}
        {error && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="border px-2 py-1">Buruh ID</th>
                <th className="border px-2 py-1">Buruh</th>
                <th className="border px-2 py-1">Mandor</th>
              </tr>
            </thead>
            <tbody>
              {buruhs.map((b) => (
                <tr key={b.id}>
                  <td className="border px-2 py-1">{b.id}</td>
                  <td className="border px-2 py-1">{b.nama}</td>
                  <td className="border px-2 py-1">{b.mandor?.nama ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
