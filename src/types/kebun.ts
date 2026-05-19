export interface CoordinatePoint {
  x: number;
  y: number;
}

export interface Kebun {
  code: string;
  name: string;
  luas: number;
  coordinates: CoordinatePoint[];
}

export interface MandorKebunAssignment {
  mandorId: number;
  kebunId: string | null;
  kebunCode: string | null;
  kebunName: string | null;
  active: boolean;
}
