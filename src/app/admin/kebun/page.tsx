"use client";

import { authApi } from "@/api/authApi";
import { kebunApi } from "@/api/kebunApi";
import { useAuth } from "@/auth/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import type { UserModel } from "@/types/auth";
import type { CoordinatePoint, Kebun, KebunDetail } from "@/types/kebun";
import { useCallback, useEffect, useMemo, useState } from "react";

interface PointInput {
  x: string;
  y: string;
}

interface KebunForm {
  code: string;
  name: string;
  luas: string;
  coordinates: PointInput[];
}

const emptyKebunForm: KebunForm = {
  code: "",
  name: "",
  luas: "",
  coordinates: [
    { x: "", y: "" },
    { x: "", y: "" },
    { x: "", y: "" },
    { x: "", y: "" },
  ],
};

const parseNumber = (value: string): number | null => {
  if (value.trim() === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const toPointInputs = (coordinates: CoordinatePoint[] | undefined): PointInput[] => {
  const source = coordinates ?? [];
  const normalized = source.slice(0, 4).map((point) => ({
    x: String(point.x),
    y: String(point.y),
  }));
  while (normalized.length < 4) normalized.push({ x: "", y: "" });
  return normalized;
};

export default function AdminKebunPage() {
  const { token } = useAuth();
  const [kebunList, setKebunList] = useState<Kebun[]>([]);
  const [users, setUsers] = useState<UserModel[]>([]);
  const [detail, setDetail] = useState<KebunDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [filters, setFilters] = useState({ name: "", code: "" });
  const [activeFilters, setActiveFilters] = useState({ name: "", code: "" });

  const [form, setForm] = useState<KebunForm>(emptyKebunForm);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const [mandorToAssign, setMandorToAssign] = useState("");
  const [replacementMandorKebunCode, setReplacementMandorKebunCode] = useState("");
  const [supirToAssign, setSupirToAssign] = useState("");
  const [supirToReassign, setSupirToReassign] = useState("");
  const [replacementSupirKebunCode, setReplacementSupirKebunCode] = useState("");
  const [supirNameFilter, setSupirNameFilter] = useState("");

  const title = useMemo(() => (editingCode ? `Edit Kebun ${editingCode}` : "Create Kebun"), [editingCode]);

  const parsedFormPoints = useMemo(
    () =>
      form.coordinates.map((point) => ({
        x: parseNumber(point.x),
        y: parseNumber(point.y),
      })),
    [form.coordinates],
  );

  const validDraftPoints = useMemo(
    () =>
      parsedFormPoints
        .filter((point): point is { x: number; y: number } => point.x !== null && point.y !== null)
        .map((point) => ({ x: point.x, y: point.y })),
    [parsedFormPoints],
  );

  const loadUsers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await authApi.users(token);
      setUsers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    }
  }, [token]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const kebunData = await kebunApi.list(activeFilters);
      setKebunList(kebunData);
      if (selectedCode && !kebunData.some((k) => k.code === selectedCode)) {
        setSelectedCode(null);
        setDetail(null);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load kebun data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [activeFilters, selectedCode]);

  const loadDetail = useCallback(async () => {
    if (!selectedCode) {
      setDetail(null);
      return;
    }
    try {
      const data = await kebunApi.getDetail(selectedCode);
      setDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load kebun detail");
    }
  }, [selectedCode]);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      loadData().catch(() => {});
      loadUsers().catch(() => {});
    }, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [loadData, loadUsers]);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      loadDetail().catch(() => {});
    }, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [loadDetail]);

  const mandors = useMemo(() => users.filter((user) => user.role === "MANDOR"), [users]);
  const supirs = useMemo(() => users.filter((user) => user.role === "SUPIR"), [users]);

  const assignedSupirs = useMemo(() => {
    if (!detail) return [] as UserModel[];
    const assigned = new Set(detail.supirIds);
    return supirs.filter((s) => assigned.has(String(s.id)));
  }, [detail, supirs]);

  const displayedSupirs = useMemo(() => {
    const keyword = supirNameFilter.trim().toLowerCase();
    if (!keyword) return assignedSupirs;
    return assignedSupirs.filter((s) => s.nama.toLowerCase().includes(keyword));
  }, [assignedSupirs, supirNameFilter]);

  const unassignedSupirs = useMemo(() => {
    if (!detail) return supirs;
    const assigned = new Set(detail.supirIds);
    return supirs.filter((s) => !assigned.has(String(s.id)));
  }, [detail, supirs]);

  const validateForm = (): string | null => {
    const luas = parseNumber(form.luas);
    if (luas === null || luas <= 0) return "Luas harus berupa angka lebih dari 0.";
    if (validDraftPoints.length !== 4) return "Harus mengisi 4 titik koordinat lengkap (x dan y).";
    const uniq = new Set(validDraftPoints.map((point) => `${point.x},${point.y}`));
    if (uniq.size < 4) return "Keempat titik harus unik, tidak boleh ada titik yang sama.";
    return null;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const payload: Kebun = {
        code: form.code.trim(),
        name: form.name.trim(),
        luas: Number(form.luas),
        coordinates: validDraftPoints,
      };

      if (editingCode) {
        await kebunApi.update(editingCode, payload);
        setSuccess(`Kebun ${editingCode} berhasil diperbarui.`);
      } else {
        await kebunApi.create(payload);
        setSuccess(`Kebun ${payload.code} berhasil dibuat.`);
      }

      setForm(emptyKebunForm);
      setEditingCode(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    }
  };

  const onEdit = (kebun: Kebun) => {
    setForm({
      code: kebun.code,
      name: kebun.name,
      luas: String(kebun.luas),
      coordinates: toPointInputs(kebun.coordinates),
    });
    setEditingCode(kebun.code);
  };

  const onDelete = async (code: string) => {
    if (!confirm(`Delete kebun ${code}?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await kebunApi.remove(code);
      if (selectedCode === code) {
        setSelectedCode(null);
        setDetail(null);
      }
      setSuccess(`Kebun ${code} berhasil dihapus.`);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const assignMandor = async () => {
    if (!detail || !mandorToAssign) return;
    setError(null);
    setSuccess(null);
    try {
      await kebunApi.assignMandor(detail.code, mandorToAssign);
      setMandorToAssign("");
      setSuccess("Mandor berhasil ditugaskan ke kebun ini.");
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assign mandor failed");
    }
  };

  const reassignMandor = async () => {
    if (!detail?.mandorId || !replacementMandorKebunCode) return;
    setError(null);
    setSuccess(null);
    try {
      await kebunApi.reassignMandor(detail.code, detail.mandorId, replacementMandorKebunCode);
      setReplacementMandorKebunCode("");
      setSuccess("Mandor berhasil dipindahkan ke kebun pengganti.");
      await loadData();
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reassign mandor failed");
    }
  };

  const assignSupir = async () => {
    if (!detail || !supirToAssign) return;
    setError(null);
    setSuccess(null);
    try {
      await kebunApi.assignSupir(detail.code, supirToAssign);
      setSupirToAssign("");
      setSuccess("Supir berhasil ditugaskan ke kebun ini.");
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assign supir failed");
    }
  };

  const reassignSupir = async () => {
    if (!detail || !supirToReassign || !replacementSupirKebunCode) return;
    setError(null);
    setSuccess(null);
    try {
      await kebunApi.reassignSupir(detail.code, supirToReassign, replacementSupirKebunCode);
      setSupirToReassign("");
      setReplacementSupirKebunCode("");
      setSuccess("Supir berhasil dipindahkan ke kebun pengganti.");
      await loadData();
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reassign supir failed");
    }
  };

  const clearPoints = () => {
    setForm((prev) => ({ ...prev, coordinates: emptyKebunForm.coordinates }));
  };

  const currentMandor =
    detail?.mandorId ? mandors.find((m) => String(m.id) === detail.mandorId) ?? null : null;

  const replacementKebunOptions = useMemo(() => {
    return kebunList.filter((k) => k.code !== detail?.code);
  }, [detail, kebunList]);

  return (
    <AuthGuard roles={["ADMIN"]}>
      <div className="space-y-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Manajemen Kebun</h2>
            <p className="text-sm text-slate-400">Kelola kebun, mandor pengawas, dan supir truk per kebun.</p>
          </div>
          <button
            onClick={() => {
              loadData().catch(() => {});
              loadUsers().catch(() => {});
            }}
            className="rounded-lg border border-slate-500 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            type="button"
          >
            Refresh Data
          </button>
        </div>

        <div className="grid gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-4 md:grid-cols-5">
          <input
            className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
            placeholder="Search nama kebun"
            value={filters.name}
            onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
            placeholder="Search kode kebun"
            value={filters.code}
            onChange={(e) => setFilters((prev) => ({ ...prev, code: e.target.value }))}
          />
          <button
            type="button"
            className="rounded-md bg-sky-700 px-3 py-2 text-white hover:bg-sky-600"
            onClick={() => setActiveFilters({ name: filters.name.trim(), code: filters.code.trim() })}
          >
            Apply Filter
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-500 px-3 py-2 text-slate-200 hover:bg-slate-800"
            onClick={() => {
              setFilters({ name: "", code: "" });
              setActiveFilters({ name: "", code: "" });
            }}
          >
            Reset Filter
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-300/30 bg-red-500/10 p-3 text-sm text-red-200">
            <p className="font-semibold">Terjadi masalah</p>
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            <p>{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <form className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-4" onSubmit={submit}>
            <h3 className="text-base font-semibold text-slate-100">{title}</h3>
            <label className="block text-sm text-slate-300">
              Code
              <input
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                placeholder="KBN001"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                disabled={!!editingCode}
                required
              />
            </label>
            <label className="block text-sm text-slate-300">
              Name
              <input
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                placeholder="Nama Kebun"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label className="block text-sm text-slate-300">
              Luas (hektare)
              <input
                className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                placeholder="contoh: 12.5"
                inputMode="decimal"
                value={form.luas}
                onChange={(e) => setForm({ ...form, luas: e.target.value })}
                required
              />
            </label>

            <div className="rounded-md border border-slate-700 p-3">
              <p className="mb-2 text-sm font-medium text-slate-200">4 Titik Koordinat</p>
              <div className="space-y-2">
                {form.coordinates.map((point, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <input
                      className="rounded-md border border-slate-600 bg-slate-900 px-2 py-2 text-slate-100"
                      inputMode="decimal"
                      placeholder={`P${index + 1} x`}
                      value={point.x}
                      onChange={(e) => {
                        const next = form.coordinates.map((p, i) => (i === index ? { ...p, x: e.target.value } : p));
                        setForm((prev) => ({ ...prev, coordinates: next }));
                      }}
                    />
                    <input
                      className="rounded-md border border-slate-600 bg-slate-900 px-2 py-2 text-slate-100"
                      inputMode="decimal"
                      placeholder={`P${index + 1} y`}
                      value={point.y}
                      onChange={(e) => {
                        const next = form.coordinates.map((p, i) => (i === index ? { ...p, y: e.target.value } : p));
                        setForm((prev) => ({ ...prev, coordinates: next }));
                      }}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={clearPoints}
                className="mt-3 w-full rounded-md border border-slate-500 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
              >
                Clear Points
              </button>
            </div>

            <button className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500" type="submit">
              {editingCode ? "Update Kebun" : "Create Kebun"}
            </button>
          </form>

          <div className="space-y-4 lg:col-span-2">
            {loading ? (
              <p className="text-slate-300">Loading...</p>
            ) : (
              <div className="overflow-auto rounded-xl border border-slate-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-800 text-slate-200">
                    <tr>
                      <th className="p-2 text-left">Code</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Luas</th>
                      <th className="p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kebunList.map((k) => (
                      <tr key={k.code} className="border-t border-slate-700 text-slate-100">
                        <td className="p-2">{k.code}</td>
                        <td className="p-2">{k.name}</td>
                        <td className="p-2">{k.luas}</td>
                        <td className="space-x-2 p-2">
                          <button className="rounded-md bg-sky-700 px-2 py-1 text-white hover:bg-sky-600" onClick={() => setSelectedCode(k.code)} type="button">Detail</button>
                          <button className="rounded-md bg-amber-600 px-2 py-1 text-white hover:bg-amber-500" onClick={() => onEdit(k)} type="button">Edit</button>
                          <button className="rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-500" onClick={() => onDelete(k.code)} type="button">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {detail && (
              <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <h3 className="text-lg font-semibold text-slate-100">Detail Kebun {detail.code}</h3>
                <p className="text-sm text-slate-300">{detail.name} · luas {detail.luas}</p>

                <div className="rounded-lg border border-slate-700 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-200">Mandor Pengawas</p>
                  <p className="mb-2 text-sm text-slate-300">
                    Saat ini: {currentMandor ? `${currentMandor.nama} (${currentMandor.id})` : "Belum ada mandor"}
                  </p>
                  <div className="grid gap-2 md:grid-cols-3">
                    <select
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-2 text-slate-100"
                      value={mandorToAssign}
                      onChange={(e) => setMandorToAssign(e.target.value)}
                    >
                      <option value="">Pilih Mandor</option>
                      {mandors.map((m) => (
                        <option key={m.id} value={String(m.id)}>{m.nama} ({m.id})</option>
                      ))}
                    </select>
                    <button className="rounded bg-green-700 px-3 py-2 text-white" onClick={assignMandor} type="button">Assign Mandor</button>
                  </div>

                  {detail.mandorId && (
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      <select
                        className="rounded border border-slate-600 bg-slate-900 px-2 py-2 text-slate-100"
                        value={replacementMandorKebunCode}
                        onChange={(e) => setReplacementMandorKebunCode(e.target.value)}
                      >
                        <option value="">Pilih kebun pengganti</option>
                        {replacementKebunOptions.map((k) => (
                          <option key={k.code} value={k.code}>{k.code} - {k.name}</option>
                        ))}
                      </select>
                      <button className="rounded bg-amber-600 px-3 py-2 text-white" onClick={reassignMandor} type="button">
                        Copot & Reassign Mandor
                      </button>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-slate-700 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-200">Daftar Supir Truk</p>
                  <input
                    className="mb-3 w-full rounded border border-slate-600 bg-slate-900 px-2 py-2 text-slate-100"
                    placeholder="Filter nama supir"
                    value={supirNameFilter}
                    onChange={(e) => setSupirNameFilter(e.target.value)}
                  />
                  <div className="mb-3 overflow-auto rounded border border-slate-700">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-800 text-slate-200">
                        <tr>
                          <th className="p-2 text-left">ID</th>
                          <th className="p-2 text-left">Nama</th>
                          <th className="p-2 text-left">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedSupirs.map((s) => (
                          <tr key={s.id} className="border-t border-slate-700 text-slate-100">
                            <td className="p-2">{s.id}</td>
                            <td className="p-2">{s.nama}</td>
                            <td className="p-2">{s.email}</td>
                          </tr>
                        ))}
                        {displayedSupirs.length === 0 && (
                          <tr>
                            <td className="p-2 text-slate-400" colSpan={3}>Tidak ada supir sesuai filter.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-2 md:grid-cols-3">
                    <select
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-2 text-slate-100"
                      value={supirToAssign}
                      onChange={(e) => setSupirToAssign(e.target.value)}
                    >
                      <option value="">Pilih Supir</option>
                      {unassignedSupirs.map((s) => (
                        <option key={s.id} value={String(s.id)}>{s.nama} ({s.id})</option>
                      ))}
                    </select>
                    <button className="rounded bg-green-700 px-3 py-2 text-white" onClick={assignSupir} type="button">Assign Supir</button>
                  </div>

                  <div className="mt-3 grid gap-2 md:grid-cols-4">
                    <select
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-2 text-slate-100"
                      value={supirToReassign}
                      onChange={(e) => setSupirToReassign(e.target.value)}
                    >
                      <option value="">Pilih Supir Aktif</option>
                      {assignedSupirs.map((s) => (
                        <option key={s.id} value={String(s.id)}>{s.nama} ({s.id})</option>
                      ))}
                    </select>
                    <select
                      className="rounded border border-slate-600 bg-slate-900 px-2 py-2 text-slate-100"
                      value={replacementSupirKebunCode}
                      onChange={(e) => setReplacementSupirKebunCode(e.target.value)}
                    >
                      <option value="">Pilih kebun pengganti</option>
                      {replacementKebunOptions.map((k) => (
                        <option key={k.code} value={k.code}>{k.code} - {k.name}</option>
                      ))}
                    </select>
                    <button className="rounded bg-amber-600 px-3 py-2 text-white" onClick={reassignSupir} type="button">
                      Copot & Reassign Supir
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
