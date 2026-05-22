export type HarvestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface HarvestSubmissionRequest {
  kilogram: number;
  reportText: string;
  photos: string[];
}

export interface HarvestSubmissionResponse {
  harvestId: string;
  buruhId: number;
  mandorId: number;
  kebunCode: string;
  status: HarvestStatus;
}

export interface CreateHarvestMultipartInput {
  kilogram: number;
  reportText: string;
  photos: File[];
}

export interface MyHarvestItem {
  harvestId: string;
  harvestDate: string;
  status: HarvestStatus;
  rejectionReason?: string | null;
  kilogram?: number | null;
  reportText?: string | null;
  kebunCode?: string | null;
}

export interface MandorHarvestItem {
  harvestId: string;
  buruhId: string;
  buruhName: string;
  harvestDate: string;
  status: HarvestStatus;
  rejectionReason?: string | null;
  kebunCode?: string | null;
  kilogram?: number | null;
  photos?: string[] | null;
}

export interface HarvestDetail {
  harvestId: string;
  buruhId: number;
  buruhName?: string | null;
  kebunCode?: string | null;
  harvestDate: string;
  kilogram: number;
  reportText: string;
  photos: string[];
  status: HarvestStatus;
  rejectionReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
}

export interface EligibleShipmentHarvest {
  harvestId: string;
  buruhId: number;
  kebunCode: string;
  harvestDate: string;
  kilogram: number;
}

export interface TransportEligibility {
  harvestId: string;
  eligible: boolean;
  status: HarvestStatus;
  kilogram: number;
}
