"use client";

import Link from "next/link";
import { useLedger } from "@/lib/store";

export function MemberSwitcher() {
  const { members, activeMember, setActiveMember, t } = useLedger();
  if (!members.length || !activeMember) return null;

  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="member-switch">
        {t("loggingAs", { name: activeMember.name })}
      </label>
      <select
        id="member-switch"
        className="input max-w-[10rem] py-1.5 text-xs"
        value={activeMember.id}
        onChange={(e) => void setActiveMember(e.target.value)}
        title={t("loggingAs", { name: activeMember.name })}
      >
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <Link href="/household" className="text-xs text-emerald-700 hover:underline">
        {t("household")}
      </Link>
    </div>
  );
}
