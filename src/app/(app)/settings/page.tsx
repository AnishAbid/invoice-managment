"use client";

import { useEffect, useRef, useState } from "react";
import { useLedger } from "@/lib/store";
import { CURRENCIES } from "@/lib/receipt";
import type { BusinessProfile, Currency, Language } from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";

export default function SettingsPage() {
  const {
    ready,
    t,
    profile,
    saveProfile,
    signedIn,
    signUpLocal,
    signInLocal,
    signOut,
    settings,
    setPin,
    backupEncrypted,
    restoreEncrypted,
    eraseAll,
  } = useLedger();

  const [p, setP] = useState<BusinessProfile>(profile);
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pinValue, setPinValue] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setP(profile);
  }, [profile]);

  if (!ready) return <div className="py-20 text-center text-sm text-slate-500">{t("loading")}</div>;

  async function saveBiz(e: React.FormEvent) {
    e.preventDefault();
    await saveProfile(p);
    setMsg(t("saved"));
  }

  async function doSignUp() {
    try {
      await signUpLocal(email, password, displayName);
      setMsg(t("saved"));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    }
  }

  async function doSignIn() {
    try {
      await signInLocal(email, password);
      setMsg(t("saved"));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    }
  }

  async function enablePin(e: React.FormEvent) {
    e.preventDefault();
    if (pinValue.length < 4) return setMsg("PIN must be 4–8 digits");
    await setPin(pinValue);
    setPinValue("");
    setMsg(t("saved"));
  }

  async function doBackup() {
    if (passphrase.length < 6 || passphrase !== passConfirm) return setMsg("Passphrases must match (min 6)");
    await backupEncrypted(passphrase);
    setMsg(t("saved"));
  }

  async function doRestore(file: File | undefined) {
    if (!file) return;
    if (passphrase.length < 6) return setMsg("Enter passphrase first");
    try {
      await restoreEncrypted(file, passphrase);
      setMsg(t("saved"));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Restore failed");
    }
  }

  async function doErase() {
    if (!window.confirm("Erase ALL local data? This cannot be undone.")) return;
    await eraseAll();
    setMsg("Erased");
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("settings")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("settingsHint")}</p>
      </div>
      {msg ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p> : null}

      <form className="card space-y-3 p-5" onSubmit={saveBiz}>
        <h2 className="font-semibold">{t("businessProfile")}</h2>
        <p className="text-xs text-slate-500">{t("businessProfileHint")}</p>
        <Field label={t("businessName")}>
          <input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("phone")}>
            <input className="input" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} />
          </Field>
          <Field label={t("email")}>
            <input className="input" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} />
          </Field>
        </div>
        <Field label={t("address")}>
          <input className="input" value={p.address} onChange={(e) => setP({ ...p, address: e.target.value })} />
        </Field>
        <Field label={t("taxId")}>
          <input className="input" value={p.taxId} onChange={(e) => setP({ ...p, taxId: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("defaultCurrency")}>
            <select
              className="input"
              value={p.defaultCurrency}
              onChange={(e) => setP({ ...p, defaultCurrency: e.target.value as Currency })}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("defaultLanguage")}>
            <select
              className="input"
              value={p.defaultLanguage}
              onChange={(e) => setP({ ...p, defaultLanguage: e.target.value as Language })}
            >
              <option value="en">English</option>
              <option value="ur">Urdu</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("invoiceDueDays")}>
            <input
              className="input"
              type="number"
              value={p.invoiceDueDays}
              onChange={(e) => setP({ ...p, invoiceDueDays: Number(e.target.value) })}
            />
          </Field>
          <Field label={t("defaultTax")}>
            <input
              className="input"
              type="number"
              value={p.defaultTaxPercent}
              onChange={(e) => setP({ ...p, defaultTaxPercent: Number(e.target.value) })}
            />
          </Field>
        </div>
        <Field label="Default template">
          <select
            className="input"
            value={p.defaultTemplate}
            onChange={(e) => setP({ ...p, defaultTemplate: e.target.value as BusinessProfile["defaultTemplate"] })}
          >
            {TEMPLATES.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </Field>
        <button type="submit" className="btn-primary">
          {t("save")}
        </button>
      </form>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">{signedIn ? signedIn.displayName : t("signIn")}</h2>
        <p className="text-xs text-slate-500">{t("signInHint")}</p>
        {signedIn ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">{signedIn.email}</p>
            <button type="button" className="btn-secondary" onClick={() => void signOut()}>
              {t("signOut")}
            </button>
          </div>
        ) : (
          <>
            <Field label={t("email")}>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label={t("password")}>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Field label={t("name")}>
              <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="For sign up" />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={() => void doSignIn()}>
                {t("signIn")}
              </button>
              <button type="button" className="btn-secondary" onClick={() => void doSignUp()}>
                {t("signUp")}
              </button>
            </div>
            <p className="text-xs text-slate-500">{t("forgotPassword")}</p>
          </>
        )}
        <p className="text-xs text-slate-500">{t("oauthNote")}</p>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">{t("pinLock")}</h2>
        <p className="text-xs text-slate-500">{t("pinHint")}</p>
        {settings.pinEnabled ? (
          <button type="button" className="btn-secondary" onClick={() => void setPin(null)}>
            {t("disablePin")}
          </button>
        ) : (
          <form className="space-y-3" onSubmit={enablePin}>
            <Field label={t("setPin")}>
              <input
                className="input font-mono"
                type="password"
                inputMode="numeric"
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 8))}
              />
            </Field>
            <button type="submit" className="btn-primary">
              {t("enablePin")}
            </button>
          </form>
        )}
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">{t("backup")}</h2>
        <p className="text-xs text-slate-500">{t("backupHint")}</p>
        <Field label={t("passphrase")}>
          <input type="password" className="input" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
        </Field>
        <Field label={t("confirmPassphrase")}>
          <input type="password" className="input" value={passConfirm} onChange={(e) => setPassConfirm(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => void doBackup()}>
            {t("backupNow")}
          </button>
          <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
            {t("restoreFromBackup")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".enc,application/octet-stream"
            className="hidden"
            onChange={(e) => void doRestore(e.target.files?.[0])}
          />
        </div>
        {settings.lastBackupAt ? (
          <p className="text-xs text-slate-500">Last backup: {new Date(settings.lastBackupAt).toLocaleString()}</p>
        ) : null}
      </section>

      <section className="card space-y-3 border-red-100 p-5">
        <h2 className="font-semibold text-red-700">{t("eraseData")}</h2>
        <button type="button" className="btn-danger" onClick={() => void doErase()}>
          {t("eraseData")}
        </button>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
