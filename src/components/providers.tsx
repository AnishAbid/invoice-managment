"use client";

import type { ReactNode } from "react";
import { LedgerProvider } from "@/lib/store";

export function Providers({ children }: { children: ReactNode }) {
  return <LedgerProvider>{children}</LedgerProvider>;
}
