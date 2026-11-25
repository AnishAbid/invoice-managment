"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as db from "./db";
import { tr } from "./i18n";
import { newId, todayISO, computeTotals, formatMoney } from "./receipt";
import {
  computeBudget,
  computePeriodActivity,
  dateRangeFor,
  DEFAULT_ACCOUNTS,
  DEFAULT_ENVELOPES,
  paymentToAccountKind,
  round2,
} from "./budget";
import { decryptSnapshot, encryptSnapshot, hashPassword, hashPin, randomSalt } from "./backup";
import { downloadBlob } from "./export";
import type {
  AppSettings,
  BusinessProfile,
  CashBookEntry,
  Client,
  Currency,
  Envelope,
  Expense,
  Household,
  HouseholdMember,
  Invoice,
  KhataEntry,
  Language,
  MoneyAccount,
  MoneyTxn,
  PaymentMethod,
  Receipt,
  RecurringRule,
  ReportPeriod,
  SignedAccount,
  DocumentData,
} from "./types";
import { emptyProfile } from "./types";

type LedgerState = {
  ready: boolean;
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
  signedIn: SignedAccount | null;
  settings: AppSettings;
  unlocked: boolean;
};

type LedgerApi = LedgerState & {
  t: (key: string, vars?: Record<string, string | number>) => string;
  lang: Language;
  currency: Currency;
  refresh: () => Promise<void>;
  saveProfile: (p: BusinessProfile) => Promise<void>;
  ensureDefaults: () => Promise<void>;
  runDueRecurring: () => Promise<number>;
  loadSample: () => Promise<void>;
  // receipts (existing db helpers still work; also via store)
  upsertReceipt: (r: Receipt, file?: Blob) => Promise<void>;
  removeReceipt: (id: string) => Promise<void>;
  // invoices
  saveInvoice: (inv: Invoice, opts?: { consumeNumber?: boolean }) => Promise<void>;
  removeInvoice: (id: string) => Promise<void>;
  markInvoicePaid: (inv: Invoice, method?: PaymentMethod) => Promise<Receipt>;
  // expenses
  saveExpense: (e: Expense, file?: Blob) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  // clients
  saveClient: (c: Client) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  // accounts / envelopes / txns
  saveAccount: (a: MoneyAccount) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  saveEnvelope: (e: Envelope) => Promise<void>;
  removeEnvelope: (id: string) => Promise<void>;
  addIncome: (input: { amount: number; accountId: string; payee?: string; notes?: string; date?: string }) => Promise<void>;
  addExpenseTxn: (input: {
    amount: number;
    accountId: string;
    envelopeId?: string;
    payee?: string;
    notes?: string;
    date?: string;
    alsoExpenseSlip?: boolean;
  }) => Promise<void>;
  transfer: (input: { amount: number; fromId: string; toId: string; notes?: string; date?: string }) => Promise<void>;
  fillEnvelope: (input: { amount: number; envelopeId: string; notes?: string }) => Promise<void>;
  moveBetweenEnvelopes: (input: { amount: number; fromId: string; toId: string; notes?: string }) => Promise<void>;
  saveRecurring: (r: RecurringRule) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
  // khata / cash
  saveKhata: (e: KhataEntry) => Promise<void>;
  removeKhata: (id: string) => Promise<void>;
  saveCashbook: (e: CashBookEntry) => Promise<void>;
  removeCashbook: (id: string) => Promise<void>;
  // household
  saveHouseholdName: (name: string) => Promise<void>;
  saveMember: (m: HouseholdMember) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  setActiveMember: (id: string | undefined) => Promise<void>;
  // auth / pin / backup
  signUpLocal: (email: string, password: string, displayName: string) => Promise<void>;
  signInLocal: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setPin: (pin: string | null) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  backupEncrypted: (passphrase: string) => Promise<void>;
  restoreEncrypted: (file: Blob, passphrase: string) => Promise<void>;
  eraseAll: () => Promise<void>;
  // derived
  budget: ReturnType<typeof computeBudget>;
  activityFor: (period: ReportPeriod) => ReturnType<typeof computePeriodActivity>;
  khataBalances: { toGet: number; toGive: number; byParty: Record<string, number> };
  accountById: (id?: string) => MoneyAccount | undefined;
  envelopeById: (id?: string) => Envelope | undefined;
  memberById: (id?: string) => HouseholdMember | undefined;
  activeMember: HouseholdMember | null;
  format: (amount: number, currency?: Currency) => string;
};

const Ctx = createContext<LedgerApi | null>(null);

const initial: LedgerState = {
  ready: false,
  profile: emptyProfile(),
  receipts: [],
  invoices: [],
  expenses: [],
  clients: [],
  accounts: [],
  envelopes: [],
  txns: [],
  recurring: [],
  khata: [],
  cashbook: [],
  household: null,
  members: [],
  signedIn: null,
  settings: { pinEnabled: false },
  unlocked: true,
};

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LedgerState>(initial);

  const refresh = useCallback(async () => {
    try {
      const [
        profile,
        receipts,
        invoices,
        expenses,
        clients,
        accounts,
        envelopes,
        txns,
        recurring,
        khata,
        cashbook,
        household,
        members,
        signedIn,
        settings,
      ] = await Promise.all([
        db.getProfile(),
        db.listReceipts(),
        db.listInvoices(),
        db.listExpenses(),
        db.listClients(),
        db.listAccounts(),
        db.listEnvelopes(),
        db.listTxns(),
        db.listRecurring(),
        db.listKhata(),
        db.listCashbook(),
        db.getHousehold(),
        db.listMembers(),
        db.getSignedIn(),
        db.getSettings(),
      ]);
      const pinOn = settings.pinEnabled && !!settings.pinHash;
      const sessionOk = typeof window !== "undefined" && sessionStorage.getItem("raseed-unlocked") === "1";
      setState({
        ready: true,
        profile,
        receipts,
        invoices,
        expenses,
        clients,
        accounts,
        envelopes,
        txns,
        recurring,
        khata,
        cashbook,
        household,
        members,
        signedIn,
        settings,
        unlocked: !pinOn || sessionOk,
      });
    } catch (err) {
      console.error("Ledger refresh failed", err);
      setState((s) => ({ ...s, ready: true, unlocked: true }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const advanceDate = (iso: string, freq: RecurringRule["freq"]) => {
    const d = new Date(`${iso}T00:00:00`);
    if (freq === "daily") d.setDate(d.getDate() + 1);
    else if (freq === "weekly") d.setDate(d.getDate() + 7);
    else if (freq === "yearly") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const runDueRecurring = useCallback(async () => {
    const rules = await db.listRecurring();
    const today = todayISO();
    let ran = 0;
    for (const rule of rules) {
      if (!rule.enabled || rule.nextDate > today) continue;
      const now = Date.now();
      if (rule.kind === "income") {
        await db.saveTxn({
          id: newId(),
          kind: "income",
          date: rule.nextDate,
          amount: rule.amount,
          currency: rule.currency,
          accountId: rule.accountId,
          payee: rule.payee,
          notes: rule.notes || "Recurring",
          recurringId: rule.id,
          createdAt: now,
        });
      } else if (rule.kind === "expense") {
        await db.saveTxn({
          id: newId(),
          kind: "expense",
          date: rule.nextDate,
          amount: rule.amount,
          currency: rule.currency,
          accountId: rule.accountId,
          envelopeId: rule.envelopeId,
          payee: rule.payee,
          notes: rule.notes || "Recurring",
          recurringId: rule.id,
          createdAt: now,
        });
      }
      let next = advanceDate(rule.nextDate, rule.freq);
      while (next <= today) next = advanceDate(next, rule.freq);
      await db.saveRecurring({ ...rule, nextDate: next, updatedAt: now });
      ran += 1;
    }
    if (ran) await refresh();
    return ran;
  }, [refresh]);

  const ensureDefaults = useCallback(async () => {
    const accounts = await db.listAccounts();
    const envelopes = await db.listEnvelopes();
    const now = Date.now();
    if (!accounts.length) {
      for (const a of DEFAULT_ACCOUNTS) {
        await db.saveAccount({ ...a, currency: state.profile.defaultCurrency, createdAt: now, updatedAt: now });
      }
    }
    if (!envelopes.length) {
      let sort = 0;
      for (const e of DEFAULT_ENVELOPES) {
        await db.saveEnvelope({
          id: e.id,
          name: e.name,
          group: e.group,
          color: e.color,
          archived: false,
          sort: sort++,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    await runDueRecurring();
    await refresh();
  }, [refresh, state.profile.defaultCurrency, runDueRecurring]);

  const lang = state.profile.defaultLanguage;
  const currency = state.profile.defaultCurrency;
  const t = useCallback((key: string, vars?: Record<string, string | number>) => tr(lang, key, vars), [lang]);

  const budget = useMemo(
    () => computeBudget(state.accounts, state.envelopes, state.txns, currency),
    [state.accounts, state.envelopes, state.txns, currency],
  );

  const activityFor = useCallback(
    (period: ReportPeriod) => computePeriodActivity(state.txns, currency, dateRangeFor(period)),
    [state.txns, currency],
  );

  const khataBalances = useMemo(() => {
    const byParty: Record<string, number> = {};
    for (const c of state.clients) byParty[c.id] = c.openingBalance;
    for (const e of state.khata) {
      if (e.currency !== currency) continue;
      byParty[e.partyId] = (byParty[e.partyId] ?? 0) + (e.kind === "got" ? e.amount : -e.amount);
    }
    let toGet = 0;
    let toGive = 0;
    for (const v of Object.values(byParty)) {
      if (v > 0) toGet += v;
      else toGive += -v;
    }
    return { toGet: round2(toGet), toGive: round2(toGive), byParty };
  }, [state.clients, state.khata, currency]);

  const accountById = useCallback((id?: string) => state.accounts.find((a) => a.id === id), [state.accounts]);
  const envelopeById = useCallback((id?: string) => state.envelopes.find((e) => e.id === id), [state.envelopes]);
  const memberById = useCallback((id?: string) => state.members.find((m) => m.id === id), [state.members]);
  const activeMember = useMemo(() => {
    const id = state.settings.activeMemberId;
    return (id && memberById(id)) || state.members[0] || null;
  }, [state.settings.activeMemberId, state.members, memberById]);

  const format = useCallback(
    (amount: number, c: Currency = currency) => formatMoney(amount, c, lang),
    [currency, lang],
  );

  const api: LedgerApi = {
    ...state,
    t,
    lang,
    currency,
    refresh,
    budget,
    activityFor,
    khataBalances,
    accountById,
    envelopeById,
    memberById,
    activeMember,
    format,
    ensureDefaults,
    runDueRecurring,
    saveProfile: async (p) => {
      await db.saveProfile(p);
      await refresh();
    },
    upsertReceipt: async (r, file) => {
      await db.saveReceipt(r, file);
      await refresh();
    },
    removeReceipt: async (id) => {
      await db.deleteReceipt(id);
      await refresh();
    },
    saveInvoice: async (inv, opts) => {
      await db.saveInvoice(inv);
      if (opts?.consumeNumber) await db.commitInvoiceNumber();
      await refresh();
    },
    removeInvoice: async (id) => {
      await db.deleteInvoice(id);
      await refresh();
    },
    markInvoicePaid: async (inv, method) => {
      const now = Date.now();
      const payMethod = method ?? inv.data.paymentMethod;
      const totals = computeTotals({
        receiptNumber: inv.data.number,
        date: inv.data.date,
        vendor: inv.data.vendor,
        customer: inv.data.customer,
        items: inv.data.items,
        taxPercent: inv.data.taxPercent,
        discountType: inv.data.discountType,
        discountValue: inv.data.discountValue,
        paymentMethod: payMethod,
        notes: inv.data.notes,
        language: inv.data.language,
        currency: inv.data.currency,
        template: inv.data.template,
      });
      await db.saveInvoice({
        ...inv,
        status: "paid",
        amountPaid: totals.total,
        paidAt: todayISO(),
        updatedAt: now,
        data: { ...inv.data, paymentMethod: payMethod },
      });

      const receiptNumber = await db.nextReceiptNumber();
      const titled: Receipt = {
        id: newId(),
        kind: "generated",
        title: inv.data.customer.name || inv.data.vendor.name || inv.number,
        date: todayISO(),
        total: totals.total,
        currency: inv.data.currency,
        category: inv.category,
        createdAt: now,
        updatedAt: now,
        data: {
          receiptNumber,
          date: todayISO(),
          vendor: inv.data.vendor,
          customer: inv.data.customer,
          items: inv.data.items,
          taxPercent: inv.data.taxPercent,
          discountType: inv.data.discountType,
          discountValue: inv.data.discountValue,
          paymentMethod: payMethod,
          notes: inv.data.notes ? `${inv.data.notes}\nPaid invoice ${inv.number}` : `Paid invoice ${inv.number}`,
          language: inv.data.language,
          currency: inv.data.currency,
          template: inv.data.template,
        },
      };
      await db.saveReceipt(titled);
      await db.commitReceiptNumber();

      await ensureDefaults();
      const accounts = await db.listAccounts();
      const kind = paymentToAccountKind(payMethod);
      const account = accounts.find((a) => a.kind === kind && !a.archived) ?? accounts.find((a) => !a.archived);
      if (account) {
        await db.saveTxn({
          id: newId(),
          kind: "income",
          date: todayISO(),
          amount: totals.total,
          currency: inv.data.currency,
          accountId: account.id,
          payee: inv.data.customer.name || inv.number,
          notes: `Invoice ${inv.number}`,
          invoiceId: inv.id,
          memberId: activeMember?.id,
          createdAt: now,
        });
      }
      await refresh();
      return titled;
    },
    saveExpense: async (e, file) => {
      await db.saveExpense(e, file);
      await refresh();
    },
    removeExpense: async (id) => {
      await db.deleteExpense(id);
      await refresh();
    },
    saveClient: async (c) => {
      await db.saveClient(c);
      await refresh();
    },
    removeClient: async (id) => {
      await db.deleteClient(id);
      await refresh();
    },
    saveAccount: async (a) => {
      await db.saveAccount(a);
      await refresh();
    },
    removeAccount: async (id) => {
      await db.deleteAccount(id);
      await refresh();
    },
    saveEnvelope: async (e) => {
      await db.saveEnvelope(e);
      await refresh();
    },
    removeEnvelope: async (id) => {
      await db.deleteEnvelope(id);
      await refresh();
    },
    addIncome: async (input) => {
      await ensureDefaults();
      const now = Date.now();
      await db.saveTxn({
        id: newId(),
        kind: "income",
        date: input.date ?? todayISO(),
        amount: input.amount,
        currency,
        accountId: input.accountId,
        payee: input.payee ?? "",
        notes: input.notes ?? "",
        memberId: activeMember?.id,
        createdAt: now,
      });
      await refresh();
    },
    addExpenseTxn: async (input) => {
      await ensureDefaults();
      const now = Date.now();
      const txnId = newId();
      let expenseId: string | undefined;
      if (input.alsoExpenseSlip !== false) {
        expenseId = newId();
        const account = accountById(input.accountId);
        await db.saveExpense({
          id: expenseId,
          vendor: input.payee || "Expense",
          date: input.date ?? todayISO(),
          amount: input.amount,
          currency,
          category: envelopeById(input.envelopeId)?.name ?? "",
          paymentMethod: account?.kind === "credit" ? "card" : account?.kind === "checking" ? "bank_transfer" : "cash",
          accountId: input.accountId,
          notes: input.notes ?? "",
          createdAt: now,
          updatedAt: now,
        });
      }
      await db.saveTxn({
        id: txnId,
        kind: "expense",
        date: input.date ?? todayISO(),
        amount: input.amount,
        currency,
        accountId: input.accountId,
        envelopeId: input.envelopeId,
        payee: input.payee ?? "",
        notes: input.notes ?? "",
        expenseId,
        memberId: activeMember?.id,
        createdAt: now,
      });
      await refresh();
    },
    transfer: async (input) => {
      await db.saveTxn({
        id: newId(),
        kind: "transfer",
        date: input.date ?? todayISO(),
        amount: input.amount,
        currency,
        accountId: input.fromId,
        toAccountId: input.toId,
        notes: input.notes ?? "",
        memberId: activeMember?.id,
        createdAt: Date.now(),
        payee: "",
      });
      await refresh();
    },
    fillEnvelope: async (input) => {
      await db.saveTxn({
        id: newId(),
        kind: "assign",
        date: todayISO(),
        amount: input.amount,
        currency,
        envelopeId: input.envelopeId,
        notes: input.notes ?? "",
        memberId: activeMember?.id,
        createdAt: Date.now(),
        payee: "",
      });
      await refresh();
    },
    moveBetweenEnvelopes: async (input) => {
      await db.saveTxn({
        id: newId(),
        kind: "move",
        date: todayISO(),
        amount: input.amount,
        currency,
        fromEnvelopeId: input.fromId,
        envelopeId: input.toId,
        notes: input.notes ?? "",
        memberId: activeMember?.id,
        createdAt: Date.now(),
        payee: "",
      });
      await refresh();
    },
    saveRecurring: async (r) => {
      await db.saveRecurring(r);
      await refresh();
    },
    removeRecurring: async (id) => {
      await db.deleteRecurring(id);
      await refresh();
    },
    saveKhata: async (e) => {
      await db.saveKhata(e);
      await refresh();
    },
    removeKhata: async (id) => {
      await db.deleteKhata(id);
      await refresh();
    },
    saveCashbook: async (e) => {
      const now = Date.now();
      const txnId = e.txnId || newId();
      await db.saveTxn({
        id: txnId,
        kind: e.kind === "cashIn" ? "income" : "expense",
        date: e.date,
        amount: e.amount,
        currency: e.currency,
        accountId: e.accountId,
        payee: e.kind === "cashIn" ? "Cash in" : "Cash out",
        notes: e.notes,
        memberId: e.memberId,
        createdAt: now,
      });
      await db.saveCashbook({ ...e, txnId });
      await refresh();
    },
    removeCashbook: async (id) => {
      await db.deleteCashbook(id);
      await refresh();
    },
    saveHouseholdName: async (name) => {
      const existing = state.household;
      const h: Household = existing ?? { id: newId(), name, createdAt: Date.now() };
      await db.saveHousehold({ ...h, name });
      await refresh();
    },
    saveMember: async (m) => {
      await db.saveMember(m);
      await refresh();
    },
    removeMember: async (id) => {
      await db.deleteMember(id);
      await refresh();
    },
    setActiveMember: async (id) => {
      const settings = { ...state.settings, activeMemberId: id };
      await db.saveSettings(settings);
      await refresh();
    },
    signUpLocal: async (email, password, displayName) => {
      const salt = randomSalt();
      const passwordHash = await hashPassword(password, salt);
      const account: SignedAccount = {
        id: newId(),
        provider: "local",
        email: email.trim().toLowerCase(),
        displayName: displayName || email,
        passwordHash,
        salt,
        createdAt: Date.now(),
      };
      await db.saveAuthAccount(account);
      await db.setSignedInId(account.id);
      await refresh();
    },
    signInLocal: async (email, password) => {
      const accounts = await db.listAuthAccounts();
      const found = accounts.find((a) => a.provider === "local" && a.email === email.trim().toLowerCase());
      if (!found?.salt || !found.passwordHash) throw new Error("Account not found");
      const hash = await hashPassword(password, found.salt);
      if (hash !== found.passwordHash) throw new Error("Wrong password");
      await db.setSignedInId(found.id);
      await refresh();
    },
    signOut: async () => {
      await db.setSignedInId(null);
      sessionStorage.removeItem("raseed-unlocked");
      await refresh();
    },
    setPin: async (pin) => {
      if (!pin) {
        await db.saveSettings({ ...state.settings, pinEnabled: false, pinHash: undefined, pinSalt: undefined });
        sessionStorage.setItem("raseed-unlocked", "1");
      } else {
        const salt = randomSalt();
        const pinHash = await hashPin(pin, salt);
        await db.saveSettings({ ...state.settings, pinEnabled: true, pinHash, pinSalt: salt });
        sessionStorage.setItem("raseed-unlocked", "1");
      }
      await refresh();
    },
    unlockWithPin: async (pin) => {
      if (!state.settings.pinSalt || !state.settings.pinHash) return true;
      const hash = await hashPin(pin, state.settings.pinSalt);
      if (hash !== state.settings.pinHash) return false;
      sessionStorage.setItem("raseed-unlocked", "1");
      setState((s) => ({ ...s, unlocked: true }));
      return true;
    },
    backupEncrypted: async (passphrase) => {
      const snap = await db.exportSnapshot();
      const blob = await encryptSnapshot(snap, passphrase);
      downloadBlob(blob, `ledgerly-backup-${todayISO()}.enc`);
      await db.saveSettings({ ...state.settings, lastBackupAt: Date.now() });
      await refresh();
    },
    restoreEncrypted: async (file, passphrase) => {
      const snap = await decryptSnapshot(file, passphrase);
      await db.importSnapshot(snap, true);
      await refresh();
    },
    eraseAll: async () => {
      await db.clearAllLedgerData();
      await db.saveProfile(emptyProfile());
      await refresh();
    },
    loadSample: async () => {
      await ensureDefaults();
      const now = Date.now();
      const client: Client = {
        id: newId(),
        name: "Ahmed Traders",
        phone: "0300-1234567",
        email: "ahmed@example.com",
        address: "Lahore",
        notes: "",
        role: "customer",
        openingBalance: 0,
        createdAt: now,
        updatedAt: now,
      };
      await db.saveClient(client);
      const invNumber = await db.nextInvoiceNumber();
      const data: DocumentData = {
        number: invNumber,
        date: todayISO(),
        dueDate: todayISO(),
        vendor: { name: state.profile.name || "My Shop", phone: state.profile.phone, address: state.profile.address },
        customer: { name: client.name, phone: client.phone, address: client.address, email: client.email },
        items: [
          { id: newId(), description: "Consulting", quantity: 1, unitPrice: 15000 },
          { id: newId(), description: "Parts", quantity: 2, unitPrice: 2500 },
        ],
        taxPercent: 0,
        discountType: "amount",
        discountValue: 0,
        paymentMethod: "cash",
        notes: "Sample invoice",
        language: lang,
        currency,
        template: "classic",
      };
      await db.saveInvoice({
        id: newId(),
        number: invNumber,
        clientId: client.id,
        status: "sent",
        data,
        amountPaid: 0,
        createdAt: now,
        updatedAt: now,
      });
      await db.commitInvoiceNumber();
      const cash = (await db.listAccounts()).find((a) => a.kind === "cash")!;
      const groceries = (await db.listEnvelopes()).find((e) => e.name === "Groceries");
      await db.saveTxn({
        id: newId(),
        kind: "income",
        date: todayISO(),
        amount: 50000,
        currency,
        accountId: cash.id,
        payee: "Opening",
        notes: "Sample income",
        createdAt: now,
      });
      if (groceries) {
        await db.saveTxn({
          id: newId(),
          kind: "assign",
          date: todayISO(),
          amount: 10000,
          currency,
          envelopeId: groceries.id,
          payee: "",
          notes: "Fill groceries",
          createdAt: now + 1,
        });
        await db.saveTxn({
          id: newId(),
          kind: "expense",
          date: todayISO(),
          amount: 2200,
          currency,
          accountId: cash.id,
          envelopeId: groceries.id,
          payee: "Utility Store",
          notes: "Sample spend",
          createdAt: now + 2,
        });
      }
      await refresh();
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useLedger() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLedger must be used within LedgerProvider");
  return ctx;
}
