"use client";

import { useAuth } from "@/auth/AuthContext";
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form className="w-full max-w-md rounded border bg-white p-6 shadow-sm" onSubmit={onSubmit}>
        <h1 className="mb-4 text-xl font-semibold text-green-800">MySawit Login</h1>
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
      </form>
    </div>
  );
}
