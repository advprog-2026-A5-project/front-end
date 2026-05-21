"use client";

import { useAuth } from "@/auth/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

const roleLabel: Record<string, string> = {
  ADMIN: "Admin Utama",
  BURUH: "Buruh Sawit",
  MANDOR: "Mandor",
  SUPIR: "Supir Truk",
};

function getNavItems(role?: string) {
  if (role !== "ADMIN") return [];
  return [
    { href: "/admin", label: "Home" },
    { href: "/admin/kebun", label: "Manajemen Kebun" },
    { href: "/admin/assignments", label: "Assignment Kebun" },
  ];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();

  const navItems = getNavItems(currentUser?.role);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight text-emerald-300">MySawit Admin Panel</h1>
          {currentUser && (
            <div className="text-right text-sm">
              <p className="font-medium text-slate-100">{currentUser.nama}</p>
              <p className="text-slate-300">{currentUser.email}</p>
              <p className="text-slate-400">{roleLabel[currentUser.role] ?? currentUser.role}</p>
            </div>
          )}
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 md:grid-cols-[250px_1fr]">
        <aside className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  pathname === item.href
                    ? "border border-emerald-500/40 bg-emerald-600/15 font-medium text-emerald-200"
                    : "text-slate-200 hover:bg-slate-800 hover:text-white"
                }`}
                key={item.href}
                href={item.href}
              >
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
