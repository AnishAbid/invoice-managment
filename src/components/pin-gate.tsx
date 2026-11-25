"use client";

import { useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { useLedger } from "@/lib/store";

export function PinGate({ children }: { children: ReactNode }) {
  const { ready, unlocked, unlockWithPin, t } = useLedger();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) {
    return <div className="py-24 text-center text-sm text-slate-500">{t("loading")}</div>;
  }

  if (!unlocked) {
    async function submit(e: React.FormEvent) {
      e.preventDefault();
      setBusy(true);
      setError("");
      const ok = await unlockWithPin(pin);
      setBusy(false);
      if (!ok) {
        setError("Wrong PIN");
        setPin("");
      }
    }

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-emerald-100 text-emerald-800">
              <Lock className="size-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{t("enterPin")}</h1>
              <p className="text-xs text-slate-500">{t("pinHint")}</p>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="pin">
              {t("enterPin")}
            </label>
            <input
              id="pin"
              className="input font-mono tracking-widest"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              autoFocus
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" className="btn-primary w-full" disabled={busy || pin.length < 4}>
            {t("unlock")}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
