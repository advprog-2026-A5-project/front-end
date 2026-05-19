import { env } from "@/config/env";
import { request } from "./httpClient";
import type { AuthUser, SignInResponse, UserModel } from "@/types/auth";

const base = env.authBaseUrl;

export const authApi = {
  signIn: (email: string, password: string) =>
    request<SignInResponse>(`${base}/api/auth/signin`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signOut: () => request<{ message: string }>(`${base}/api/auth/signout`, { method: "POST" }),
  me: (token: string) => request<AuthUser>(`${base}/api/users/me`, { token }),
  users: (token: string) => request<UserModel[]>(`${base}/api/users`, { token }),
  assignBuruhToMandor: (token: string, buruhId: number, mandorId: number) =>
    request<{ message: string }>(`${base}/api/users/${buruhId}/assign-mandor/${mandorId}`, {
      method: "POST",
      token,
    }),
  unassignBuruh: (token: string, buruhId: number) =>
    request<{ message: string }>(`${base}/api/users/${buruhId}/unassign-mandor`, {
      method: "POST",
      token,
    }),
  signUp: (
    body: Record<string, unknown>,
  ) => request<{ message: string }>(`${base}/api/auth/signup`, { method: "POST", body: JSON.stringify(body) }),
};
