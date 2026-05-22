"use client";

import { hasilPanenApi } from "@/api/hasilPanenApi";
import { pengirimanApi } from "@/api/pengirimanApi";
import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import type { Role } from "@/types/auth";
import type { MandorHarvestItem, TransportEligibility } from "@/types/harvest";
import type { Pengiriman, PengirimanUserSummary, StatusPengiriman } from "@/types/pengiriman";
import { useCallback, useEffect, useMemo, useState } from "react";

const statusLabels: Record<StatusPengiriman, string> = {
  MEMUAT: "Memuat",
  MENGIRIM: "Mengirim",
  TIBA_DI_TUJUAN: "Tiba di Tujuan",
  APPROVED_MANDOR: "Disetujui Mandor",
  REJECTED_MANDOR: "Ditolak Mandor",
  APPROVED_ADMIN: "Disetujui Admin",
  REJECTED_ADMIN: "Ditolak Admin",
  PARTIALLY_REJECTED_ADMIN: "Ditolak Parsial",
};

const nextStatus: Partial<Record<StatusPengiriman, StatusPengiriman>> = {
  MEMUAT: "MENGIRIM",
  MENGIRIM: "TIBA_DI_TUJUAN",
};

const formatKg = (value?: number | null) => `${Number(value ?? 0).toLocaleString("id-ID")} kg`;

export default function PengirimanPage() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-300">
          Memuat sesi pengguna...
        </div>
      </AppShell>
    );
  }

  if (!currentUser) {
    return (
      <AuthGuard roles={["ADMIN", "MANDOR", "SUPIR"]}>
        <AppShell />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard roles={["ADMIN", "MANDOR", "SUPIR"]}>
      <AppShell>
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Dashboard Pengiriman</h2>
            <p className="mt-1 text-sm text-slate-300">Kelola alur angkut panen dari kebun sampai validasi pabrik.</p>
          </div>
          {currentUser.role === "MANDOR" && <MandorPengiriman actor={currentUser} />}
          {currentUser.role === "SUPIR" && <SupirPengiriman actor={currentUser} />}
          {currentUser.role === "ADMIN" && <AdminPengiriman actor={currentUser} />}
        </div>
      </AppShell>
    </AuthGuard>
  );
}

function MandorPengiriman({ actor }: { actor: { id: number; role: Role } }) {
  const { token } = useAuth();
  const [drivers, setDrivers] = useState<PengirimanUserSummary[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [manualHarvestId, setManualHarvestId] = useState("");
  const [harvests, setHarvests] = useState<MandorHarvestItem[]>([]);
  const [eligibility, setEligibility] = useState<Record<string, TransportEligibility>>({});
  const [selectedHarvestIds, setSelectedHarvestIds] = useState<string[]>([]);
  const [ongoing, setOngoing] = useState<Pengiriman[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedWeight = useMemo(() =>
    selectedHarvestIds.reduce((sum, id) => sum + Number(eligibility[id]?.kilogram ?? 0), 0),
    [eligibility, selectedHarvestIds],
  );

  const loadDrivers = useCallback(async () => {
    const data = await pengirimanApi.drivers(actor.id, actor.role, driverSearch || undefined);
    setDrivers(data);
    setSelectedDriverId((prev) => prev || (data[0] ? String(data[0].id) : ""));
  }, [actor.id, actor.role, driverSearch]);

  const loadHarvests = useCallback(async () => {
    if (!token) {
      setHarvests([]);
      setEligibility({});
      return;
    }
    const data = await hasilPanenApi.mandorHarvests(token, {});
    const approved = data.filter((item) => item.status === "APPROVED");
    setHarvests(approved);

    const pairs = await Promise.all(
      approved.map(async (item) => {
        try {
          const res = await hasilPanenApi.transportEligibility(item.harvestId);
          return [item.harvestId, res] as const;
        } catch {
          return null;
        }
      }),
    );

    setEligibility(Object.fromEntries(pairs.filter((pair): pair is readonly [string, TransportEligibility] => pair !== null)));
  }, [token]);

  const loadOngoing = useCallback(async () => {
    setOngoing(await pengirimanApi.ongoing(actor.id, actor.role));
  }, [actor.id, actor.role]);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      await Promise.all([loadDrivers(), loadHarvests(), loadOngoing()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data pengiriman");
    }
  }, [loadDrivers, loadHarvests, loadOngoing]);

  const runMandorAction = async (action: () => Promise<void>, fallback: string) => {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : fallback);
    }
  };

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => void loadAll(), 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [loadAll]);

  const toggleHarvest = (harvestId: string) => {
    setSelectedHarvestIds((prev) =>
      prev.includes(harvestId) ? prev.filter((id) => id !== harvestId) : [...prev, harvestId],
    );
  };

  const assign = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await pengirimanApi.assignDriver(actor.id, actor.role, {
        driverId: Number(selectedDriverId),
        harvestItems: selectedHarvestIds.map((harvestId) => ({ harvestId })),
      });
      setSelectedHarvestIds([]);
      setMessage("Pengiriman berhasil dibuat.");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat pengiriman");
    }
  };

  const processMandor = async (pengirimanId: number, action: "approve" | "reject") => {
    setError(null);
    try {
      if (action === "approve") {
        await pengirimanApi.approveByMandor(actor.id, actor.role, pengirimanId);
        setMessage("Pengiriman disetujui Mandor.");
      } else {
        const reason = prompt("Alasan penolakan:");
        if (!reason) return;
        await pengirimanApi.rejectByMandor(actor.id, actor.role, pengirimanId, reason);
        setMessage("Pengiriman ditolak Mandor.");
      }
      await loadOngoing();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Aksi Mandor gagal");
    }
  };

  const addManualHarvest = () => {
    const value = manualHarvestId.trim();
    if (!value) return;
    setSelectedHarvestIds((prev) => prev.includes(value) ? prev : [...prev, value]);
    setManualHarvestId("");
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <section className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
        <h3 className="text-base font-semibold text-slate-100">Buat Pengiriman</h3>
        <form className="mt-3 space-y-3" onSubmit={assign}>
          <label className="block text-sm text-slate-300">
            Supir
            <div className="mt-1 grid grid-cols-[1fr_auto] gap-2">
              <input
                className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                placeholder="Cari nama supir"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
              />
              <button className="rounded-md border border-slate-500 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800" type="button" onClick={() => void runMandorAction(loadDrivers, "Gagal mencari supir")}>
                Cari
              </button>
            </div>
          </label>
          <select
            className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            required
          >
            <option value="">Pilih supir</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>{driver.nama ?? driver.username ?? `Supir #${driver.id}`}</option>
            ))}
          </select>

          <div className="rounded-md border border-slate-700 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-200">Panen Approved</p>
              <button className="text-xs text-emerald-300 hover:text-emerald-200" type="button" onClick={() => void runMandorAction(loadHarvests, "Gagal memuat panen approved")}>
                Refresh
              </button>
            </div>
            {!token && (
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                <input
                  className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100"
                  placeholder="UUID harvest approved"
                  value={manualHarvestId}
                  onChange={(e) => setManualHarvestId(e.target.value)}
                />
                <button className="rounded-md border border-slate-500 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800" type="button" onClick={addManualHarvest}>
                  Tambah
                </button>
              </div>
            )}
            <div className="mt-2 max-h-64 space-y-2 overflow-auto">
              {!token && selectedHarvestIds.map((harvestId) => (
                <label key={harvestId} className="flex gap-2 rounded-md border border-slate-700 bg-slate-900/70 p-2 text-sm text-slate-200">
                  <input type="checkbox" checked onChange={() => toggleHarvest(harvestId)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{harvestId}</span>
                    <span className="text-xs text-slate-400">Manual input</span>
                  </span>
                </label>
              ))}
              {harvests.map((harvest) => {
                const detail = eligibility[harvest.harvestId];
                return (
                  <label key={harvest.harvestId} className="flex gap-2 rounded-md border border-slate-700 bg-slate-900/70 p-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={selectedHarvestIds.includes(harvest.harvestId)}
                      onChange={() => toggleHarvest(harvest.harvestId)}
                      disabled={!detail?.eligible}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{harvest.harvestId}</span>
                      <span className="text-xs text-slate-400">{harvest.buruhName} | {formatKg(detail?.kilogram)}</span>
                    </span>
                  </label>
                );
              })}
              {harvests.length === 0 && selectedHarvestIds.length === 0 && <p className="text-sm text-slate-400">{token ? "Belum ada panen approved." : "Masukkan UUID harvest secara manual."}</p>}
            </div>
          </div>

          <div className="rounded-md bg-slate-900 p-3 text-sm text-slate-200">
            <p>Total pilihan: {formatKg(selectedWeight)} / 400 kg</p>
          </div>
          <button
            className="w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700"
            type="submit"
            disabled={!selectedDriverId || selectedHarvestIds.length === 0 || selectedWeight > 400}
          >
            Assign Supir
          </button>
        </form>
        <Feedback message={message} error={error} />
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">Pengiriman Berlangsung</h3>
          <button className="rounded-md border border-slate-500 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800" type="button" onClick={() => void runMandorAction(loadOngoing, "Gagal memuat pengiriman berlangsung")}>
            Refresh
          </button>
        </div>
        <ShipmentTable
          shipments={ongoing}
          action={(shipment) =>
            shipment.status === "TIBA_DI_TUJUAN" ? (
              <div className="flex gap-2">
                <button className="rounded bg-emerald-700 px-2 py-1 text-white hover:bg-emerald-600" onClick={() => void processMandor(shipment.id, "approve")}>Approve</button>
                <button className="rounded bg-red-700 px-2 py-1 text-white hover:bg-red-600" onClick={() => void processMandor(shipment.id, "reject")}>Reject</button>
              </div>
            ) : <span className="text-slate-500">-</span>
          }
        />
      </section>
    </div>
  );
}

function SupirPengiriman({ actor }: { actor: { id: number; role: Role } }) {
  const [active, setActive] = useState<Pengiriman[]>([]);
  const [history, setHistory] = useState<Pengiriman[]>([]);
  const [date, setDate] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadActive = useCallback(async () => {
    setActive(await pengirimanApi.driverShipments(actor.id, actor.role, actor.id));
  }, [actor.id, actor.role]);

  const loadHistory = useCallback(async () => {
    setHistory(await pengirimanApi.driverHistory(actor.id, actor.role, actor.id, { startDate: date || undefined, endDate: date || undefined }));
  }, [actor.id, actor.role, date]);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      await Promise.all([loadActive(), loadHistory()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat data supir");
    }
  }, [loadActive, loadHistory]);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => void loadAll(), 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [loadAll]);

  const update = async (shipment: Pengiriman) => {
    const target = nextStatus[shipment.status];
    if (!target) return;
    setError(null);
    try {
      await pengirimanApi.updateStatus(actor.id, actor.role, shipment.id, target);
      setMessage(`Status diubah ke ${statusLabels[target]}.`);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah status");
    }
  };

  return (
    <div className="space-y-4">
      <Feedback message={message} error={error} />
      <section className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">Tugas Pengiriman Aktif</h3>
          <button className="rounded-md border border-slate-500 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800" type="button" onClick={() => void loadActive()}>
            Refresh
          </button>
        </div>
        <ShipmentTable
          shipments={active}
          action={(shipment) => {
            const target = nextStatus[shipment.status];
            return target ? (
              <button className="rounded bg-emerald-700 px-2 py-1 text-white hover:bg-emerald-600" onClick={() => void update(shipment)}>
                {statusLabels[target]}
              </button>
            ) : <span className="text-slate-500">-</span>;
          }}
        />
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-100">Riwayat Pengiriman</h3>
          <div className="flex gap-2">
            <input className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <button className="rounded-md border border-slate-500 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800" type="button" onClick={() => void loadHistory()}>
              Filter
            </button>
          </div>
        </div>
        <ShipmentTable shipments={history} />
      </section>
    </div>
  );
}

function AdminPengiriman({ actor }: { actor: { id: number; role: Role } }) {
  const [shipments, setShipments] = useState<Pengiriman[]>([]);
  const [mandorName, setMandorName] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setShipments(await pengirimanApi.approvedForAdmin(actor.id, actor.role, { mandorName: mandorName || undefined, date: date || undefined }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat pengiriman admin");
    }
  }, [actor.id, actor.role, date, mandorName]);

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => void load(), 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [load]);

  const processAdmin = async (shipment: Pengiriman, action: "approve" | "reject" | "partial") => {
    setError(null);
    try {
      if (action === "approve") {
        await pengirimanApi.approveByAdmin(actor.id, actor.role, shipment.id);
        setMessage("Pengiriman disetujui Admin.");
      } else if (action === "reject") {
        const reason = prompt("Alasan penolakan:");
        if (!reason) return;
        await pengirimanApi.rejectByAdmin(actor.id, actor.role, shipment.id, reason);
        setMessage("Pengiriman ditolak Admin.");
      } else {
        const kgText = prompt(`Kilogram diakui, maksimal kurang dari ${shipment.totalWeightKg}:`);
        const reason = prompt("Alasan penolakan parsial:");
        const kg = Number(kgText);
        if (!reason || !Number.isFinite(kg)) return;
        await pengirimanApi.partialRejectByAdmin(actor.id, actor.role, shipment.id, kg, reason);
        setMessage("Pengiriman ditolak parsial.");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Aksi Admin gagal");
    }
  };

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-950/50 p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-100">Approval Pabrik</h3>
          <p className="text-sm text-slate-400">Daftar pengiriman yang sudah disetujui Mandor.</p>
        </div>
        <div className="grid gap-2 md:grid-cols-[180px_160px_auto]">
          <input className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100" placeholder="Nama mandor" value={mandorName} onChange={(e) => setMandorName(e.target.value)} />
          <input className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="rounded-md border border-slate-500 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800" type="button" onClick={() => void load()}>
            Filter
          </button>
        </div>
      </div>
      <Feedback message={message} error={error} />
      <ShipmentTable
        shipments={shipments}
        action={(shipment) => (
          <div className="flex flex-wrap gap-2">
            <button className="rounded bg-emerald-700 px-2 py-1 text-white hover:bg-emerald-600" onClick={() => void processAdmin(shipment, "approve")}>Approve</button>
            <button className="rounded bg-amber-700 px-2 py-1 text-white hover:bg-amber-600" onClick={() => void processAdmin(shipment, "partial")}>Partial</button>
            <button className="rounded bg-red-700 px-2 py-1 text-white hover:bg-red-600" onClick={() => void processAdmin(shipment, "reject")}>Reject</button>
          </div>
        )}
      />
    </section>
  );
}

function ShipmentTable({
  shipments,
  action,
}: {
  shipments: Pengiriman[];
  action?: (shipment: Pengiriman) => React.ReactNode;
}) {
  return (
    <div className="overflow-auto rounded-lg border border-slate-700">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-800 text-slate-200">
          <tr>
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Mandor</th>
            <th className="p-2 text-left">Supir</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Total</th>
            <th className="p-2 text-left">Harvest Items</th>
            <th className="p-2 text-left">Alasan</th>
            {action && <th className="p-2 text-left">Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => (
            <tr key={shipment.id} className="border-t border-slate-700 text-slate-100">
              <td className="p-2">#{shipment.id}</td>
              <td className="p-2">{shipment.mandorId}</td>
              <td className="p-2">{shipment.driverId}</td>
              <td className="p-2">{statusLabels[shipment.status] ?? shipment.status}</td>
              <td className="p-2">{formatKg(shipment.totalWeightKg)}</td>
              <td className="max-w-[260px] p-2 text-xs text-slate-300">
                {(shipment.items ?? []).map((item) => `${item.harvestId} (${formatKg(item.weightKg)})`).join(" | ") || "-"}
              </td>
              <td className="p-2">{shipment.rejectionReason ?? "-"}</td>
              {action && <td className="p-2">{action(shipment)}</td>}
            </tr>
          ))}
          {shipments.length === 0 && (
            <tr>
              <td className="p-4 text-center text-slate-400" colSpan={action ? 8 : 7}>Tidak ada data.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Feedback({ message, error }: { message: string | null; error: string | null }) {
  return (
    <div className="mt-3 space-y-2">
      {message && <p className="rounded-md border border-emerald-400/30 bg-emerald-500/10 p-2 text-sm text-emerald-200">{message}</p>}
      {error && <p className="rounded-md border border-red-400/30 bg-red-500/10 p-2 text-sm text-red-200">{error}</p>}
    </div>
  );
}
