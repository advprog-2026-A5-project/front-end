import type { Kebun, MandorKebunAssignment } from "@/types/kebun";
import { env } from "@/config/env";
import { request } from "./httpClient";

const base = env.kebunBaseUrl;

export const kebunApi = {
  list: (name = "") => request<Kebun[]>(`${base}/kebun${name ? `?name=${encodeURIComponent(name)}` : ""}`),
  getByCode: (code: string) => request<Kebun>(`${base}/kebun/${code}`),
  create: (kebun: Kebun) =>
    request<Kebun>(`${base}/kebun`, { method: "POST", body: JSON.stringify(kebun) }),
  update: (code: string, kebun: Kebun) =>
    request<Kebun>(`${base}/kebun/${code}`, { method: "PUT", body: JSON.stringify(kebun) }),
  remove: (code: string) => request<void>(`${base}/kebun/${code}`, { method: "DELETE" }),
  getMandorKebun: (mandorId: number, token?: string) =>
    request<MandorKebunAssignment>(`${base}/internal/mandors/${mandorId}/kebun`, { token }),
};
