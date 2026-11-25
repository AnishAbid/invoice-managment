"use client";

import Link from "next/link";
import { ArrowLeft, Bookmark, Smartphone } from "lucide-react";
import { useLedger } from "@/lib/store";

export default function WidgetsPage() {
  const { t } = useLedger();

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <Link href="/more" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> {t("more")}
      </Link>
      <div className="flex items-start gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
          <Smartphone className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("widgets")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{t("widgetsHint")}</p>
        </div>
      </div>
      <div className="card space-y-4 p-5">
        <p className="text-sm text-slate-700">
          Home-screen widgets are available in the Raseed mobile app. In the browser you can:
        </p>
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="flex gap-3">
            <Bookmark className="mt-0.5 size-4 shrink-0 text-emerald-700" />
            Bookmark <Link href="/home" className="text-emerald-700 underline">/home</Link> for one-tap access.
          </li>
          <li className="flex gap-3">
            <Smartphone className="mt-0.5 size-4 shrink-0 text-emerald-700" />
            Install as a PWA (Add to Home Screen) from your browser menu for an app-like icon.
          </li>
        </ul>
      </div>
    </div>
  );
}
