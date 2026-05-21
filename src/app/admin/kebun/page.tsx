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

interface MapPolygon extends Kebun {
  points: CoordinatePoint[];
}

interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface DeleteTarget {
  code: string;
  name: string;
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

const MAP_WIDTH = 980;
const MAP_HEIGHT = 420;
const MAP_PADDING = 40;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 4;

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

const isValidPoint = (point: CoordinatePoint) => Number.isFinite(point.x) && Number.isFinite(point.y);

const getValidPolygonPoints = (coordinates: CoordinatePoint[] | undefined): CoordinatePoint[] | null => {
  if (!coordinates || coordinates.length < 4) return null;
  const points = coordinates.slice(0, 4);
  if (!points.every(isValidPoint)) return null;
  return points;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeBounds = (bounds: MapBounds): MapBounds => {
  const safeMinX = Number.isFinite(bounds.minX) ? bounds.minX : 0;
  const safeMaxX = Number.isFinite(bounds.maxX) ? bounds.maxX : 100;
  const safeMinY = Number.isFinite(bounds.minY) ? bounds.minY : 0;
  const safeMaxY = Number.isFinite(bounds.maxY) ? bounds.maxY : 100;

  const spanX = safeMaxX - safeMinX;
  const spanY = safeMaxY - safeMinY;

  return {
    minX: safeMinX,
    maxX: spanX === 0 ? safeMaxX + 1 : safeMaxX,
    minY: safeMinY,
    maxY: spanY === 0 ? safeMaxY + 1 : safeMaxY,
  };
};

const buildBounds = (polygons: MapPolygon[], draftPoints: CoordinatePoint[]): MapBounds => {
  const allPoints = polygons.flatMap((polygon) => polygon.points).concat(draftPoints);
  if (allPoints.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100 };

  let minX = allPoints[0].x;
  let maxX = allPoints[0].x;
  let minY = allPoints[0].y;
  let maxY = allPoints[0].y;

  for (const point of allPoints) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return normalizeBounds({ minX, maxX, minY, maxY });
};

const pointToCanvas = (point: CoordinatePoint, bounds: MapBounds) => {
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;
  const x = MAP_PADDING + ((point.x - bounds.minX) / spanX) * (MAP_WIDTH - MAP_PADDING * 2);
  const y = MAP_HEIGHT - MAP_PADDING - ((point.y - bounds.minY) / spanY) * (MAP_HEIGHT - MAP_PADDING * 2);
  return { x, y };
};

const formatPoint = (point: CoordinatePoint) => `(${point.x}, ${point.y})`;

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
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [selectedKebunOnMap, setSelectedKebunOnMap] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [mandorToAssign, setMandorToAssign] = useState("");
  const [replacementMandorKebunCode, setReplacementMandorKebunCode] = useState("");
  const [supirToAssign, setSupirToAssign] = useState("");
  const [supirToReassign, setSupirToReassign] = useState("");
  const [replacementSupirKebunCode, setReplacementSupirKebunCode] = useState("");
  const [supirNameFilter, setSupirNameFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const title = useMemo(() => (editingCode ? `Edit Kebun ${editingCode}` : "Tambah Kebun Baru"), [editingCode]);

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

  const mapPolygons = useMemo(() => {
    return kebunList
      .map((kebun) => {
        const points = getValidPolygonPoints(kebun.coordinates);
        if (!points) return null;
        return { ...kebun, points } as MapPolygon;
      })
      .filter((item): item is MapPolygon => item !== null);
  }, [kebunList]);

  const mapBounds = useMemo(() => buildBounds(mapPolygons, validDraftPoints), [mapPolygons, validDraftPoints]);

  const selectedMapKebun = useMemo(
    () => mapPolygons.find((item) => item.code === selectedKebunOnMap) ?? null,
    [mapPolygons, selectedKebunOnMap],
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

  const resetCreateForm = () => {
    setForm(emptyKebunForm);
    setEditingCode(null);
    setShowCreateForm(false);
    setSelectedKebunOnMap(null);
    setMapPan({ x: 0, y: 0 });
    setMapZoom(1);
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
      setShowCreateForm(false);
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
    setShowCreateForm(true);
  };

  const requestDelete = (kebun: Kebun) => {
    setDeleteTarget({ code: kebun.code, name: kebun.name });
  };

  const closeDeleteModal = () => {
    if (isDeleteSubmitting) return;
    setDeleteTarget(null);
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    const code = deleteTarget.code;
    setError(null);
    setSuccess(null);
    setIsDeleteSubmitting(true);
    try {
      await kebunApi.remove(code);
      setKebunList((prev) => prev.filter((item) => item.code !== code));
      if (selectedKebunOnMap === code) {
        setSelectedKebunOnMap(null);
      }
      if (selectedCode === code) {
        setSelectedCode(null);
        setDetail(null);
      }
      setSuccess(`Kebun ${code} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (e) {
      const fallback = "Gagal menghapus kebun. Silakan coba lagi.";
      const reason = e instanceof Error && e.message ? e.message : "";
      setError(reason ? `${fallback} (${reason})` : fallback);
    } finally {
      setIsDeleteSubmitting(false);
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

  const drawGridLines = () => {
    const lines = [];
    const count = 12;

    for (let i = 0; i <= count; i += 1) {
      const x = MAP_PADDING + (i / count) * (MAP_WIDTH - MAP_PADDING * 2);
      const y = MAP_PADDING + (i / count) * (MAP_HEIGHT - MAP_PADDING * 2);
      lines.push(
        <line key={`vx-${i}`} x1={x} x2={x} y1={MAP_PADDING} y2={MAP_HEIGHT - MAP_PADDING} className="stroke-slate-700/60" strokeWidth={1} />,
      );
      lines.push(
        <line key={`hy-${i}`} x1={MAP_PADDING} x2={MAP_WIDTH - MAP_PADDING} y1={y} y2={y} className="stroke-slate-700/60" strokeWidth={1} />,
      );
    }

    return lines;
  };

  return (
    <AuthGuard roles={["ADMIN"]}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-2 py-3 md:px-3">
        <section className="rounded-3xl border border-emerald-500/25 bg-slate-900/85 p-6 shadow-[0_20px_70px_-35px_rgba(16,185,129,0.35)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-100">Manajemen Kebun</h2>
              <p className="mt-2 text-sm text-slate-400">Kelola data kebun, titik koordinat, dan area perkebunan.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(true);
                  setEditingCode(null);
                  setForm(emptyKebunForm);
                }}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Tambah Kebun
              </button>
              <button
                onClick={() => {
                  loadData().catch(() => {});
                  loadUsers().catch(() => {});
                }}
                className="rounded-xl border border-slate-500 bg-slate-900 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
                type="button"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 md:p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-100">Filter Kebun</h3>
            <p className="mt-1 text-sm text-slate-400">Cari kebun berdasarkan nama atau kode kebun.</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto]">
            <input
              className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none transition focus:border-emerald-500"
              placeholder="Search nama kebun"
              value={filters.name}
              onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none transition focus:border-emerald-500"
              placeholder="Search kode kebun"
              value={filters.code}
              onChange={(e) => setFilters((prev) => ({ ...prev, code: e.target.value }))}
            />
            <button
              type="button"
              className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
              onClick={() => setActiveFilters({ name: filters.name.trim(), code: filters.code.trim() })}
            >
              Apply Filter
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-500 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
              onClick={() => {
                setFilters({ name: "", code: "" });
                setActiveFilters({ name: "", code: "" });
              }}
            >
              Reset Filter
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm text-red-200">
            <p className="font-semibold">Terjadi masalah</p>
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <p>{success}</p>
          </div>
        )}

        {showCreateForm && (
          <section className="rounded-3xl border border-emerald-500/30 bg-slate-900/85 p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
                <p className="mt-1 text-sm text-slate-400">Gunakan grid untuk memahami batas kebun yang sudah ada.</p>
              </div>
              <button
                type="button"
                onClick={resetCreateForm}
                className="rounded-xl border border-slate-500 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-200">Peta Grid Kebun</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMapZoom((prev) => clamp(prev + 0.2, MIN_ZOOM, MAX_ZOOM))}
                      className="rounded-md border border-slate-500 bg-slate-900 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapZoom((prev) => clamp(prev - 0.2, MIN_ZOOM, MAX_ZOOM))}
                      className="rounded-md border border-slate-500 bg-slate-900 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMapZoom(1);
                        setMapPan({ x: 0, y: 0 });
                      }}
                      className="rounded-md border border-slate-500 bg-slate-900 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                  <svg
                    viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                    className="h-[320px] w-full cursor-grab touch-none md:h-[380px]"
                    onMouseDown={(event) => {
                      setIsPanning(true);
                      setPanStart({ x: event.clientX - mapPan.x, y: event.clientY - mapPan.y });
                    }}
                    onMouseMove={(event) => {
                      if (!isPanning) return;
                      setMapPan({ x: event.clientX - panStart.x, y: event.clientY - panStart.y });
                    }}
                    onMouseUp={() => setIsPanning(false)}
                    onMouseLeave={() => setIsPanning(false)}
                  >
                    <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} className="fill-slate-950" />
                    <g transform={`translate(${mapPan.x} ${mapPan.y}) scale(${mapZoom})`}>
                      {drawGridLines()}
                      {mapPolygons.map((polygon) => {
                        const points = polygon.points.map((point) => {
                          const mapped = pointToCanvas(point, mapBounds);
                          return `${mapped.x},${mapped.y}`;
                        });
                        const isSelected = selectedKebunOnMap === polygon.code;

                        return (
                          <polygon
                            key={polygon.code}
                            points={points.join(" ")}
                            className={isSelected ? "fill-emerald-400/45 stroke-emerald-200" : "fill-emerald-500/20 stroke-emerald-400/80 hover:fill-emerald-500/35"}
                            strokeWidth={isSelected ? 3 : 2}
                            style={{ cursor: "pointer", transition: "fill .15s ease" }}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedKebunOnMap(polygon.code);
                            }}
                          />
                        );
                      })}
                      {validDraftPoints.length === 4 && (
                        <polygon
                          points={validDraftPoints
                            .map((point) => {
                              const mapped = pointToCanvas(point, mapBounds);
                              return `${mapped.x},${mapped.y}`;
                            })
                            .join(" ")}
                          className="fill-sky-500/20 stroke-sky-300"
                          strokeWidth={2}
                          strokeDasharray="6 4"
                        />
                      )}
                    </g>
                  </svg>
                </div>

                <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-300">
                  {selectedMapKebun ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-emerald-300">{selectedMapKebun.code} - {selectedMapKebun.name}</p>
                      <p>Luas: {selectedMapKebun.luas}</p>
                      <p>
                        Titik: {selectedMapKebun.points.map((point) => formatPoint(point)).join(" | ")}
                      </p>
                    </div>
                  ) : (
                    <p>Klik polygon kebun untuk melihat detail koordinat dan luas area.</p>
                  )}
                </div>
              </div>

              <form className="space-y-3 rounded-2xl border border-slate-700 bg-slate-950/60 p-4" onSubmit={submit}>
                <label className="block text-sm text-slate-300">
                  Code
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
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
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                    placeholder="Nama Kebun"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Luas (hektare)
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                    placeholder="contoh: 12.5"
                    inputMode="decimal"
                    value={form.luas}
                    onChange={(e) => setForm({ ...form, luas: e.target.value })}
                    required
                  />
                </label>

                <div className="rounded-lg border border-slate-700 p-3">
                  <p className="mb-2 text-sm font-medium text-slate-200">4 Titik Koordinat</p>
                  <div className="grid gap-2 sm:grid-cols-2">
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

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={resetCreateForm}
                    className="rounded-lg border border-slate-500 bg-slate-900 px-4 py-2 font-medium text-slate-200 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500" type="submit">
                    {editingCode ? "Update Kebun" : "Create Kebun"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-100">Daftar Kebun</h3>
            <span className="rounded-full border border-emerald-600/40 bg-emerald-600/10 px-3 py-1 text-xs text-emerald-300">
              {kebunList.length} kebun
            </span>
          </div>
          {loading ? (
            <p className="py-8 text-center text-slate-300">Loading data kebun...</p>
          ) : kebunList.length === 0 ? (
            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-8 text-center">
              <p className="text-slate-200">Belum ada data kebun ditemukan.</p>
              <p className="mt-1 text-sm text-slate-400">Coba ubah filter atau tambahkan kebun baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-700">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-800 text-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Luas</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kebunList.map((k) => (
                    <tr key={k.code} className="border-t border-slate-700 text-slate-100">
                      <td className="px-4 py-3 font-medium">{k.code}</td>
                      <td className="px-4 py-3">{k.name}</td>
                      <td className="px-4 py-3">{k.luas}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600" onClick={() => setSelectedCode(k.code)} type="button">Detail</button>
                          <button className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500" onClick={() => onEdit(k)} type="button">Edit</button>
                          <button className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500" onClick={() => requestDelete(k)} type="button">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {detail && (
          <section className="space-y-4 rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 md:p-6">
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
          </section>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-900 p-5 shadow-[0_20px_70px_-35px_rgba(16,185,129,0.35)]">
              <h4 className="text-lg font-semibold text-slate-100">Hapus kebun ini?</h4>
              <p className="mt-2 text-sm text-slate-300">
                Data kebun {deleteTarget.code} / {deleteTarget.name} akan dihapus secara permanen.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={isDeleteSubmitting}
                  className="rounded-lg border border-slate-500 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isDeleteSubmitting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleteSubmitting ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
