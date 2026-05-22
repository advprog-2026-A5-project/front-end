export type StatusPengiriman =
  | "MEMUAT"
  | "MENGIRIM"
  | "TIBA_DI_TUJUAN"
  | "APPROVED_MANDOR"
  | "REJECTED_MANDOR"
  | "APPROVED_ADMIN"
  | "REJECTED_ADMIN"
  | "PARTIALLY_REJECTED_ADMIN";

export interface PengirimanItem {
  id: number;
  harvestId: string;
  weightKg: number;
}

export interface Pengiriman {
  id: number;
  driverId: number;
  mandorId: number;
  items: PengirimanItem[];
  status: StatusPengiriman;
  totalWeightKg: number;
  rejectionReason?: string | null;
  acknowledgedWeightKg?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PengirimanUserSummary {
  id: number;
  username?: string;
  email?: string;
  nama?: string;
  role?: string;
}

export interface AssignDriverRequest {
  driverId: number;
  harvestItems: Array<{ harvestId: string }>;
}
