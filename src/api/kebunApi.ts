import type { Kebun, KebunDetail, MandorKebunAssignment } from "@/types/kebun";
import { env } from "@/config/env";
import { request } from "./httpClient";

const proxyBase = "/api/kebun";
const directBase = env.kebunBaseUrl;

export const kebunApi = {
  list: (token: string, filters?: { name?: string; code?: string }) => {
    const query = new URLSearchParams();
    if (filters?.name) query.set("name", filters.name);
    if (filters?.code) query.set("code", filters.code);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<Kebun[]>(`${proxyBase}${suffix}`, { token });
  },
  getByCode: (token: string, code: string) => request<Kebun>(`${proxyBase}/${code}`, { token }),
  getDetail: (token: string, code: string) => request<KebunDetail>(`${proxyBase}/${code}/detail`, { token }),
  create: (token: string, kebun: Kebun) =>
    request<Kebun>(`${proxyBase}`, { method: "POST", body: JSON.stringify(kebun), token }),
  update: (token: string, code: string, kebun: Kebun) =>
    request<Kebun>(`${proxyBase}/${code}`, { method: "PUT", body: JSON.stringify(kebun), token }),
  remove: (token: string, code: string) => request<void>(`${proxyBase}/${code}`, { method: "DELETE", token }),
  assignMandor: (token: string, code: string, mandorId: string) =>
    request<{ message: string }>(`${proxyBase}/${code}/mandor/assign`, {
      method: "POST",
      body: JSON.stringify({ mandorId }),
      token,
    }),
  reassignMandor: (token: string, code: string, mandorId: string, replacementKebunCode: string) =>
    request<{ message: string }>(`${proxyBase}/${code}/mandor/reassign`, {
      method: "POST",
      body: JSON.stringify({ mandorId, replacementKebunCode }),
      token,
    }),
  assignSupir: (token: string, code: string, supirId: string) =>
    request<{ message: string }>(`${proxyBase}/${code}/supir/assign`, {
      method: "POST",
      body: JSON.stringify({ supirId }),
      token,
    }),
  reassignSupir: (token: string, code: string, supirId: string, replacementKebunCode: string) =>
    request<{ message: string }>(`${proxyBase}/${code}/supir/reassign`, {
      method: "POST",
      body: JSON.stringify({ supirId, replacementKebunCode }),
      token,
    }),
  getMandorKebun: (mandorId: number, token?: string) =>
    request<MandorKebunAssignment>(`${directBase}/internal/mandors/${mandorId}/kebun`, { token }),
};
