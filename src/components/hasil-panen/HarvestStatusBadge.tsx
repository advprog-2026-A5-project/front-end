"use client";

import type { HarvestStatus } from "@/types/harvest";

const STATUS_LABEL: Record<HarvestStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

const STATUS_CLASS: Record<HarvestStatus, string> = {
  PENDING: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  APPROVED: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  REJECTED: "border-red-400/40 bg-red-500/10 text-red-200",
};

export function HarvestStatusBadge({ status }: { status: HarvestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[status]}`}
      data-testid={`status-badge-${status.toLowerCase()}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function getStatusOptionLabel(status: "" | HarvestStatus) {
  if (!status) return "Semua";
  return STATUS_LABEL[status];
}
