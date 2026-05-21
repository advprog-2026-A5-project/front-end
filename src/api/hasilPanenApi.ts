import type {
  HarvestSubmissionRequest,
  HarvestSubmissionResponse,
  MandorHarvestItem,
  MyHarvestItem,
  TransportEligibility,
} from "@/types/harvest";
import { request } from "./httpClient";

const base = "/api/hasil-panen";

export const hasilPanenApi = {
  submit: (token: string, body: HarvestSubmissionRequest) =>
    request<HarvestSubmissionResponse>(`${base}/harvests`, {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),
  myHarvests: (token: string, params: { startDate?: string; endDate?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    if (params.status) query.set("status", params.status);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<MyHarvestItem[]>(`${base}/harvests/me${suffix}`, { token });
  },
  mandorHarvests: (token: string, params: { harvestDate?: string; buruhName?: string }) => {
    const query = new URLSearchParams();
    if (params.harvestDate) query.set("harvestDate", params.harvestDate);
    if (params.buruhName) query.set("buruhName", params.buruhName);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<MandorHarvestItem[]>(`${base}/mandor/harvests${suffix}`, { token });
  },
  approve: (token: string, harvestId: string) =>
    request<void>(`${base}/harvests/${harvestId}/approve`, { method: "POST", token }),
  reject: (token: string, harvestId: string, reason: string) =>
    request<void>(`${base}/harvests/${harvestId}/reject`, {
      method: "POST",
      token,
      body: JSON.stringify({ reason }),
    }),
  transportEligibility: (harvestId: string) =>
    request<TransportEligibility>(`${base}/internal/harvests/${harvestId}/transport-eligibility`),
  health: () => request<{ status: string }>(`${base}/health`),
};
