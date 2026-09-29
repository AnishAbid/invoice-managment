"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, LayoutGrid, ReceiptText, Upload } from "lucide-react";

const NAV = [
  { href: "/", label: "Receipts", icon: LayoutGrid },
  { href: "/receipts/new", label: "Generate", icon: FilePlus2 },
  { href: "/upload", label: "Upload", icon: Upload },
] as const;

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="grid size-8 place-items-center rounded-lg bg-emerald-700 text-white">
            <ReceiptText className="size-4.5" />
          </span>
          <span>
            Raseed <span className="urdu text-sm font-normal text-slate-500">رسید</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
