const dev = process.env.NODE_ENV !== "production";
const defaultGoogleClientId = "386689511019-al4hcp7i2ddn95bg82m3ua1s2a7e00pn.apps.googleusercontent.com";

const pick = (literal: string | undefined, devFallback: string) =>
  literal?.trim() || (dev ? devFallback : "");

const pickNumber = (literal: string | undefined, fallback: number) => {
  if (literal?.trim()) {
    const parsed = Number(literal);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
};

export const env = {
  authBaseUrl: pick(
    process.env.NEXT_PUBLIC_AUTH_API_URL,
    process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ?? "",
  ),
  kebunBaseUrl: pick(
    process.env.NEXT_PUBLIC_KEBUN_API_URL,
    process.env.NEXT_PUBLIC_KEBUN_API_BASE_URL ?? "",
  ),
  hasilPanenBaseUrl: pick(
    process.env.NEXT_PUBLIC_HASIL_PANEN_API_URL,
    process.env.NEXT_PUBLIC_HASIL_PANEN_API_BASE_URL ?? "http://localhost:8082",
  ),
  maxUploadSizeMb: pickNumber(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB, 5),
  paymentBaseUrl: pick(process.env.NEXT_PUBLIC_PAYMENT_API_URL, "http://localhost:8080"),
  pengirimanBaseUrl: pick(process.env.NEXT_PUBLIC_PENGIRIMAN_API_BASE_URL, "http://localhost:8083"),
  googleClientId: pick(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, defaultGoogleClientId),
};
