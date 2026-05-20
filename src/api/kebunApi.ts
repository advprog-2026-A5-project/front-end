import type { Kebun, MandorKebunAssignment } from "@/types/kebun";
import { env } from "@/config/env";
import { request } from "./httpClient";

const proxyBase = "/api/kebun";
const directBase = env.kebunBaseUrl;

export const kebunApi = {
  list: (name = "") =>
    request<Kebun[]>(`${proxyBase}${name ? `?name=${encodeURIComponent(name)}` : ""}`),
  getByCode: (code: string) => request<Kebun>(`${proxyBase}/${code}`),
  create: (kebun: Kebun) =>
    request<Kebun>(`${proxyBase}`, { method: "POST", body: JSON.stringify(kebun) }),
  update: (code: string, kebun: Kebun) =>
    request<Kebun>(`${proxyBase}/${code}`, { method: "PUT", body: JSON.stringify(kebun) }),
  remove: (code: string) => request<void>(`${proxyBase}/${code}`, { method: "DELETE" }),
  getMandorKebun: (mandorId: number, token?: string) =>
    request<MandorKebunAssignment>(`${directBase}/internal/mandors/${mandorId}/kebun`, { token }),
};
