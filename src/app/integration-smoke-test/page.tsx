"use client";

import { authApi } from "@/api/authApi";
import { hasilPanenApi } from "@/api/hasilPanenApi";
import { kebunApi } from "@/api/kebunApi";
import { useAuth } from "@/auth/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { useEffect, useState } from "react";

type CheckState = "Not checked" | "Success" | "Failed" | "Needs setup";

export default function IntegrationSmokeTestPage() {
  const { token, currentUser } = useAuth();
  const [authCheck, setAuthCheck] = useState<CheckState>("Not checked");
  const [kebunCheck, setKebunCheck] = useState<CheckState>("Not checked");
  const [panenCheck, setPanenCheck] = useState<CheckState>("Not checked");

  useEffect(() => {
    const run = async () => {
      try {
        await hasilPanenApi.health();
        setPanenCheck("Success");
      } catch {
        setPanenCheck("Failed");
      }
      try {
        if (!token) throw new Error();
        await authApi.me(token);
        setAuthCheck("Success");
      } catch {
        setAuthCheck("Failed");
      }
      try {
        await kebunApi.list();
        setKebunCheck("Success");
      } catch {
        setKebunCheck("Failed");
      }
    };
    void run();
  }, [token]);

  return (
    <AuthGuard>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Integration Smoke Test</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>Auth reachable: <span className="font-semibold">{authCheck}</span></li>
          <li>Kebun reachable: <span className="font-semibold">{kebunCheck}</span></li>
          <li>Hasil Panen reachable: <span className="font-semibold">{panenCheck}</span></li>
          <li>Current user: <span className="font-semibold">{currentUser ? `${currentUser.nama} (${currentUser.role})` : "Not logged in"}</span></li>
          <li>Admin setup: Buruh and Mandor exist, Buruh assigned to Mandor, Mandor assigned to Kebun.</li>
          <li>Buruh submits harvest via /hasil-panen/lapor.</li>
          <li>Mandor validates harvest via /hasil-panen/mandor.</li>
          <li>Check transport eligibility via Mandor table action.</li>
        </ol>
      </div>
    </AuthGuard>
  );
}
