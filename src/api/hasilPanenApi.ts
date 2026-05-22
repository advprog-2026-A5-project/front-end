import type {
  CreateHarvestMultipartInput,
  EligibleShipmentHarvest,
  HarvestDetail,
  HarvestSubmissionRequest,
  HarvestSubmissionResponse,
  MandorHarvestItem,
  MyHarvestItem,
  TransportEligibility,
} from "@/types/harvest";
import { request } from "./httpClient";

const base = "/api/hasil-panen";

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value.trim().length > 0) query.set(key, value);
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export const hasilPanenApi = {
  submit: (token: string, body: HarvestSubmissionRequest) =>
    request<HarvestSubmissionResponse>(`${base}/harvests`, {
      method: "POST",
      token,
      body: JSON.stringify(body),
    }),

  createMultipart: (token: string, body: CreateHarvestMultipartInput) => {
    const formData = new FormData();
    formData.append("kilogram", String(body.kilogram));
    formData.append("reportText", body.reportText);
    body.photos.forEach((file) => formData.append("photos", file));

    return request<HarvestSubmissionResponse>(`${base}/harvests`, {
      method: "POST",
      token,
      body: formData,
    });
  },

  getHarvestDetail: (token: string, harvestId: string) =>
    request<HarvestDetail>(`${base}/harvests/${harvestId}`, { token }),

  myHarvests: (token: string, params: { startDate?: string; endDate?: string; status?: string }) =>
    request<MyHarvestItem[]>(
      `${base}/harvests/me${buildQuery({
        startDate: params.startDate,
        endDate: params.endDate,
        status: params.status,
      })}`,
      { token },
    ),

  mandorHarvests: (token: string, params: { harvestDate?: string; buruhName?: string }) =>
    request<MandorHarvestItem[]>(
      `${base}/mandor/harvests${buildQuery({
        harvestDate: params.harvestDate,
        buruhName: params.buruhName,
      })}`,
      { token },
    ),

  mandorBuruhHarvests: (token: string, buruhId: string, params: { harvestDate?: string }) =>
    request<MandorHarvestItem[]>(
      `${base}/mandor/buruh/${buruhId}/harvests${buildQuery({
        harvestDate: params.harvestDate,
      })}`,
      { token },
    ),

  approve: (token: string, harvestId: string) =>
    request<void>(`${base}/harvests/${harvestId}/approve`, { method: "POST", token }),

  reject: (token: string, harvestId: string, reason: string) =>
    request<void>(`${base}/harvests/${harvestId}/reject`, {
      method: "POST",
      token,
      body: JSON.stringify({ reason }),
    }),

  eligibleForShipment: (token: string) =>
    request<EligibleShipmentHarvest[]>(`${base}/harvest-reports/eligible-for-shipment`, { token }),

  transportEligibility: (harvestId: string) =>
    request<TransportEligibility>(`${base}/internal/harvests/${harvestId}/transport-eligibility`),

  health: () => request<{ status: string }>(`${base}/health`),
};
