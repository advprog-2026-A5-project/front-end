"use client";

import { useEffect, useState } from "react";

interface HarvestDecisionModalProps {
  title: string;
  description: string;
  mode: "approve" | "reject";
  loading: boolean;
  open: boolean;
  onClose: () => void;
  onSubmit: (reason?: string) => Promise<void> | void;
}

export function HarvestDecisionModal({
  title,
  description,
  mode,
  loading,
  open,
  onClose,
  onSubmit,
}: HarvestDecisionModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason("");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-900 p-5">
        <h4 className="text-lg font-semibold text-slate-100">{title}</h4>
        <p className="mt-2 text-sm text-slate-300">{description}</p>

        {mode === "reject" && (
          <div className="mt-4">
            <label className="block text-sm text-slate-200">
              Alasan penolakan
              <textarea
                className="mt-1 min-h-24 w-full rounded-xl border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
                data-testid="reject-reason-input"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            className="rounded-lg border border-slate-500 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            disabled={loading}
            type="button"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              mode === "approve" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
            } disabled:cursor-not-allowed disabled:opacity-70`}
            disabled={loading}
            type="button"
            onClick={async () => {
              if (mode === "reject" && !reason.trim()) {
                setError("Alasan penolakan wajib diisi.");
                return;
              }
              setError(null);
              await onSubmit(mode === "reject" ? reason.trim() : undefined);
            }}
          >
            {loading ? "Memproses..." : mode === "approve" ? "Setujui" : "Tolak"}
          </button>
        </div>
      </div>
    </div>
  );
}
