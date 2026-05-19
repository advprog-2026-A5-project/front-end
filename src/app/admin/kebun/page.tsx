"use client";

import { authApi } from "@/api/authApi";
import { kebunApi } from "@/api/kebunApi";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/auth/AuthContext";
import type { Kebun } from "@/types/kebun";
import { useEffect, useMemo, useState } from "react";

const emptyKebun: Kebun = {
  kode: "",
  nama: "",
  luas: 0,
  titik1: { x: 0, y: 0 },
  titik2: { x: 0, y: 0 },
  titik3: { x: 0, y: 0 },
  titik4: { x: 0, y: 0 },
  mandorId: null,
};

export default function AdminKebunPage() {
  const { token } = useAuth();
  const [kebunList, setKebunList] = useState<Kebun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Kebun>(emptyKebun);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [mandors, setMandors] = useState<Array<{ id: number; nama: string }>>([]);

  const title = useMemo(() => (editingCode ? `Edit Kebun ${editingCode}` : "Create Kebun"), [editingCode]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kebunData, userData] = await Promise.all([
        kebunApi.list(),
        token ? authApi.users(token) : Promise.resolve([]),
      ]);
      setKebunList(kebunData);
      setMandors(userData.filter((u) => u.role === "MANDOR").map((u) => ({ id: u.id, nama: u.nama })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load kebun data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editingCode) {
        await kebunApi.update(editingCode, form);
      } else {
        await kebunApi.create(form);
      }
      setForm(emptyKebun);
      setEditingCode(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    }
  };

  const onEdit = (kebun: Kebun) => {
    setForm(kebun);
    setEditingCode(kebun.kode);
  };

  const onDelete = async (code: string) => {
    if (!confirm(`Delete kebun ${code}?`)) return;
    try {
      await kebunApi.remove(code);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <AuthGuard roles={["ADMIN"]}>
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Kebun Management</h2>
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <form className="grid grid-cols-1 gap-2 rounded border p-3 md:grid-cols-2" onSubmit={submit}>
          <h3 className="md:col-span-2 text-sm font-semibold">{title}</h3>
          <input className="rounded border p-2" placeholder="Kode Kebun" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value })} disabled={!!editingCode} required />
          <input className="rounded border p-2" placeholder="Nama Kebun" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
          <input className="rounded border p-2" placeholder="Luas (hektare)" type="number" value={form.luas} onChange={(e) => setForm({ ...form, luas: Number(e.target.value) })} required />
          <select className="rounded border p-2" value={form.mandorId ?? ""} onChange={(e) => setForm({ ...form, mandorId: e.target.value ? Number(e.target.value) : null })}>
            <option value="">No Mandor</option>
            {mandors.map((m) => <option key={m.id} value={m.id}>{m.nama} ({m.id})</option>)}
          </select>
          <button className="md:col-span-2 rounded bg-green-700 px-3 py-2 text-white" type="submit">{editingCode ? "Update Kebun" : "Create Kebun"}</button>
        </form>

        {loading ? <p>Loading...</p> : (
          <div className="overflow-auto rounded border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-left">Kode</th><th className="p-2 text-left">Nama</th><th className="p-2 text-left">Luas</th><th className="p-2 text-left">Mandor</th><th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kebunList.map((k) => (
                  <tr key={k.kode} className="border-t">
                    <td className="p-2">{k.kode}</td><td className="p-2">{k.nama}</td><td className="p-2">{k.luas}</td><td className="p-2">{k.mandorId ?? "-"}</td>
                    <td className="p-2 space-x-2">
                      <button className="rounded bg-amber-600 px-2 py-1 text-white" onClick={() => onEdit(k)}>Edit</button>
                      <button className="rounded bg-red-600 px-2 py-1 text-white" onClick={() => onDelete(k.kode)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
