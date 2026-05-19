"use client";

import { kebunApi } from "@/api/kebunApi";
import { AuthGuard } from "@/components/AuthGuard";
import type { CoordinatePoint, Kebun } from "@/types/kebun";
import { useEffect, useMemo, useState } from "react";

interface KebunForm {
  code: string;
  name: string;
  luas: number;
  coordinates: CoordinatePoint[];
}

const emptyKebunForm: KebunForm = {
  code: "",
  name: "",
  luas: 0,
  coordinates: [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ],
};

const normalizeCoordinates = (coordinates: CoordinatePoint[] | undefined): CoordinatePoint[] => {
  const source = coordinates ?? [];
  const normalized = source.slice(0, 4);
  while (normalized.length < 4) {
    normalized.push({ x: 0, y: 0 });
  }
  return normalized;
};

export default function AdminKebunPage() {
  const [kebunList, setKebunList] = useState<Kebun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<KebunForm>(emptyKebunForm);
  const [editingCode, setEditingCode] = useState<string | null>(null);

  const title = useMemo(() => (editingCode ? `Edit Kebun ${editingCode}` : "Create Kebun"), [editingCode]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const kebunData = await kebunApi.list();
      setKebunList(kebunData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load kebun data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const setCoordinate = (index: number, key: "x" | "y", value: string) => {
    setForm((prev) => {
      const next = prev.coordinates.map((point, i) =>
        i === index ? { ...point, [key]: Number(value) } : point,
      );
      return { ...prev, coordinates: next };
    });
  };

  const validateForm = (): string | null => {
    if (form.coordinates.length !== 4) {
      return "Exactly 4 coordinate points are required.";
    }

    for (let i = 0; i < form.coordinates.length; i++) {
      const point = form.coordinates[i];
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        return `Point ${i + 1} must have numeric x and y values.`;
      }
    }

    const uniq = new Set(form.coordinates.map((p) => `${p.x},${p.y}`));
    if (uniq.size < 4) {
      return "Each coordinate point must be unique.";
    }

    return null;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
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
        coordinates: form.coordinates,
      };

      if (editingCode) {
        await kebunApi.update(editingCode, payload);
      } else {
        await kebunApi.create(payload);
      }
      setForm(emptyKebunForm);
      setEditingCode(null);
      await loadData();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Submit failed";
      if (message.toLowerCase().includes("overlap")) {
        setError(`Area kebun overlap dengan kebun lain. ${message}`);
        return;
      }
      setError(message);
    }
  };

  const onEdit = (kebun: Kebun) => {
    setForm({
      code: kebun.code,
      name: kebun.name,
      luas: kebun.luas,
      coordinates: normalizeCoordinates(kebun.coordinates),
    });
    setEditingCode(kebun.code);
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
          <input className="rounded border p-2" placeholder="Kode Kebun" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={!!editingCode} required />
          <input className="rounded border p-2" placeholder="Nama Kebun" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="rounded border p-2" placeholder="Luas (hektare)" type="number" value={form.luas} onChange={(e) => setForm({ ...form, luas: Number(e.target.value) })} required />
          <div className="md:col-span-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            {form.coordinates.map((point, index) => (
              <div key={index} className="grid grid-cols-2 gap-2 rounded border p-2">
                <input
                  className="rounded border p-2"
                  type="number"
                  step="any"
                  placeholder={`Point ${index + 1} x coordinate`}
                  aria-label={`Point ${index + 1} x coordinate`}
                  value={point.x}
                  onChange={(e) => setCoordinate(index, "x", e.target.value)}
                  required
                />
                <input
                  className="rounded border p-2"
                  type="number"
                  step="any"
                  placeholder={`Point ${index + 1} y coordinate`}
                  aria-label={`Point ${index + 1} y coordinate`}
                  value={point.y}
                  onChange={(e) => setCoordinate(index, "y", e.target.value)}
                  required
                />
              </div>
            ))}
          </div>
          <button className="md:col-span-2 rounded bg-green-700 px-3 py-2 text-white" type="submit">{editingCode ? "Update Kebun" : "Create Kebun"}</button>
        </form>

        {loading ? <p>Loading...</p> : (
          <div className="overflow-auto rounded border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-left">Code</th><th className="p-2 text-left">Name</th><th className="p-2 text-left">Luas</th><th className="p-2 text-left">Coordinates (4 points)</th><th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kebunList.map((k) => (
                  <tr key={k.code} className="border-t">
                    <td className="p-2">{k.code}</td><td className="p-2">{k.name}</td><td className="p-2">{k.luas}</td><td className="p-2">{k.coordinates.map((p, i) => `P${i + 1}(${p.x}, ${p.y})`).join(" | ")}</td>
                    <td className="p-2 space-x-2">
                      <button className="rounded bg-amber-600 px-2 py-1 text-white" onClick={() => onEdit(k)}>Edit</button>
                      <button className="rounded bg-red-600 px-2 py-1 text-white" onClick={() => onDelete(k.code)}>Delete</button>
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
