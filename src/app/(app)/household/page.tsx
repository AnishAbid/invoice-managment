"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { newId } from "@/lib/receipt";
import { useLedger } from "@/lib/store";
import type { MemberRole } from "@/lib/types";

const COLORS = ["#059669", "#2563eb", "#d97706", "#db2777", "#7c3aed", "#0891b2"];

export default function HouseholdPage() {
  const {
    ready,
    t,
    household,
    members,
    settings,
    saveHouseholdName,
    saveMember,
    removeMember,
    setActiveMember,
  } = useLedger();
  const [name, setName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [role, setRole] = useState<MemberRole>("member");

  useEffect(() => {
    if (household?.name) setName(household.name);
  }, [household?.name]);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await saveHouseholdName(name.trim());
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!memberName.trim()) return;
    await saveMember({
      id: newId(),
      name: memberName.trim(),
      role,
      color: COLORS[members.length % COLORS.length],
      createdAt: Date.now(),
    });
    setMemberName("");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("household")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("householdHint")}</p>
      </div>

      <form className="card space-y-3 p-5" onSubmit={saveName}>
        <div>
          <label className="label">{t("name")}</label>
          <input className="input" value={name || household?.name || ""} onChange={(e) => setName(e.target.value)} placeholder="Family / team" />
        </div>
        <button type="submit" className="btn-primary">
          {t("save")}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Members</h2>
        <ul className="card divide-y divide-slate-100">
          {!members.length ? (
            <li className="px-4 py-6 text-center text-sm text-slate-500">No members yet</li>
          ) : (
            members.map((m) => {
              const active = settings.activeMemberId === m.id || (!settings.activeMemberId && members[0]?.id === m.id);
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="size-8 rounded-full" style={{ backgroundColor: m.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.role}</p>
                  </div>
                  <button
                    type="button"
                    className={`btn text-xs ${active ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => void setActiveMember(m.id)}
                  >
                    {active ? "Active" : "Switch"}
                  </button>
                  <button type="button" className="btn-ghost text-red-600" onClick={() => void removeMember(m.id)}>
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <form className="card space-y-3 p-5" onSubmit={addMember}>
        <h3 className="font-medium">{t("addMember")}</h3>
        <div>
          <label className="label">{t("memberName")}</label>
          <input className="input" value={memberName} onChange={(e) => setMemberName(e.target.value)} />
        </div>
        <div>
          <label className="label">{t("role")}</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as MemberRole)}>
            <option value="owner">Owner</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">
          <Plus className="size-4" /> {t("addMember")}
        </button>
      </form>
    </div>
  );
}
