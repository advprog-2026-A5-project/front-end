import { createForwardApiHandlers } from "../../_proxy/forwardApi";

const isProduction = process.env.NODE_ENV === "production";

function resolveHasilPanenBaseUrl() {
  const configured =
    process.env.HASIL_PANEN_API_URL ??
    process.env.NEXT_PUBLIC_HASIL_PANEN_API_URL ??
    process.env.HASIL_PANEN_API_BASE_URL ??
    process.env.NEXT_PUBLIC_HASIL_PANEN_API_BASE_URL;
  if (configured && configured.trim().length > 0) return configured;
  if (!isProduction) return "http://localhost:8082";
  return null;
}

const handlers = createForwardApiHandlers({
  resolveBaseUrl: resolveHasilPanenBaseUrl,
  missingBaseUrlMessage:
    "Missing hasil panen API URL. Set NEXT_PUBLIC_HASIL_PANEN_API_URL (canonical) or HASIL_PANEN_API_URL.",
  unreachableMessage:
    "Cannot reach Hasil Panen service. Check your configured NEXT_PUBLIC_HASIL_PANEN_API_URL.",
});

export const { GET, POST, PUT, DELETE } = handlers;
