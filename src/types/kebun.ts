export interface CoordinatePoint {
  x: number;
  y: number;
}

export interface Kebun {
  kode: string;
  nama: string;
  luas: number;
  titik1: CoordinatePoint;
  titik2: CoordinatePoint;
  titik3: CoordinatePoint;
  titik4: CoordinatePoint;
  mandorId?: number | null;
}

export interface MandorKebunAssignment {
  mandorId: number;
  kebunId: string | null;
  kebunCode: string | null;
  kebunName: string | null;
  active: boolean;
}
