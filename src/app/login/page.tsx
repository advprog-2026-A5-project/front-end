"use client";

import { useAuth } from "@/auth/AuthContext";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <form className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900/85 p-6 shadow-[0_20px_70px_-35px_rgba(16,185,129,0.35)]" onSubmit={onSubmit}>
        <h1 className="mb-1 text-2xl font-semibold text-emerald-300">MySawit Login</h1>
        <p className="mb-4 text-sm text-slate-400">Masuk untuk mengelola operasional kebun dan assignment tim.</p>
        <div className="space-y-3 text-sm text-slate-200">
          <label className="block">
            Email
            <input
              className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            Password
            <input
              className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </div>
        {(error || localError) && (
          <p className="mt-3 rounded-xl border border-red-300/30 bg-red-500/10 p-2 text-sm text-red-200">{localError || error}</p>
        )}
        <button className="mt-4 w-full rounded-xl bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-500" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <button
          className="mt-2 w-full rounded-xl border border-slate-500 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
          onClick={() => {
            // Placeholder: Google OAuth login flow is shown for future backend integration.
          }}
          type="button"
        >
          Continue with Google
        </button>
        <p className="mt-4 text-center text-sm text-slate-400">
          Belum punya akun?{" "}
          <Link className="font-medium text-emerald-300 hover:text-emerald-200" href="/register">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
