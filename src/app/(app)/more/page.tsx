"use client";

import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  CreditCard,
  FileText,
  LayoutGrid,
  ReceiptText,
  Settings,
  Upload,
  Users,
  Wallet,
  Home,
  BarChart3,
  Repeat,
  Smartphone,
} from "lucide-react";
import { useLedger } from "@/lib/store";

export default function MorePage() {
  const {
    t,
    format,
    receipts,
    clients,
    accounts,
    recurring,
    khataBalances,
    budget,
    household,
    members,
  } = useLedger();

  const cards = accounts.filter((a) => a.kind === "credit" && !a.archived).length;

  const links = [
    {
      href: "/accounts",
      icon: Wallet,
      title: t("accounts"),
      hint: t("accountsHint", {
        count: accounts.filter((a) => !a.archived).length,
        detail: budget.netWorth ? t("netWorthOnReports") : t("noBalanceYet"),
      }),
    },
    {
      href: "/clients",
      icon: Users,
      title: t("clients"),
      hint: t("clientsSaved", { count: clients.length }),
    },
    {
      href: "/khata",
      icon: BookOpen,
      title: t("khata"),
      hint: t("khataHint", { get: format(khataBalances.toGet), give: format(khataBalances.toGive) }),
    },
    {
      href: "/cashbook",
      icon: CreditCard,
      title: t("cashBook"),
      hint: t("cashBookMoreHint"),
    },
    {
      href: "/receipts",
      icon: ReceiptText,
      title: t("receipts"),
      hint: t("receiptsHint", { count: receipts.length }),
    },
    {
      href: "/upload",
      icon: Upload,
      title: t("upload"),
      hint: t("generate"),
    },
    {
      href: "/expenses",
      icon: FileText,
      title: t("expenseSlips"),
      hint: t("expenseSlipsHint"),
    },
    {
      href: "/reports",
      icon: BarChart3,
      title: t("reports"),
      hint: t("reportsHint"),
    },
    {
      href: "/budget/recurring",
      icon: Repeat,
      title: t("recurring"),
      hint: t("recurringHint", { count: recurring.length }),
    },
    {
      href: "/household",
      icon: Home,
      title: t("household"),
      hint: household
        ? t("householdPeople", { name: household.name, count: members.length })
        : t("householdHint"),
    },
    {
      href: "/widgets",
      icon: Smartphone,
      title: t("widgets"),
      hint: t("widgetsHint"),
    },
    {
      href: "/settings",
      icon: Settings,
      title: t("settings"),
      hint: t("settingsHint"),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("more")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("aboutBody")}</p>
      </div>
      {cards > 0 ? (
        <p className="text-xs text-slate-500">{t("cardsCount", { count: cards })}</p>
      ) : null}
      <ul className="card divide-y divide-slate-100">
        {links.map(({ href, icon: Icon, title, hint }) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50">
              <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-800">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{title}</p>
                <p className="truncate text-xs text-slate-500">{hint}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-slate-400" />
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline">
        <LayoutGrid className="size-4" /> {t("marketingHome")}
      </Link>
    </div>
  );
}
