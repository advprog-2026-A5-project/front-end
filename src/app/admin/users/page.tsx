"use client";

import { authApi } from "@/api/authApi";
import { ApiError } from "@/api/httpClient";
import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import type { Role, UserModel } from "@/types/auth";
import { useCallback, useEffect, useState } from "react";

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", nama: "", password: "pass123", role: "BURUH" as Role });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.users(token);
      setUsers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const createTestUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await authApi.signUp({
        username: form.email.split("@")[0],
        email: form.email,
        nama: form.nama,
        password: form.password,
        role: form.role,
        nomorSertifikasiMandor: form.role === "MANDOR" ? `CERT-${Date.now()}` : undefined,
      });
      setMessage("User created");
      await load();
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.status} ${e.message}` : e instanceof Error ? e.message : "Create failed";
      setError(msg);
    }
  };

  return (
    <AuthGuard roles={["ADMIN"]}>
      <AppShell>
        <h2 className="text-xl font-semibold text-slate-100">Users</h2>
        <p className="mt-1 text-sm text-slate-300">Data fetched from Auth service `/api/users`.</p>
        <form className="mt-4 grid gap-2 rounded-xl border border-slate-700 bg-slate-950/50 p-3 md:grid-cols-5" onSubmit={createTestUser}>
          <input
            className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
            placeholder="nama"
            required
            value={form.nama}
            onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))}
          />
          <input
            className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
            placeholder="email"
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <input
            className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
            placeholder="password"
            required
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          <select
            className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Role }))}
          >
            <option value="BURUH">BURUH</option>
            <option value="MANDOR">MANDOR</option>
            <option value="SUPIR">SUPIR</option>
          </select>
          <button className="rounded bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-500" type="submit">
            Create test user
          </button>
        </form>
        {message && <p className="mt-3 rounded border border-emerald-300/20 bg-emerald-500/10 p-2 text-sm text-emerald-200">{message}</p>}
        {error && <p className="mt-3 rounded border border-red-300/20 bg-red-500/10 p-2 text-sm text-red-200">{error}</p>}
        {loading ? (
          <p className="mt-4 text-slate-300">Loading users...</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-slate-200">
                <tr>
                  <th className="border px-2 py-1">ID</th>
                  <th className="border px-2 py-1">Nama</th>
                  <th className="border px-2 py-1">Email</th>
                  <th className="border px-2 py-1">Role</th>
                  <th className="border px-2 py-1">Mandor</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="text-slate-100">
                    <td className="border px-2 py-1">{user.id}</td>
                    <td className="border px-2 py-1">{user.nama}</td>
                    <td className="border px-2 py-1">{user.email}</td>
                    <td className="border px-2 py-1">{user.role}</td>
                    <td className="border px-2 py-1">{user.mandor?.nama ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
