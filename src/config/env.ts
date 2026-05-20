const isProduction = process.env.NODE_ENV === "production";

const readEnv = (key: string, fallback: string) => {
  const value = process.env[key];
  if (value && value.trim().length > 0) return value;
  if (!isProduction) return fallback;
  return "";
};

export const env = {
  authBaseUrl: readEnv("NEXT_PUBLIC_AUTH_API_BASE_URL", "http://localhost:8080"),
  kebunBaseUrl: readEnv("NEXT_PUBLIC_KEBUN_API_BASE_URL", "http://localhost:8081"),
  hasilPanenBaseUrl: readEnv("NEXT_PUBLIC_HASIL_PANEN_API_BASE_URL", "http://localhost:8082"),
};
