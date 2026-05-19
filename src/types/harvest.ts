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

export interface MyHarvestItem {
  harvestId: string;
  harvestDate: string;
  status: HarvestStatus;
  rejectionReason?: string | null;
}

export interface MandorHarvestItem {
  harvestId: string;
  buruhId: string;
  buruhName: string;
  harvestDate: string;
  status: HarvestStatus;
  rejectionReason?: string | null;
}

export interface TransportEligibility {
  harvestId: string;
  eligible: boolean;
  status: HarvestStatus;
  kilogram: number;
}
