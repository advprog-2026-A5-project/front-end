import { ApiError } from "@/api/httpClient";
import type { HarvestStatus } from "@/types/harvest";

const DATE_LOCALE = "id-ID";

export function formatHarvestDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(DATE_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(DATE_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeHarvestStatus(value?: string | null): HarvestStatus | "" {
  if (value === "PENDING" || value === "APPROVED" || value === "REJECTED") {
    return value;
  }
  return "";
}

export function mapHarvestErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 409) {
    return "Laporan panen hari ini sudah dibuat. Silakan tunggu besok untuk membuat laporan baru.";
  }
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return fallback;
}
