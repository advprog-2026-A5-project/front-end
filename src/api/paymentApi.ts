import type { Role } from "@/types/auth";
import type {
  PayrollRequest,
  PayrollResponse,
  PayrollUpdateStatusRequest,
  UpahRequest,
  UpahResponse,
  WalletResponse,
} from "@/types/payment";
import { env } from "@/config/env";
import { request } from "./httpClient";

// TODO: ntar ditaro & setup ke env
const base = "https://mysawit-payment-gateway-main-1069d73.d2.zuplo.dev";

const roleHeader = (role: Role) => ({ "X-User-Role": role });
const userIdHeader = (userId: number) => ({ "X-User-Id": String(userId) });

export const paymentApi = {
  getPayrolls: (role: Role, userId: number) =>
    request<PayrollResponse[]>(`${base}/api/payroll`, {
      headers: { ...roleHeader(role), ...userIdHeader(userId) },
    }),
  getPayroll: (role: Role, userId: number, id: number) =>
    request<PayrollResponse>(`${base}/api/payroll/${id}`, {
      headers: { ...roleHeader(role), ...userIdHeader(userId) },
    }),
  createPayroll: (role: Role, body: PayrollRequest) =>
    request<PayrollResponse>(`${base}/api/payroll/create`, {
      method: "POST",
      headers: roleHeader(role),
      body: JSON.stringify(body),
    }),
  updatePayrollStatus: (role: Role, body: PayrollUpdateStatusRequest) =>
    request<PayrollResponse>(`${base}/api/payroll/update`, {
      method: "PUT",
      headers: roleHeader(role),
      body: JSON.stringify(body),
    }),
  getUpah: (role: Role) =>
    request<UpahResponse[]>(`${base}/api/upah`, {
      headers: roleHeader(role),
    }),
  updateUpah: (role: Role, body: UpahRequest) =>
    request<UpahResponse>(`${base}/api/upah`, {
      method: "PUT",
      headers: roleHeader(role),
      body: JSON.stringify(body),
    }),
  getWallet: (userId: number) =>
    request<WalletResponse>(`${base}/api/wallet/me`, {
      headers: userIdHeader(userId),
    }),
  topUp: (role: Role, amount: number) =>
    request<WalletResponse>(`${base}/api/wallet/topup`, {
      method: "POST",
      headers: roleHeader(role),
      body: JSON.stringify({ amount }),
    }),
};
