import type { Kebun, KebunDetail, MandorKebunAssignment } from "@/types/kebun";
import { env } from "@/config/env";
import { request } from "./httpClient";

const proxyBase = "/api/kebun";
const directBase = env.kebunBaseUrl;

export const kebunApi = {
  list: (filters?: { name?: string; code?: string }) => {
    const query = new URLSearchParams();
    if (filters?.name) query.set("name", filters.name);
    if (filters?.code) query.set("code", filters.code);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<Kebun[]>(`${proxyBase}${suffix}`);
  },
  getByCode: (code: string) => request<Kebun>(`${proxyBase}/${code}`),
  getDetail: (code: string) => request<KebunDetail>(`${proxyBase}/${code}/detail`),
  create: (kebun: Kebun) =>
    request<Kebun>(`${proxyBase}`, { method: "POST", body: JSON.stringify(kebun) }),
  update: (code: string, kebun: Kebun) =>
    request<Kebun>(`${proxyBase}/${code}`, { method: "PUT", body: JSON.stringify(kebun) }),
  remove: (code: string) => request<void>(`${proxyBase}/${code}`, { method: "DELETE" }),
  assignMandor: (code: string, mandorId: string) =>
    request<{ message: string }>(`${proxyBase}/${code}/mandor/assign`, {
      method: "POST",
      body: JSON.stringify({ mandorId }),
    }),
  reassignMandor: (code: string, mandorId: string, replacementKebunCode: string) =>
    request<{ message: string }>(`${proxyBase}/${code}/mandor/reassign`, {
      method: "POST",
      body: JSON.stringify({ mandorId, replacementKebunCode }),
    }),
  assignSupir: (code: string, supirId: string) =>
    request<{ message: string }>(`${proxyBase}/${code}/supir/assign`, {
      method: "POST",
      body: JSON.stringify({ supirId }),
    }),
  reassignSupir: (code: string, supirId: string, replacementKebunCode: string) =>
    request<{ message: string }>(`${proxyBase}/${code}/supir/reassign`, {
      method: "POST",
      body: JSON.stringify({ supirId, replacementKebunCode }),
    }),
  getMandorKebun: (mandorId: number, token?: string) =>
    request<MandorKebunAssignment>(`${directBase}/internal/mandors/${mandorId}/kebun`, { token }),
};
