"use client";

import { kebunApi } from "@/api/kebunApi";
import { AuthGuard } from "@/components/AuthGuard";
import type { CoordinatePoint, Kebun } from "@/types/kebun";
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

const GRID_SIZE = 100;
const GRID_STEP = 10;

const parseNumber = (value: string): number | null => {
  if (value.trim() === "") {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const toPointInputs = (coordinates: CoordinatePoint[] | undefined): PointInput[] => {
  const source = coordinates ?? [];
  const normalized = source.slice(0, 4).map((point) => ({
    x: String(point.x),
    y: String(point.y),
  }));
  while (normalized.length < 4) {
    normalized.push({ x: "", y: "" });
  }
  return normalized;
};

const pointsToAttr = (points: CoordinatePoint[], toGrid: (p: CoordinatePoint) => CoordinatePoint): string =>
  points.map((point) => {
    const p = toGrid(point);
    return `${p.x},${p.y}`;
  }).join(" ");

export default function AdminKebunPage() {
  const [kebunList, setKebunList] = useState<Kebun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<KebunForm>(emptyKebunForm);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [placementIndex, setPlacementIndex] = useState(0);

  const title = useMemo(() => (editingCode ? `Edit Kebun ${editingCode}` : "Create Kebun"), [editingCode]);

  const parsedFormPoints = useMemo(() =>
    form.coordinates.map((point) => ({
      x: parseNumber(point.x),
      y: parseNumber(point.y),
    })), [form.coordinates]);

  const validDraftPoints = useMemo(() => parsedFormPoints
    .filter((point): point is { x: number; y: number } => point.x !== null && point.y !== null)
    .map((point) => ({ x: point.x, y: point.y })), [parsedFormPoints]);

  const coordinateBounds = useMemo(() => {
    const allPoints: CoordinatePoint[] = [];
    kebunList.forEach((kebun) => {
      kebun.coordinates.forEach((point) => allPoints.push(point));
    });
    validDraftPoints.forEach((point) => allPoints.push(point));

    if (allPoints.length === 0) {
      return { minX: 0, maxX: 10, minY: 0, maxY: 10 };
    }

    const xs = allPoints.map((point) => point.x);
    const ys = allPoints.map((point) => point.y);
    let minX = Math.min(...xs);
    let maxX = Math.max(...xs);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);

    if (minX === maxX) {
      minX -= 1;
      maxX += 1;
    }
    if (minY === maxY) {
      minY -= 1;
      maxY += 1;
    }

    const padX = (maxX - minX) * 0.15;
    const padY = (maxY - minY) * 0.15;

    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY,
    };
  }, [kebunList, validDraftPoints]);

  const worldToGrid = (point: CoordinatePoint): CoordinatePoint => {
    const { minX, maxX, minY, maxY } = coordinateBounds;
    const xRatio = (point.x - minX) / (maxX - minX);
    const yRatio = (point.y - minY) / (maxY - minY);
    return {
      x: xRatio * GRID_SIZE,
      y: GRID_SIZE - (yRatio * GRID_SIZE),
    };
  };

  const gridToWorld = (x: number, y: number): CoordinatePoint => {
    const { minX, maxX, minY, maxY } = coordinateBounds;
    const xRatio = x / GRID_SIZE;
    const yRatio = 1 - (y / GRID_SIZE);
    const worldX = minX + xRatio * (maxX - minX);
    const worldY = minY + yRatio * (maxY - minY);
    return {
      x: Number(worldX.toFixed(3)),
      y: Number(worldY.toFixed(3)),
    };
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const kebunData = await kebunApi.list();
      setKebunList(kebunData);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load kebun data";
      if (message.toLowerCase().includes("failed to fetch")) {
        setError("Tidak bisa menghubungi Kebun API. Cek service kebun (8081), lalu refresh data.");
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const setCoordinate = (index: number, key: "x" | "y", value: string) => {
    setForm((prev) => {
      const next = prev.coordinates.map((point, i) =>
        i === index ? { ...point, [key]: value } : point,
      );
      return { ...prev, coordinates: next };
    });
  };

  const setPointFromGrid = (point: CoordinatePoint) => {
    setForm((prev) => {
      const next = [...prev.coordinates];
      next[placementIndex] = { x: String(point.x), y: String(point.y) };
      return { ...prev, coordinates: next };
    });
    setPlacementIndex((prev) => (prev + 1) % 4);
  };

  const handleGridClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * GRID_SIZE;
    const y = ((event.clientY - rect.top) / rect.height) * GRID_SIZE;
    setPointFromGrid(gridToWorld(x, y));
  };

  const validateForm = (): string | null => {
    const luas = parseNumber(form.luas);
    if (luas === null || luas <= 0) {
      return "Luas harus berupa angka lebih dari 0.";
    }

    if (validDraftPoints.length !== 4) {
      return "Harus mengisi 4 titik koordinat lengkap (x dan y).";
    }

    const uniq = new Set(validDraftPoints.map((point) => `${point.x},${point.y}`));
    if (uniq.size < 4) {
      return "Keempat titik harus unik, tidak boleh ada titik yang sama.";
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
        coordinates: validDraftPoints,
      };

      if (editingCode) {
        await kebunApi.update(editingCode, payload);
      } else {
        await kebunApi.create(payload);
      }

      setForm(emptyKebunForm);
      setPlacementIndex(0);
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
      luas: String(kebun.luas),
      coordinates: toPointInputs(kebun.coordinates),
    });
    setPlacementIndex(0);
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

  const clearPoints = () => {
    setForm((prev) => ({
      ...prev,
      coordinates: emptyKebunForm.coordinates,
    }));
    setPlacementIndex(0);
  };

  return (
    <AuthGuard roles={["ADMIN"]}>
      <div className="space-y-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Manajemen Kebun</h2>
            <p className="text-sm text-slate-400">Klik 4 titik di grid untuk membentuk area, lalu simpan kebun.</p>
          </div>
          <button
            onClick={() => void loadData()}
            className="rounded-lg border border-slate-500 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            type="button"
          >
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-300/30 bg-red-500/10 p-3 text-sm text-red-200">
            <p className="font-semibold">Terjadi masalah</p>
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-950/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-200">Peta Grid Kebun</p>
              <p className="text-xs text-slate-400">Click mode: Point {placementIndex + 1}</p>
            </div>

            <svg
              viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
              className="h-[420px] w-full rounded-lg border border-slate-700 bg-slate-950"
              onClick={handleGridClick}
              role="img"
              aria-label="Grid kebun"
            >
              {Array.from({ length: GRID_SIZE / GRID_STEP + 1 }).map((_, i) => {
                const v = i * GRID_STEP;
                return (
                  <g key={v}>
                    <line x1={v} y1={0} x2={v} y2={GRID_SIZE} stroke="#1e293b" strokeWidth={0.3} />
                    <line x1={0} y1={v} x2={GRID_SIZE} y2={v} stroke="#1e293b" strokeWidth={0.3} />
                  </g>
                );
              })}

              {kebunList.map((kebun) => {
                if (kebun.coordinates.length !== 4) {
                  return null;
                }
                return (
                  <polygon
                    key={kebun.code}
                    points={pointsToAttr(kebun.coordinates, worldToGrid)}
                    fill="#0ea5e91f"
                    stroke="#38bdf8"
                    strokeWidth={0.6}
                  />
                );
              })}

              {validDraftPoints.length >= 2 && (
                <polyline
                  points={pointsToAttr(validDraftPoints, worldToGrid)}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={0.9}
                  strokeDasharray="1.5 1"
                />
              )}

              {validDraftPoints.length === 4 && (
                <polygon
                  points={pointsToAttr(validDraftPoints, worldToGrid)}
                  fill="#22c55e29"
                  stroke="#22c55e"
                  strokeWidth={1}
                />
              )}

              {validDraftPoints.map((point, index) => {
                const p = worldToGrid(point);
                return (
                  <g key={`${point.x}-${point.y}-${index}`}>
                    <circle cx={p.x} cy={p.y} r={1.4} fill="#fbbf24" />
                    <text x={p.x + 1.8} y={p.y - 1.8} fontSize="3" fill="#fbbf24">P{index + 1}</text>
                  </g>
                );
              })}
            </svg>

            <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400" /> Existing kebun</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Draft points</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-400" /> Draft area</span>
            </div>
          </div>

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
              <p className="mb-2 text-xs text-slate-400">Tips: klik di grid untuk isi titik otomatis.</p>
              <div className="space-y-2">
                {form.coordinates.map((point, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <input
                      className="rounded-md border border-slate-600 bg-slate-900 px-2 py-2 text-slate-100"
                      inputMode="decimal"
                      placeholder={`P${index + 1} x`}
                      value={point.x}
                      onChange={(e) => setCoordinate(index, "x", e.target.value)}
                    />
                    <input
                      className="rounded-md border border-slate-600 bg-slate-900 px-2 py-2 text-slate-100"
                      inputMode="decimal"
                      placeholder={`P${index + 1} y`}
                      value={point.y}
                      onChange={(e) => setCoordinate(index, "y", e.target.value)}
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
        </div>

        {loading ? <p className="text-slate-300">Loading...</p> : (
          <div className="overflow-auto rounded-xl border border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800 text-slate-200">
                <tr>
                  <th className="p-2 text-left">Code</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Luas</th>
                  <th className="p-2 text-left">Coordinates (4 points)</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kebunList.map((k) => (
                  <tr key={k.code} className="border-t border-slate-700 text-slate-100">
                    <td className="p-2">{k.code}</td>
                    <td className="p-2">{k.name}</td>
                    <td className="p-2">{k.luas}</td>
                    <td className="p-2 text-xs">{k.coordinates.map((p, i) => `P${i + 1}(${p.x}, ${p.y})`).join(" | ")}</td>
                    <td className="p-2 space-x-2">
                      <button className="rounded-md bg-amber-600 px-2 py-1 text-white hover:bg-amber-500" onClick={() => onEdit(k)}>Edit</button>
                      <button className="rounded-md bg-red-600 px-2 py-1 text-white hover:bg-red-500" onClick={() => onDelete(k.code)}>Delete</button>
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
