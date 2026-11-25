"use client";

import { useEffect, type ReactNode } from "react";
import { LedgerProvider, useLedger } from "@/lib/store";
import { isRtlLanguage } from "@/lib/types";

function DocumentLang({ children }: { children: ReactNode }) {
  const { ready, lang } = useLedger();
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtlLanguage(lang) ? "rtl" : "ltr";
  }, [ready, lang]);
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LedgerProvider>
      <DocumentLang>{children}</DocumentLang>
    </LedgerProvider>
  );
}
