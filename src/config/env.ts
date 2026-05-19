const readEnv = (viteKey: string, nextKey: string, fallback: string) =>
  process.env[viteKey] ?? process.env[nextKey] ?? fallback;

export const env = {
  authBaseUrl: readEnv("VITE_AUTH_API_BASE_URL", "NEXT_PUBLIC_AUTH_API_BASE_URL", "http://localhost:8080"),
  kebunBaseUrl: readEnv("VITE_KEBUN_API_BASE_URL", "NEXT_PUBLIC_KEBUN_API_BASE_URL", "http://localhost:8081"),
  hasilPanenBaseUrl: readEnv(
    "VITE_HASIL_PANEN_API_BASE_URL",
    "NEXT_PUBLIC_HASIL_PANEN_API_BASE_URL",
    "http://localhost:8082",
  ),
};
