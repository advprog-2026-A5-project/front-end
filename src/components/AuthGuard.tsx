"use client";

import type { Role } from "@/types/auth";
import { useAuth } from "@/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { token, currentUser, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    if (roles && roles.length > 0 && !hasRole(roles)) {
      router.push("/dashboard");
    }
  }, [token, currentUser, loading, roles, hasRole, router]);

  if (loading) return <p className="p-6">Loading session...</p>;
  if (!token) return null;
  if (roles && roles.length > 0 && !hasRole(roles)) return null;

  return <>{children}</>;
}
