"use client";

import { authApi } from "@/api/authApi";
import { useAuth } from "@/auth/AuthContext";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import type { Role } from "@/types/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type RegisterRole = Exclude<Role, "ADMIN">;

export default function RegisterPage() {
  const router = useRouter();
  const { loginWithGoogle, loading } = useAuth();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterRole>("BURUH");
  const [nomorSertifikasiMandor, setNomorSertifikasiMandor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      await authApi.signUp({
        nama,
        email,
        password,
        role,
        nomorSertifikasiMandor: role === "MANDOR" ? nomorSertifikasiMandor : undefined,
      });
      setMessage("Registrasi berhasil. Silakan login.");
      router.push("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registrasi gagal");
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleCredential = useCallback(async (idToken: string) => {
    setError(null);
    try {
      await loginWithGoogle(idToken, role);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registrasi Google gagal");
    }
  }, [loginWithGoogle, role]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={onSubmit}>
        <h1 className="text-xl font-semibold text-green-800">Register MySawit</h1>
        <p className="mt-1 text-sm text-slate-600">Daftar sebagai Buruh, Mandor, atau Supir.</p>

        <div className="mt-5 space-y-3">
          <label className="block text-sm">
            Nama
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              required
              value={nama}
              onChange={(event) => setNama(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              className="mt-1 w-full rounded border px-3 py-2"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            Role
            <select
              className="mt-1 w-full rounded border px-3 py-2"
              value={role}
              onChange={(event) => setRole(event.target.value as RegisterRole)}
            >
              <option value="BURUH">BURUH</option>
              <option value="MANDOR">MANDOR</option>
              <option value="SUPIR">SUPIR</option>
            </select>
          </label>
          {role === "MANDOR" && (
            <label className="block text-sm">
              Nomor Sertifikasi Mandor
              <input
                className="mt-1 w-full rounded border px-3 py-2"
                required
                value={nomorSertifikasiMandor}
                onChange={(event) => setNomorSertifikasiMandor(event.target.value)}
              />
            </label>
          )}
        </div>

        {message && <p className="mt-3 rounded bg-green-50 p-2 text-sm text-green-700">{message}</p>}
        {error && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <button
          className="mt-4 w-full rounded bg-green-700 px-3 py-2 text-white hover:bg-green-800 disabled:bg-slate-400"
          disabled={submitting || loading}
          type="submit"
        >
          {submitting ? "Mendaftarkan..." : "Register"}
        </button>

        <div className="my-5 flex items-center gap-3 text-xs uppercase text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          atau
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <GoogleAuthButton disabled={submitting || loading} mode="signup" onCredential={onGoogleCredential} />

        <p className="mt-5 text-center text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link className="font-medium text-green-700 hover:text-green-800" href="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
