"use client";

import { useAuth } from "@/auth/AuthContext";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import type { Role } from "@/types/auth";
import Link from "next/link";
import { useCallback, useState } from "react";

export default function LoginPage() {
  const { login, loginWithGoogle, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleRole, setGoogleRole] = useState<Role>("BURUH");
  const [localError, setLocalError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    try {
      await login(email, password);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Login failed");
    }
  };

  const onGoogleCredential = useCallback(async (idToken: string) => {
    setLocalError(null);
    try {
      await loginWithGoogle(idToken, googleRole);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Google login failed");
    }
  }, [googleRole, loginWithGoogle]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={onSubmit}>
        <h1 className="text-xl font-semibold text-green-800">MySawit Login</h1>
        <p className="mt-1 text-sm text-slate-600">Masuk sebagai pengguna MySawit.</p>
        <div className="space-y-3">
          <label className="block text-sm">
            Email
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </div>
        {(error || localError) && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{localError || error}</p>}
        <button className="mt-4 w-full rounded bg-green-700 px-3 py-2 text-white hover:bg-green-800" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <div className="my-5 flex items-center gap-3 text-xs uppercase text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          atau
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <label className="mb-3 block text-sm">
          Role untuk akun Google baru
          <select
            className="mt-1 w-full rounded border px-3 py-2"
            value={googleRole}
            onChange={(event) => setGoogleRole(event.target.value as Role)}
          >
            <option value="BURUH">BURUH</option>
            <option value="MANDOR">MANDOR</option>
            <option value="SUPIR">SUPIR</option>
          </select>
        </label>
        <GoogleAuthButton disabled={loading} mode="signin" onCredential={onGoogleCredential} />
        <p className="mt-5 text-center text-sm text-slate-600">
          Belum punya akun?{" "}
          <Link className="font-medium text-green-700 hover:text-green-800" href="/register">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
