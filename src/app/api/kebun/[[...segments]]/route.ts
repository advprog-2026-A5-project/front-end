import { createForwardApiHandlers } from "../../_proxy/forwardApi";

const isProduction = process.env.NODE_ENV === "production";

function resolveKebunBaseUrl() {
  const configured =
    process.env.KEBUN_API_BASE_URL ?? process.env.NEXT_PUBLIC_KEBUN_API_BASE_URL;
  if (configured && configured.trim().length > 0) return configured;
  if (!isProduction) return "http://localhost:8081";
  return null;
}

const handlers = createForwardApiHandlers({
  resolveBaseUrl: resolveKebunBaseUrl,
  buildPath: (segments) => {
    const suffix = segments && segments.length > 0 ? `/${segments.join("/")}` : "";
    return `/kebun${suffix}`;
  },
  missingBaseUrlMessage:
    "Missing kebun API base URL. Set KEBUN_API_BASE_URL (recommended) or NEXT_PUBLIC_KEBUN_API_BASE_URL.",
  unreachableMessage: "Cannot reach Kebun service. Check your configured KEBUN_API_BASE_URL.",
});

export const { GET, POST, PUT, DELETE } = handlers;
