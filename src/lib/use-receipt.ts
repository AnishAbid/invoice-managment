"use client";

import { useEffect, useState } from "react";
import { getReceipt } from "./db";
import type { Receipt } from "./types";

/** undefined = loading, null = not found */
export function useReceipt(id: string) {
  const [receipt, setReceipt] = useState<Receipt | null | undefined>(undefined);
  useEffect(() => {
    getReceipt(id).then((r) => setReceipt(r ?? null));
  }, [id]);
  return receipt;
}
