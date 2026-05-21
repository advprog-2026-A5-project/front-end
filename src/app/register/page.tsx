"use client";

import { ApiError } from "@/api/httpClient";
import { authApi } from "@/api/authApi";
import type { Role } from "@/types/auth";
import Link from "next/link";
import { useState } from "react";

type PublicRole = Exclude<Role, "ADMIN">;

export default function RegisterPage() {
  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "BURUH" as PublicRole,
    nomorSertifikasiMandor: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (form.password !== form.confirmPassword) {
      setError("Password dan konfirmasi password harus sama.");
      return;
    }
    if (form.role === "MANDOR" && form.nomorSertifikasiMandor.trim() === "") {
      setError("Nomor Sertifikasi Mandor wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.signUp({
        username: form.email.split("@")[0],
        email: form.email.trim(),
        nama: form.nama.trim(),
        password: form.password,
        role: form.role,
        nomorSertifikasiMandor: form.role === "MANDOR" ? form.nomorSertifikasiMandor.trim() : undefined,
      });
      setMessage("Registrasi berhasil. Silakan login.");
      setForm({
        nama: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "BURUH",
        nomorSertifikasiMandor: "",
      });
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.status} ${e.message}` : e instanceof Error ? e.message : "Register failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <form className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900/85 p-6 shadow-[0_20px_70px_-35px_rgba(16,185,129,0.35)]" onSubmit={onSubmit}>
        <h1 className="mb-1 text-2xl font-semibold text-emerald-300">MySawit Register</h1>
        <p className="mb-4 text-sm text-slate-400">Daftarkan akun operasional untuk Buruh, Mandor, atau Supir.</p>

        <div className="grid gap-3 text-sm text-slate-200">
          <label className="block">
            Nama
            <input
              className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
              required
              value={form.nama}
              onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))}
            />
          </label>
          <label className="block">
            Email
            <input
              className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              Password
              <input
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </label>
            <label className="block">
              Konfirmasi Password
              <input
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                required
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </label>
          </div>

          <label className="block">
            Role
            <select
              className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as PublicRole }))}
            >
              <option value="BURUH">Buruh</option>
              <option value="MANDOR">Mandor</option>
              <option value="SUPIR">Supir</option>
            </select>
          </label>

          {form.role === "MANDOR" && (
            <label className="block">
              Nomor Sertifikasi Mandor
              <input
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                required
                value={form.nomorSertifikasiMandor}
                onChange={(e) => setForm((prev) => ({ ...prev, nomorSertifikasiMandor: e.target.value }))}
              />
            </label>
          )}
        </div>

        {error && <p className="mt-3 rounded-xl border border-red-300/30 bg-red-500/10 p-2 text-sm text-red-200">{error}</p>}
        {message && <p className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-2 text-sm text-emerald-200">{message}</p>}

        <button className="mt-4 w-full rounded-xl bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-500" disabled={submitting} type="submit">
          {submitting ? "Registering..." : "Register"}
        </button>
        <button
          className="mt-2 w-full rounded-xl border border-slate-500 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
          onClick={() => {
            // TODO(auth): wire Google OAuth registration flow here.
          }}
          type="button"
        >
          Register with Google
        </button>
        <p className="mt-4 text-center text-sm text-slate-400">
          Sudah punya akun?{" "}
          <Link className="font-medium text-emerald-300 hover:text-emerald-200" href="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
