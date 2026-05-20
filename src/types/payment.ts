export type PayrollStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type UpahRole = "BURUH" | "MANDOR" | "SUPIR";

export interface PayrollResponse {
  id: number;
  userId: number;
  status: PayrollStatus;
  amount: number;
  createdAt: string;
}

export interface PayrollRequest {
  userId: number;
  role: UpahRole;
  kilogram: number;
}

export interface PayrollUpdateStatusRequest {
  id: number;
  status: PayrollStatus;
  alasanPenolakan: string;
}

export interface UpahResponse {
  role: UpahRole;
  upahPerKg: number;
}

export interface UpahRequest {
  role: UpahRole;
  upahPerKg: number;
}

export interface WalletResponse {
  userId: number;
  balance: number;
}

export interface WalletTopUpRequest {
  amount: number;
}
