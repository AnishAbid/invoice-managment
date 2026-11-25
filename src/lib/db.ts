"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Receipt,
  Invoice,
  Expense,
  Client,
  MoneyAccount,
  Envelope,
  MoneyTxn,
  RecurringRule,
  KhataEntry,
  CashBookEntry,
  Household,
  HouseholdMember,
  BusinessProfile,
  SignedAccount,
  AppSettings,
} from "./types";
import { emptyProfile } from "./types";

interface LedgerDB extends DBSchema {
  receipts: { key: string; value: Receipt; indexes: { "by-created": number } };
  files: { key: string; value: Blob };
  meta: { key: string; value: number | string | object };
  invoices: { key: string; value: Invoice; indexes: { "by-created": number } };
  expenses: { key: string; value: Expense; indexes: { "by-created": number } };
  clients: { key: string; value: Client; indexes: { "by-name": string } };
  accounts: { key: string; value: MoneyAccount };
  envelopes: { key: string; value: Envelope };
  txns: { key: string; value: MoneyTxn; indexes: { "by-created": number } };
  recurring: { key: string; value: RecurringRule };
  khata: { key: string; value: KhataEntry; indexes: { "by-created": number } };
  cashbook: { key: string; value: CashBookEntry; indexes: { "by-created": number } };
  household: { key: string; value: Household };
  members: { key: string; value: HouseholdMember };
  profile: { key: string; value: BusinessProfile };
  auth: { key: string; value: SignedAccount };
  settings: { key: string; value: AppSettings };
}

let dbPromise: Promise<IDBPDatabase<LedgerDB>> | null = null;

async function migrateFromLegacyReceiptDb(target: IDBPDatabase<LedgerDB>) {
  const flag = await target.get("meta", "migrated-from-receipt-manager");
  if (flag) return;
  const legacyName = "receipt-manager";
  const exists = await new Promise<boolean>((resolve) => {
    const req = indexedDB.open(legacyName);
    req.onsuccess = () => {
      const legacy = req.result;
      const has = legacy.objectStoreNames.contains("receipts");
      legacy.close();
      resolve(has);
    };
    req.onerror = () => resolve(false);
  });
  if (!exists) {
    await target.put("meta", 1, "migrated-from-receipt-manager");
    return;
  }
  const legacy = await openDB(legacyName, 1);
  try {
    if (legacy.objectStoreNames.contains("receipts")) {
      const receipts = await legacy.getAll("receipts");
      for (const r of receipts) await target.put("receipts", r as Receipt);
    }
    if (legacy.objectStoreNames.contains("files")) {
      const keys = await legacy.getAllKeys("files");
      for (const key of keys) {
        const blob = await legacy.get("files", key);
        if (blob) await target.put("files", blob as Blob, key as string);
      }
    }
    if (legacy.objectStoreNames.contains("meta")) {
      const keys = await legacy.getAllKeys("meta");
      for (const key of keys) {
        const val = await legacy.get("meta", key);
        if (val != null) await target.put("meta", val as number | string | object, key as string);
      }
    }
  } finally {
    legacy.close();
  }
  await target.put("meta", 1, "migrated-from-receipt-manager");
}

function db() {
  if (!dbPromise) {
    dbPromise = openDB<LedgerDB>("raseed-ledger", 1, {
      upgrade(database) {
        const receipts = database.createObjectStore("receipts", { keyPath: "id" });
        receipts.createIndex("by-created", "createdAt");
        database.createObjectStore("files");
        database.createObjectStore("meta");
        database.createObjectStore("invoices", { keyPath: "id" }).createIndex("by-created", "createdAt");
        database.createObjectStore("expenses", { keyPath: "id" }).createIndex("by-created", "createdAt");
        database.createObjectStore("clients", { keyPath: "id" }).createIndex("by-name", "name");
        database.createObjectStore("accounts", { keyPath: "id" });
        database.createObjectStore("envelopes", { keyPath: "id" });
        database.createObjectStore("txns", { keyPath: "id" }).createIndex("by-created", "createdAt");
        database.createObjectStore("recurring", { keyPath: "id" });
        database.createObjectStore("khata", { keyPath: "id" }).createIndex("by-created", "createdAt");
        database.createObjectStore("cashbook", { keyPath: "id" }).createIndex("by-created", "createdAt");
        database.createObjectStore("household", { keyPath: "id" });
        database.createObjectStore("members", { keyPath: "id" });
        database.createObjectStore("profile");
        database.createObjectStore("auth", { keyPath: "id" });
        database.createObjectStore("settings");
      },
    }).then(async (database) => {
      await migrateFromLegacyReceiptDb(database);
      return database;
    }).catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

async function listByCreated<T>(store: "receipts" | "invoices" | "expenses" | "txns" | "khata" | "cashbook") {
  const all = await (await db()).getAllFromIndex(store, "by-created");
  return (all as T[]).reverse();
}

export async function listReceipts() {
  return listByCreated<Receipt>("receipts");
}
export async function getReceipt(id: string) {
  return (await db()).get("receipts", id);
}
export async function saveReceipt(receipt: Receipt, file?: Blob) {
  const d = await db();
  const tx = d.transaction(["receipts", "files"], "readwrite");
  await tx.objectStore("receipts").put(receipt);
  if (file) await tx.objectStore("files").put(file, receipt.id);
  await tx.done;
}
export async function getReceiptFile(id: string) {
  return (await db()).get("files", id);
}
export async function deleteReceipt(id: string) {
  const d = await db();
  const tx = d.transaction(["receipts", "files"], "readwrite");
  await tx.objectStore("receipts").delete(id);
  await tx.objectStore("files").delete(id);
  await tx.done;
}

export async function nextReceiptNumber(): Promise<string> {
  const d = await db();
  const now = new Date();
  const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const key = `seq-${period}`;
  const current = ((await d.get("meta", key)) as number | undefined) ?? 0;
  return `RCPT-${period}-${String(current + 1).padStart(4, "0")}`;
}

export async function commitReceiptNumber() {
  const d = await db();
  const now = new Date();
  const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const key = `seq-${period}`;
  const current = ((await d.get("meta", key)) as number | undefined) ?? 0;
  await d.put("meta", current + 1, key);
}

export async function nextInvoiceNumber(): Promise<string> {
  const d = await db();
  const now = new Date();
  const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const key = `inv-seq-${period}`;
  const current = ((await d.get("meta", key)) as number | undefined) ?? 0;
  return `INV-${period}-${String(current + 1).padStart(4, "0")}`;
}

export async function commitInvoiceNumber() {
  const d = await db();
  const now = new Date();
  const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const key = `inv-seq-${period}`;
  const current = ((await d.get("meta", key)) as number | undefined) ?? 0;
  await d.put("meta", current + 1, key);
}

export async function listInvoices() {
  return listByCreated<Invoice>("invoices");
}
export async function getInvoice(id: string) {
  return (await db()).get("invoices", id);
}
export async function saveInvoice(invoice: Invoice) {
  await (await db()).put("invoices", invoice);
}
export async function deleteInvoice(id: string) {
  await (await db()).delete("invoices", id);
}

export async function listExpenses() {
  return listByCreated<Expense>("expenses");
}
export async function getExpense(id: string) {
  return (await db()).get("expenses", id);
}
export async function saveExpense(expense: Expense, file?: Blob) {
  const d = await db();
  const tx = d.transaction(["expenses", "files"], "readwrite");
  await tx.objectStore("expenses").put(expense);
  if (file) await tx.objectStore("files").put(file, `expense:${expense.id}`);
  await tx.done;
}
export async function getExpenseFile(id: string) {
  return (await db()).get("files", `expense:${id}`);
}
export async function deleteExpense(id: string) {
  const d = await db();
  const tx = d.transaction(["expenses", "files"], "readwrite");
  await tx.objectStore("expenses").delete(id);
  await tx.objectStore("files").delete(`expense:${id}`);
  await tx.done;
}

export async function listClients() {
  const all = await (await db()).getAll("clients");
  return all.sort((a, b) => a.name.localeCompare(b.name));
}
export async function saveClient(client: Client) {
  await (await db()).put("clients", client);
}
export async function deleteClient(id: string) {
  await (await db()).delete("clients", id);
}

export async function listAccounts() {
  return (await db()).getAll("accounts");
}
export async function saveAccount(account: MoneyAccount) {
  await (await db()).put("accounts", account);
}
export async function deleteAccount(id: string) {
  await (await db()).delete("accounts", id);
}

export async function listEnvelopes() {
  const all = await (await db()).getAll("envelopes");
  return all.sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
}
export async function saveEnvelope(envelope: Envelope) {
  await (await db()).put("envelopes", envelope);
}
export async function deleteEnvelope(id: string) {
  await (await db()).delete("envelopes", id);
}

export async function listTxns() {
  return listByCreated<MoneyTxn>("txns");
}
export async function saveTxn(txn: MoneyTxn) {
  await (await db()).put("txns", txn);
}
export async function deleteTxn(id: string) {
  await (await db()).delete("txns", id);
}

export async function listRecurring() {
  return (await db()).getAll("recurring");
}
export async function saveRecurring(rule: RecurringRule) {
  await (await db()).put("recurring", rule);
}
export async function deleteRecurring(id: string) {
  await (await db()).delete("recurring", id);
}

export async function listKhata() {
  return listByCreated<KhataEntry>("khata");
}
export async function saveKhata(entry: KhataEntry) {
  await (await db()).put("khata", entry);
}
export async function deleteKhata(id: string) {
  await (await db()).delete("khata", id);
}

export async function listCashbook() {
  return listByCreated<CashBookEntry>("cashbook");
}
export async function saveCashbook(entry: CashBookEntry) {
  await (await db()).put("cashbook", entry);
}
export async function deleteCashbook(id: string) {
  await (await db()).delete("cashbook", id);
}

export async function getHousehold() {
  const all = await (await db()).getAll("household");
  return all[0] ?? null;
}
export async function saveHousehold(h: Household) {
  await (await db()).put("household", h);
}
export async function listMembers() {
  return (await db()).getAll("members");
}
export async function saveMember(m: HouseholdMember) {
  await (await db()).put("members", m);
}
export async function deleteMember(id: string) {
  await (await db()).delete("members", id);
}

export async function getProfile(): Promise<BusinessProfile> {
  return ((await (await db()).get("profile", "main")) as BusinessProfile | undefined) ?? emptyProfile();
}
export async function saveProfile(profile: BusinessProfile) {
  await (await db()).put("profile", profile, "main");
}

export async function getSignedIn(): Promise<SignedAccount | null> {
  const session = (await (await db()).get("meta", "signedInId")) as string | undefined;
  if (!session) return null;
  return (await (await db()).get("auth", session)) ?? null;
}
export async function listAuthAccounts() {
  return (await db()).getAll("auth");
}
export async function saveAuthAccount(account: SignedAccount) {
  await (await db()).put("auth", account);
}
export async function setSignedInId(id: string | null) {
  const d = await db();
  if (id) await d.put("meta", id, "signedInId");
  else await d.delete("meta", "signedInId");
}

export async function getSettings(): Promise<AppSettings> {
  return (
    ((await (await db()).get("settings", "main")) as AppSettings | undefined) ?? {
      pinEnabled: false,
    }
  );
}
export async function saveSettings(settings: AppSettings) {
  await (await db()).put("settings", settings, "main");
}

export async function clearAllLedgerData() {
  const d = await db();
  const stores = [
    "receipts",
    "files",
    "invoices",
    "expenses",
    "clients",
    "accounts",
    "envelopes",
    "txns",
    "recurring",
    "khata",
    "cashbook",
    "household",
    "members",
  ] as const;
  const tx = d.transaction([...stores], "readwrite");
  await Promise.all(stores.map((s) => tx.objectStore(s).clear()));
  await tx.done;
}

export type LedgerSnapshot = {
  version: 1;
  exportedAt: number;
  profile: BusinessProfile;
  receipts: Receipt[];
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
  accounts: MoneyAccount[];
  envelopes: Envelope[];
  txns: MoneyTxn[];
  recurring: RecurringRule[];
  khata: KhataEntry[];
  cashbook: CashBookEntry[];
  household: Household | null;
  members: HouseholdMember[];
  settings: AppSettings;
};

export async function exportSnapshot(): Promise<LedgerSnapshot> {
  return {
    version: 1,
    exportedAt: Date.now(),
    profile: await getProfile(),
    receipts: await listReceipts(),
    invoices: await listInvoices(),
    expenses: await listExpenses(),
    clients: await listClients(),
    accounts: await listAccounts(),
    envelopes: await listEnvelopes(),
    txns: await listTxns(),
    recurring: await listRecurring(),
    khata: await listKhata(),
    cashbook: await listCashbook(),
    household: await getHousehold(),
    members: await listMembers(),
    settings: await getSettings(),
  };
}

export async function importSnapshot(snap: LedgerSnapshot, replace: boolean) {
  if (replace) await clearAllLedgerData();
  const d = await db();
  const tx = d.transaction(
    [
      "profile",
      "receipts",
      "invoices",
      "expenses",
      "clients",
      "accounts",
      "envelopes",
      "txns",
      "recurring",
      "khata",
      "cashbook",
      "household",
      "members",
      "settings",
    ],
    "readwrite",
  );
  await tx.objectStore("profile").put(snap.profile, "main");
  await tx.objectStore("settings").put(snap.settings, "main");
  for (const r of snap.receipts) await tx.objectStore("receipts").put(r);
  for (const r of snap.invoices) await tx.objectStore("invoices").put(r);
  for (const r of snap.expenses) await tx.objectStore("expenses").put(r);
  for (const r of snap.clients) await tx.objectStore("clients").put(r);
  for (const r of snap.accounts) await tx.objectStore("accounts").put(r);
  for (const r of snap.envelopes) await tx.objectStore("envelopes").put(r);
  for (const r of snap.txns) await tx.objectStore("txns").put(r);
  for (const r of snap.recurring) await tx.objectStore("recurring").put(r);
  for (const r of snap.khata) await tx.objectStore("khata").put(r);
  for (const r of snap.cashbook) await tx.objectStore("cashbook").put(r);
  if (snap.household) await tx.objectStore("household").put(snap.household);
  for (const r of snap.members) await tx.objectStore("members").put(r);
  await tx.done;
}
