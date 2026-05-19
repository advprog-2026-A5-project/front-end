export type Role = "ADMIN" | "BURUH" | "MANDOR" | "SUPIR";

export interface AuthUser {
  id: number;
  email: string;
  nama: string;
  role: Role;
}

export interface SignInResponse {
  token: string;
}

export interface UserModel {
  id: number;
  username: string;
  email: string;
  nama: string;
  role: Role;
  nomorSertifikasiMandor?: string | null;
  mandor?: {
    id: number;
    nama: string;
    email: string;
  } | null;
}
