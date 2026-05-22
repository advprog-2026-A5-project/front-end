"use client";

import { env } from "@/config/env";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccounts = {
  id: {
    initialize: (options: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
    }) => void;
    renderButton: (
      parent: HTMLElement,
      options: {
        theme: "outline" | "filled_blue" | "filled_black";
        size: "large" | "medium" | "small";
        width?: number;
        text?: "signin_with" | "signup_with" | "continue_with";
      },
    ) => void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

type GoogleAuthButtonProps = {
  disabled?: boolean;
  mode?: "signin" | "signup";
  onCredential: (idToken: string) => Promise<void> | void;
};

export function GoogleAuthButton({ disabled = false, mode = "signin", onCredential }: GoogleAuthButtonProps) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const clientId = env.googleClientId;

  useEffect(() => {
    if (!scriptReady || !buttonRef.current || !clientId || disabled) return;

    buttonRef.current.innerHTML = "";
    window.google?.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        if (!response.credential) {
          setLocalError("Google credential kosong.");
          return;
        }
        setLocalError(null);
        await onCredential(response.credential);
      },
    });
    window.google?.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: 360,
      text: mode === "signup" ? "signup_with" : "signin_with",
    });
  }, [clientId, disabled, mode, onCredential, scriptReady]);

  if (!clientId) {
    return (
      <button
        className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-500"
        disabled
        type="button"
      >
        Google belum dikonfigurasi
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />
      <div className={disabled ? "pointer-events-none opacity-60" : ""} ref={buttonRef} />
      {localError && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{localError}</p>}
    </div>
  );
}
