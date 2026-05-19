"use client";

import { hasilPanenApi } from "@/api/hasilPanenApi";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/auth/AuthContext";
import type { HarvestStatus, MyHarvestItem } from "@/types/harvest";
import { useEffect, useState } from "react";

export default function BuruhHarvestPage() {
  const { token } = useAuth();
  const [kilogram, setKilogram] = useState(0);
  const [reportText, setReportText] = useState("");
  const [photosText, setPhotosText] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<MyHarvestItem[]>([]);
  const [filterStatus, setFilterStatus] = useState("");

  const load = async () => {
    if (!token) return;
    const data = await hasilPanenApi.myHarvests(token, { status: filterStatus || undefined });
    setItems(data);
  };

  useEffect(() => {
    void load();
  }, [token, filterStatus]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      await hasilPanenApi.submit(token, {
        kilogram,
        reportText,
        photos: photosText.split("\n").map((v) => v.trim()).filter(Boolean),
      });
      setStatus("Harvest submitted");
      setReportText("");
      setPhotosText("");
      await load();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Submit failed");
    }
  };

  return (
    <AuthGuard roles={["BURUH"]}>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Buruh Harvests</h2>
        {status && <p className="rounded bg-slate-100 p-2 text-sm">{status}</p>}
        <form className="space-y-2 rounded border p-3" onSubmit={submit}>
          <input className="w-full rounded border p-2" type="number" placeholder="Kilogram" value={kilogram} onChange={(e) => setKilogram(Number(e.target.value))} required />
          <textarea className="w-full rounded border p-2" placeholder="Berita/deskripsi" value={reportText} onChange={(e) => setReportText(e.target.value)} required />
          <textarea className="w-full rounded border p-2" placeholder="Photo refs (one per line)" value={photosText} onChange={(e) => setPhotosText(e.target.value)} />
          <button className="rounded bg-green-700 px-3 py-2 text-white" type="submit">Submit Harvest</button>
        </form>

        <div className="space-x-2">
          <label>Status filter:</label>
          <select className="rounded border p-1" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All</option><option value="PENDING">PENDING</option><option value="APPROVED">APPROVED</option><option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <table className="min-w-full border text-sm">
          <thead className="bg-slate-50"><tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Date</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Rejection</th></tr></thead>
          <tbody>
            {items.map((x) => (
              <tr key={x.harvestId} className="border-t"><td className="p-2">{x.harvestId}</td><td className="p-2">{x.harvestDate}</td><td className="p-2">{x.status as HarvestStatus}</td><td className="p-2">{x.rejectionReason ?? "-"}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </AuthGuard>
  );
}
