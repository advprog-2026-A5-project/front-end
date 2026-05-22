import { env } from "@/config/env";
import type { AssignDriverRequest, Pengiriman, PengirimanUserSummary, StatusPengiriman } from "@/types/pengiriman";
import type { Role } from "@/types/auth";
import { request } from "./httpClient";

const base = env.pengirimanBaseUrl;

const userHeaders = (userId: number, role: Role) => ({
  "X-User-Id": String(userId),
  "X-User-Role": role,
});

const withQuery = (path: string, params: Record<string, string | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return `${base}${path}${suffix}`;
};

export const pengirimanApi = {
  drivers: (userId: number, role: Role, searchName?: string) =>
    request<PengirimanUserSummary[]>(withQuery("/api/pengiriman/drivers", { searchName }), {
      headers: userHeaders(userId, role),
    }),
  assignDriver: (userId: number, role: Role, body: AssignDriverRequest) =>
    request<Pengiriman>(`${base}/api/pengiriman/assign`, {
      method: "POST",
      headers: userHeaders(userId, role),
      body: JSON.stringify(body),
    }),
  ongoing: (userId: number, role: Role) =>
    request<Pengiriman[]>(`${base}/api/pengiriman/ongoing`, {
      headers: userHeaders(userId, role),
    }),
  driverShipments: (userId: number, role: Role, driverId: number) =>
    request<Pengiriman[]>(`${base}/api/pengiriman/driver/${driverId}`, {
      headers: userHeaders(userId, role),
    }),
  driverHistory: (userId: number, role: Role, driverId: number, params: { startDate?: string; endDate?: string }) =>
    request<Pengiriman[]>(withQuery(`/api/pengiriman/driver/${driverId}/history`, params), {
      headers: userHeaders(userId, role),
    }),
  updateStatus: (userId: number, role: Role, pengirimanId: number, newStatus: StatusPengiriman) =>
    request<Pengiriman>(`${base}/api/pengiriman/${pengirimanId}/status`, {
      method: "PATCH",
      headers: userHeaders(userId, role),
      body: JSON.stringify({ newStatus }),
    }),
  approveByMandor: (userId: number, role: Role, pengirimanId: number) =>
    request<Pengiriman>(`${base}/api/pengiriman/${pengirimanId}/mandor/approve`, {
      method: "PATCH",
      headers: userHeaders(userId, role),
    }),
  rejectByMandor: (userId: number, role: Role, pengirimanId: number, rejectionReason: string) =>
    request<Pengiriman>(`${base}/api/pengiriman/${pengirimanId}/mandor/reject`, {
      method: "PATCH",
      headers: userHeaders(userId, role),
      body: JSON.stringify({ rejectionReason }),
    }),
  approvedForAdmin: (userId: number, role: Role, params: { mandorName?: string; date?: string }) =>
    request<Pengiriman[]>(withQuery("/api/pengiriman/admin/approved-mandor", params), {
      headers: userHeaders(userId, role),
    }),
  approveByAdmin: (userId: number, role: Role, pengirimanId: number) =>
    request<Pengiriman>(`${base}/api/pengiriman/${pengirimanId}/admin/approve`, {
      method: "PATCH",
      headers: userHeaders(userId, role),
    }),
  rejectByAdmin: (userId: number, role: Role, pengirimanId: number, rejectionReason: string) =>
    request<Pengiriman>(`${base}/api/pengiriman/${pengirimanId}/admin/reject`, {
      method: "PATCH",
      headers: userHeaders(userId, role),
      body: JSON.stringify({ rejectionReason }),
    }),
  partialRejectByAdmin: (userId: number, role: Role, pengirimanId: number, acknowledgedWeightKg: number, rejectionReason: string) =>
    request<Pengiriman>(`${base}/api/pengiriman/${pengirimanId}/admin/partial-reject`, {
      method: "PATCH",
      headers: userHeaders(userId, role),
      body: JSON.stringify({ acknowledgedWeightKg, rejectionReason }),
    }),
};
