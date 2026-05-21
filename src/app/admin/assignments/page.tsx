"use client";

import { authApi } from "@/api/authApi";
import { kebunApi } from "@/api/kebunApi";
import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import type { UserModel } from "@/types/auth";
import type { Kebun, KebunDetail } from "@/types/kebun";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function AdminAssignmentsPage() {
  const { token } = useAuth();
  const [kebunList, setKebunList] = useState<Kebun[]>([]);
  const [users, setUsers] = useState<UserModel[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [detail, setDetail] = useState<KebunDetail | null>(null);
  const [assignmentSnapshot, setAssignmentSnapshot] = useState<Record<string, { mandorId: string | null; supirCount: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [mandorToAssign, setMandorToAssign] = useState("");
  const [replacementMandorKebunCode, setReplacementMandorKebunCode] = useState("");
  const [supirToAssign, setSupirToAssign] = useState("");
  const [supirToReassign, setSupirToReassign] = useState("");
  const [replacementSupirKebunCode, setReplacementSupirKebunCode] = useState("");
  const [supirNameFilter, setSupirNameFilter] = useState("");

  const loadBaseData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [kebunData, userData] = await Promise.all([kebunApi.list(), authApi.users(token)]);
      const details = await Promise.all(kebunData.map((item) => kebunApi.getDetail(item.code).catch(() => null)));
      const snapshot: Record<string, { mandorId: string | null; supirCount: number }> = {};
      for (const detailItem of details) {
        if (!detailItem) continue;
        snapshot[detailItem.code] = { mandorId: detailItem.mandorId, supirCount: detailItem.supirIds.length };
      }
      setKebunList(kebunData);
      setUsers(userData);
      setAssignmentSnapshot(snapshot);
      if (!selectedCode && kebunData.length > 0) setSelectedCode(kebunData[0].code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load assignment data");
    } finally {
      setLoading(false);
    }
  }, [token, selectedCode]);

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
      loadBaseData().catch(() => {});
    }, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [loadBaseData]);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      loadDetail().catch(() => {});
    }, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [loadDetail]);

  const mandors = useMemo(() => users.filter((user) => user.role === "MANDOR"), [users]);
  const supirs = useMemo(() => users.filter((user) => user.role === "SUPIR"), [users]);

  const currentMandor =
    detail?.mandorId ? mandors.find((mandor) => String(mandor.id) === detail.mandorId) ?? null : null;

  const assignedSupirs = useMemo(() => {
    if (!detail) return [] as UserModel[];
    const assigned = new Set(detail.supirIds);
    return supirs.filter((supir) => assigned.has(String(supir.id)));
  }, [detail, supirs]);

  const displayedSupirs = useMemo(() => {
    const keyword = supirNameFilter.trim().toLowerCase();
    if (!keyword) return assignedSupirs;
    return assignedSupirs.filter((supir) => supir.nama.toLowerCase().includes(keyword));
  }, [assignedSupirs, supirNameFilter]);

  const unassignedSupirs = useMemo(() => {
    if (!detail) return supirs;
    const assigned = new Set(detail.supirIds);
    return supirs.filter((supir) => !assigned.has(String(supir.id)));
  }, [detail, supirs]);

  const replacementKebunOptions = useMemo(() => {
    return kebunList.filter((kebun) => kebun.code !== detail?.code);
  }, [detail, kebunList]);

  const assignMandor = async () => {
    if (!detail || !mandorToAssign) return;
    setError(null);
    setMessage(null);
    try {
      await kebunApi.assignMandor(detail.code, mandorToAssign);
      setMandorToAssign("");
      setMessage("Mandor berhasil ditugaskan ke kebun ini.");
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assign mandor failed");
    }
  };

  const reassignMandor = async () => {
    if (!detail?.mandorId || !replacementMandorKebunCode) return;
    setError(null);
    setMessage(null);
    try {
      await kebunApi.reassignMandor(detail.code, detail.mandorId, replacementMandorKebunCode);
      setReplacementMandorKebunCode("");
      setMessage("Mandor berhasil dipindahkan ke kebun pengganti.");
      await loadBaseData();
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reassign mandor failed");
    }
  };

  const assignSupir = async () => {
    if (!detail || !supirToAssign) return;
    setError(null);
    setMessage(null);
    try {
      await kebunApi.assignSupir(detail.code, supirToAssign);
      setSupirToAssign("");
      setMessage("Supir berhasil ditugaskan ke kebun ini.");
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assign supir failed");
    }
  };

  const reassignSupir = async () => {
    if (!detail || !supirToReassign || !replacementSupirKebunCode) return;
    setError(null);
    setMessage(null);
    try {
      await kebunApi.reassignSupir(detail.code, supirToReassign, replacementSupirKebunCode);
      setSupirToReassign("");
      setReplacementSupirKebunCode("");
      setMessage("Supir berhasil dipindahkan ke kebun pengganti.");
      await loadBaseData();
      await loadDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reassign supir failed");
    }
  };

  return (
    <AuthGuard roles={["ADMIN"]}>
      <AppShell>
        <div className="space-y-6">
          <section className="rounded-3xl border border-emerald-500/25 bg-slate-900/85 p-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Assignment Kebun</h2>
            <p className="mt-2 text-sm text-slate-400">
              Kelola assignment mandor dan supir per kebun untuk operasional yang lebih terstruktur.
            </p>
          </section>

          {error && <p className="rounded-xl border border-red-300/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          {message && <p className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}

          <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5">
              <h3 className="mb-3 text-lg font-semibold text-slate-100">Daftar Kebun</h3>
              {loading ? (
                <p className="text-slate-300">Loading data kebun...</p>
              ) : kebunList.length === 0 ? (
                <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300">
                  Belum ada kebun untuk assignment.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-700">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-800 text-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left">Kode</th>
                        <th className="px-4 py-3 text-left">Nama</th>
                        <th className="px-4 py-3 text-left">Mandor</th>
                        <th className="px-4 py-3 text-left">Supir</th>
                        <th className="px-4 py-3 text-left">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kebunList.map((kebun) => (
                        <AssignmentRow
                          key={kebun.code}
                          kebun={kebun}
                          snapshot={assignmentSnapshot[kebun.code]}
                          isSelected={selectedCode === kebun.code}
                          mandors={mandors}
                          onSelect={setSelectedCode}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5">
              {!detail ? (
                <p className="text-sm text-slate-300">Pilih kebun untuk mengelola assignment.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">Kelola Kebun {detail.code}</h3>
                    <p className="text-sm text-slate-400">{detail.name}</p>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                    <p className="text-sm font-semibold text-slate-200">Mandor</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Saat ini: {currentMandor ? `${currentMandor.nama} (${currentMandor.id})` : "Belum ada mandor"}
                    </p>
                    <div className="mt-2 grid gap-2">
                      <select
                        className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-slate-100"
                        value={mandorToAssign}
                        onChange={(e) => setMandorToAssign(e.target.value)}
                      >
                        <option value="">Pilih Mandor</option>
                        {mandors.map((mandor) => (
                          <option key={mandor.id} value={String(mandor.id)}>
                            {mandor.nama} ({mandor.id})
                          </option>
                        ))}
                      </select>
                      <button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600" onClick={assignMandor} type="button">
                        Assign Mandor
                      </button>
                    </div>
                    {detail.mandorId && (
                      <div className="mt-3 grid gap-2">
                        <select
                          className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-slate-100"
                          value={replacementMandorKebunCode}
                          onChange={(e) => setReplacementMandorKebunCode(e.target.value)}
                        >
                          <option value="">Pilih kebun pengganti</option>
                          {replacementKebunOptions.map((kebun) => (
                            <option key={kebun.code} value={kebun.code}>
                              {kebun.code} - {kebun.name}
                            </option>
                          ))}
                        </select>
                        <button className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500" onClick={reassignMandor} type="button">
                          Copot & Reassign Mandor
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                    <p className="text-sm font-semibold text-slate-200">Supir</p>
                    <input
                      className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      placeholder="Filter nama supir"
                      value={supirNameFilter}
                      onChange={(e) => setSupirNameFilter(e.target.value)}
                    />
                    <div className="mt-2 max-h-36 overflow-auto rounded-lg border border-slate-700">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-800 text-slate-200">
                          <tr>
                            <th className="px-2 py-2 text-left">Nama</th>
                            <th className="px-2 py-2 text-left">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedSupirs.map((supir) => (
                            <tr key={supir.id} className="border-t border-slate-700 text-slate-100">
                              <td className="px-2 py-2">{supir.nama}</td>
                              <td className="px-2 py-2">{supir.email}</td>
                            </tr>
                          ))}
                          {displayedSupirs.length === 0 && (
                            <tr>
                              <td className="px-2 py-2 text-slate-400" colSpan={2}>Tidak ada supir sesuai filter.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 grid gap-2">
                      <select
                        className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-slate-100"
                        value={supirToAssign}
                        onChange={(e) => setSupirToAssign(e.target.value)}
                      >
                        <option value="">Pilih Supir</option>
                        {unassignedSupirs.map((supir) => (
                          <option key={supir.id} value={String(supir.id)}>
                            {supir.nama} ({supir.id})
                          </option>
                        ))}
                      </select>
                      <button className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600" onClick={assignSupir} type="button">
                        Assign Supir
                      </button>
                    </div>

                    <div className="mt-3 grid gap-2">
                      <select
                        className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-slate-100"
                        value={supirToReassign}
                        onChange={(e) => setSupirToReassign(e.target.value)}
                      >
                        <option value="">Pilih Supir Aktif</option>
                        {assignedSupirs.map((supir) => (
                          <option key={supir.id} value={String(supir.id)}>
                            {supir.nama} ({supir.id})
                          </option>
                        ))}
                      </select>
                      <select
                        className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-slate-100"
                        value={replacementSupirKebunCode}
                        onChange={(e) => setReplacementSupirKebunCode(e.target.value)}
                      >
                        <option value="">Pilih kebun pengganti</option>
                        {replacementKebunOptions.map((kebun) => (
                          <option key={kebun.code} value={kebun.code}>
                            {kebun.code} - {kebun.name}
                          </option>
                        ))}
                      </select>
                      <button className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500" onClick={reassignSupir} type="button">
                        Copot & Reassign Supir
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}

function AssignmentRow({
  kebun,
  snapshot,
  isSelected,
  mandors,
  onSelect,
}: {
  kebun: Kebun;
  snapshot?: { mandorId: string | null; supirCount: number };
  isSelected: boolean;
  mandors: UserModel[];
  onSelect: (code: string) => void;
}) {
  const mandorLabel = snapshot?.mandorId
    ? mandors.find((mandor) => String(mandor.id) === snapshot.mandorId)?.nama ?? `ID ${snapshot.mandorId}`
    : "Belum ada mandor";
  const supirLabel = snapshot ? `${snapshot.supirCount} supir` : "0 supir";

  return (
    <tr className={`border-t border-slate-700 text-slate-100 ${isSelected ? "bg-emerald-900/20" : ""}`}>
      <td className="px-4 py-3 font-medium">{kebun.code}</td>
      <td className="px-4 py-3">{kebun.name}</td>
      <td className="px-4 py-3 text-slate-300">{mandorLabel}</td>
      <td className="px-4 py-3 text-slate-300">{supirLabel}</td>
      <td className="px-4 py-3">
        <button
          type="button"
          className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
          onClick={() => onSelect(kebun.code)}
        >
          Kelola
        </button>
      </td>
    </tr>
  );
}
