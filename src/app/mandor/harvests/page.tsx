"use client";

import { hasilPanenApi } from "@/api/hasilPanenApi";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/auth/AuthContext";
import type { MandorHarvestItem } from "@/types/harvest";
import { useEffect, useState } from "react";

export default function MandorHarvestPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<MandorHarvestItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [buruhName, setBuruhName] = useState("");
  const [eligibility, setEligibility] = useState<Record<string, string>>({});

  const load = async () => {
    if (!token) return;
    try {
      const data = await hasilPanenApi.mandorHarvests(token, { buruhName: buruhName || undefined });
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed loading harvests");
    }
  };

  useEffect(() => { void load(); }, [token, buruhName]);

  const approve = async (id: string) => {
    if (!token) return;
    try {
      await hasilPanenApi.approve(token, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    }
  };

  const reject = async (id: string) => {
    if (!token) return;
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try {
      await hasilPanenApi.reject(token, id, reason);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reject failed");
    }
  };

  const checkEligibility = async (id: string) => {
    try {
      const res = await hasilPanenApi.transportEligibility(id);
      setEligibility((prev) => ({ ...prev, [id]: `${res.eligible} (${res.status})` }));
    } catch (e) {
      setEligibility((prev) => ({ ...prev, [id]: e instanceof Error ? e.message : "Failed" }));
    }
  };

  return (
    <AuthGuard roles={["MANDOR"]}>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Mandor Harvest Review</h2>
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <input className="rounded border p-2" placeholder="Filter by Buruh name" value={buruhName} onChange={(e) => setBuruhName(e.target.value)} />
        <table className="min-w-full border text-sm">
          <thead className="bg-slate-50"><tr><th className="p-2 text-left">ID</th><th className="p-2 text-left">Buruh</th><th className="p-2 text-left">Date</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Actions</th><th className="p-2 text-left">Eligibility</th></tr></thead>
          <tbody>
            {items.map((x) => (
              <tr key={x.harvestId} className="border-t">
                <td className="p-2">{x.harvestId}</td><td className="p-2">{x.buruhName} ({x.buruhId})</td><td className="p-2">{x.harvestDate}</td><td className="p-2">{x.status}</td>
                <td className="space-x-2 p-2">
                  {x.status === "PENDING" && <button className="rounded bg-green-700 px-2 py-1 text-white" onClick={() => approve(x.harvestId)}>Approve</button>}
                  {x.status === "PENDING" && <button className="rounded bg-red-700 px-2 py-1 text-white" onClick={() => reject(x.harvestId)}>Reject</button>}
                  <button className="rounded bg-slate-700 px-2 py-1 text-white" onClick={() => checkEligibility(x.harvestId)}>Check</button>
                </td>
                <td className="p-2">{eligibility[x.harvestId] ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AuthGuard>
  );
}
