"use client";

import { useAuth } from "@/auth/AuthContext";
import Link from "next/link";

const roleLabel: Record<string, string> = {
  ADMIN: "Admin Utama",
  BURUH: "Buruh Sawit",
  MANDOR: "Mandor",
  SUPIR: "Supir Truk",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuth();

  const navItems = currentUser
    ? [
        { href: "/dashboard", label: "Dashboard", show: true },
        { href: "/admin", label: "Admin Home", show: currentUser.role === "ADMIN" },
        { href: "/admin/users", label: "Users", show: currentUser.role === "ADMIN" },
        { href: "/admin/assignments", label: "Assignments", show: currentUser.role === "ADMIN" },
        { href: "/admin/kebun", label: "Kebun", show: currentUser.role === "ADMIN" },
        { href: "/buruh/harvests", label: "Buruh Harvests", show: currentUser.role === "BURUH" },
        { href: "/mandor/harvests", label: "Mandor Harvests", show: currentUser.role === "MANDOR" },
        { href: "/pengiriman", label: "Pengiriman", show: ["ADMIN", "MANDOR", "SUPIR"].includes(currentUser.role) },
        { href: "/integration-smoke-test", label: "Smoke Test", show: true },
      ].filter((item) => item.show)
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight text-emerald-300">MySawit Frontend Integration</h1>
          {currentUser && (
            <div className="text-right text-sm">
              <p className="font-medium text-slate-100">{currentUser.nama}</p>
              <p className="text-slate-300">{currentUser.email}</p>
              <p className="text-slate-400">{roleLabel[currentUser.role] ?? currentUser.role}</p>
            </div>
          )}
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 md:grid-cols-[220px_1fr]">
        <aside className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link className="block rounded-md px-2 py-1 text-sm text-slate-200 hover:bg-slate-800 hover:text-white" key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          {currentUser && (
            <button
              className="mt-4 w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
              onClick={() => logout()}
              type="button"
            >
              Logout
            </button>
          )}
        </aside>
        <main className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">{children}</main>
      </div>
    </div>
  );
}
