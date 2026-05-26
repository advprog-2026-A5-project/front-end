import type { Role } from "@/types/auth";
import type {
  PayrollRequest,
  PayrollResponse,
  PayrollUpdateStatusRequest,
  TopUpResponse,
  UpahRequest,
  UpahResponse,
  WalletResponse,
} from "@/types/payment";
// import { env } from "@/config/env";
import { request } from "./httpClient";

const base = "https://www.mysawit-payment.my.id";

const roleHeader = (role: Role) => ({ "X-User-Role": role });
const userIdHeader = (userId: number) => ({ "X-User-Id": String(userId) });
const bearerHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export const paymentApi = {
  getPayrolls: (role: Role, userId: number, token: string) =>
    request<PayrollResponse[]>(`${base}/api/payroll`, {
      headers: { ...roleHeader(role), ...userIdHeader(userId), ...bearerHeader(token) },
    }),
  getPayroll: (role: Role, userId: number, id: number, token: string) =>
    request<PayrollResponse>(`${base}/api/payroll/${id}`, {
      headers: { ...roleHeader(role), ...userIdHeader(userId), ...bearerHeader(token) },
    }),
  createPayroll: (role: Role, body: PayrollRequest, token: string) =>
    request<PayrollResponse>(`${base}/api/payroll/create`, {
      method: "POST",
      headers: { ...roleHeader(role), ...bearerHeader(token) },
      body: JSON.stringify(body),
    }),
  updatePayrollStatus: (role: Role, body: PayrollUpdateStatusRequest, token: string) =>
    request<PayrollResponse>(`${base}/api/payroll/update`, {
      method: "PUT",
      headers: { ...roleHeader(role), ...bearerHeader(token) },
      body: JSON.stringify(body),
    }),
  getUpah: (role: Role, token: string) =>
    request<UpahResponse[]>(`${base}/api/upah`, {
      headers: { ...roleHeader(role), ...bearerHeader(token) },
    }),
  updateUpah: (role: Role, body: UpahRequest, token: string) =>
    request<UpahResponse>(`${base}/api/upah/update`, {
      method: "PUT",
      headers: { ...roleHeader(role), ...bearerHeader(token) },
      body: JSON.stringify(body),
    }),
  getWallet: (userId: number, token: string) =>
    request<WalletResponse>(`${base}/api/wallet/me`, {
      headers: { ...userIdHeader(userId), ...bearerHeader(token) },
    }),
  topUp: (role: Role, amount: number, token: string) =>
    request<TopUpResponse>(`${base}/api/wallet/topup`, {
      method: "POST",
      headers: { ...roleHeader(role), ...bearerHeader(token) },
      body: JSON.stringify({ amount }),
    }),
};
