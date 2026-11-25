"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  FileText,
  Home,
  MoreHorizontal,
  PiggyBank,
  ReceiptText,
} from "lucide-react";
import { useLedger } from "@/lib/store";

const PRIMARY = [
  { href: "/home", key: "home", icon: Home },
  { href: "/budget", key: "budget", icon: PiggyBank },
  { href: "/activity", key: "activity", icon: Activity },
  { href: "/invoices", key: "invoices", icon: FileText },
  { href: "/more", key: "more", icon: MoreHorizontal },
] as const;

export function Header() {
  const pathname = usePathname();
  const { t } = useLedger();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/home" className="flex shrink-0 items-center gap-2 font-semibold text-slate-900">
          <span className="grid size-8 place-items-center rounded-lg bg-emerald-700 text-white">
            <ReceiptText className="size-4.5" />
          </span>
          <span>{t("app")}</span>
        </Link>
        <nav className="flex items-center gap-0.5 overflow-x-auto">
          {PRIMARY.map(({ href, key, icon: Icon }) => {
            const active =
              href === "/more"
                ? pathname === "/more" ||
                  [
                    "/receipts",
                    "/upload",
                    "/expenses",
                    "/clients",
                    "/khata",
                    "/cashbook",
                    "/accounts",
                    "/reports",
                    "/household",
                    "/settings",
                    "/widgets",
                  ].some((p) => pathname === p || pathname.startsWith(`${p}/`))
                : href === "/home"
                  ? pathname === "/home"
                  : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition sm:px-3 ${
                  active ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="hidden sm:inline">{t(key)}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
