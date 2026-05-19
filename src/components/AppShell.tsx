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
        { href: "/integration-smoke-test", label: "Smoke Test", show: true },
      ].filter((item) => item.show)
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-green-800">MySawit Frontend Integration</h1>
          {currentUser && (
            <div className="text-right text-sm">
              <p className="font-medium">{currentUser.nama}</p>
              <p className="text-slate-600">{currentUser.email}</p>
              <p className="text-slate-500">{roleLabel[currentUser.role] ?? currentUser.role}</p>
            </div>
          )}
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 md:grid-cols-[220px_1fr]">
        <aside className="rounded border bg-white p-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link className="block rounded px-2 py-1 text-sm hover:bg-slate-100" key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          {currentUser && (
            <button
              className="mt-4 w-full rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
              onClick={() => logout()}
              type="button"
            >
              Logout
            </button>
          )}
        </aside>
        <main className="rounded border bg-white p-4">{children}</main>
      </div>
    </div>
  );
}
