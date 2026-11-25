import type {
  Currency,
  MoneyAccount,
  MoneyTxn,
  Envelope,
  ReportPeriod,
  AccountKind,
  PaymentMethod,
} from "./types";
import { accountIsAsset, accountOnBudget } from "./types";

export const round2 = (n: number) => Math.round(n * 100) / 100;

export interface BudgetSnapshot {
  currency: Currency;
  accountBalances: Record<string, number>;
  envelopeAvailable: Record<string, number>;
  envelopeAssigned: Record<string, number>;
  envelopeSpent: Record<string, number>;
  readyToAssign: number;
  onBudgetNet: number;
  netWorth: number;
  creditOwed: number;
  ageOfMoneyDays: number | null;
  bufferDays: number | null;
}

export interface PeriodActivity {
  income: number;
  spent: number;
  byEnvelope: Record<string, number>;
  assigned: Record<string, number>;
}

export interface DateRange {
  start: Date;
  end: Date;
}

function add(map: Record<string, number>, id: string | undefined, amount: number) {
  if (!id) return;
  map[id] = (map[id] ?? 0) + amount;
}

function accountOf(accounts: MoneyAccount[], id?: string) {
  return id ? accounts.find((a) => a.id === id) : undefined;
}

export function dateRangeFor(period: ReportPeriod, now = new Date()): DateRange {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "day") return { start: today, end: today };
  if (period === "week") {
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return { start, end: today };
  }
  return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today };
}

export function rangeContainsIso(range: DateRange, iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return day >= range.start && day <= range.end;
}

export function computeBudget(
  accounts: MoneyAccount[],
  envelopes: Envelope[],
  txns: MoneyTxn[],
  currency: Currency,
): BudgetSnapshot {
  const accountBalances: Record<string, number> = {};
  for (const a of accounts) {
    if (a.currency === currency) accountBalances[a.id] = a.openingBalance;
  }
  const envelopeAvailable: Record<string, number> = Object.fromEntries(envelopes.map((e) => [e.id, 0]));
  const envelopeAssigned: Record<string, number> = Object.fromEntries(envelopes.map((e) => [e.id, 0]));
  const envelopeSpent: Record<string, number> = Object.fromEntries(envelopes.map((e) => [e.id, 0]));

  for (const txn of txns) {
    if (txn.currency !== currency) continue;
    const amt = txn.amount;
    switch (txn.kind) {
      case "income":
        add(accountBalances, txn.accountId, amt);
        break;
      case "expense": {
        const account = accountOf(accounts, txn.accountId);
        add(accountBalances, txn.accountId, account?.kind === "credit" ? amt : -amt);
        add(envelopeAvailable, txn.envelopeId, -amt);
        add(envelopeSpent, txn.envelopeId, amt);
        break;
      }
      case "transfer": {
        const from = accountOf(accounts, txn.accountId);
        const to = accountOf(accounts, txn.toAccountId);
        add(accountBalances, txn.accountId, from?.kind === "credit" ? amt : -amt);
        add(accountBalances, txn.toAccountId, to?.kind === "credit" ? -amt : amt);
        break;
      }
      case "assign":
        add(envelopeAvailable, txn.envelopeId, amt);
        add(envelopeAssigned, txn.envelopeId, amt);
        break;
      case "move":
        add(envelopeAvailable, txn.fromEnvelopeId, -amt);
        add(envelopeAvailable, txn.envelopeId, amt);
        add(envelopeAssigned, txn.fromEnvelopeId, -amt);
        add(envelopeAssigned, txn.envelopeId, amt);
        break;
    }
  }

  let assets = 0;
  let liabilities = 0;
  let onBudgetAssets = 0;
  let creditOwed = 0;
  for (const a of accounts) {
    if (a.currency !== currency || a.archived) continue;
    const bal = accountBalances[a.id] ?? 0;
    if (accountIsAsset(a.kind)) {
      assets += bal;
      if (accountOnBudget(a.kind)) onBudgetAssets += bal;
    } else {
      liabilities += bal;
      if (a.kind === "credit") creditOwed += bal;
    }
  }

  let envelopeTotal = 0;
  for (const e of envelopes) {
    if (!e.archived) envelopeTotal += envelopeAvailable[e.id] ?? 0;
  }

  const onBudgetNet = round2(onBudgetAssets - creditOwed);
  const ready = round2(onBudgetNet - envelopeTotal);

  return {
    currency,
    accountBalances: Object.fromEntries(Object.entries(accountBalances).map(([k, v]) => [k, round2(v)])),
    envelopeAvailable: Object.fromEntries(Object.entries(envelopeAvailable).map(([k, v]) => [k, round2(v)])),
    envelopeAssigned: Object.fromEntries(Object.entries(envelopeAssigned).map(([k, v]) => [k, round2(v)])),
    envelopeSpent: Object.fromEntries(Object.entries(envelopeSpent).map(([k, v]) => [k, round2(v)])),
    readyToAssign: ready,
    onBudgetNet,
    netWorth: round2(assets - liabilities),
    creditOwed: round2(creditOwed),
    ageOfMoneyDays: ageOfMoney(txns, currency),
    bufferDays: bufferDays(txns, currency, ready),
  };
}

export function computePeriodActivity(
  txns: MoneyTxn[],
  currency: Currency,
  range: DateRange,
): PeriodActivity {
  let income = 0;
  let spent = 0;
  const byEnvelope: Record<string, number> = {};
  const assigned: Record<string, number> = {};
  for (const txn of txns) {
    if (txn.currency !== currency || !rangeContainsIso(range, txn.date)) continue;
    if (txn.kind === "income") income += txn.amount;
    else if (txn.kind === "expense") {
      spent += txn.amount;
      add(byEnvelope, txn.envelopeId, txn.amount);
    } else if (txn.kind === "assign") add(assigned, txn.envelopeId, txn.amount);
  }
  return {
    income: round2(income),
    spent: round2(spent),
    byEnvelope: Object.fromEntries(Object.entries(byEnvelope).map(([k, v]) => [k, round2(v)])),
    assigned: Object.fromEntries(Object.entries(assigned).map(([k, v]) => [k, round2(v)])),
  };
}

function ageOfMoney(txns: MoneyTxn[], currency: Currency) {
  const incomes = txns
    .filter((t) => t.kind === "income" && t.currency === currency)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!incomes.length) return null;
  const ages: number[] = [];
  for (const exp of txns.filter((t) => t.kind === "expense" && t.currency === currency)) {
    const expDay = new Date(`${exp.date}T00:00:00`);
    let prior: (typeof incomes)[0] | undefined;
    for (const inc of incomes) if (inc.date <= exp.date) prior = inc;
    if (!prior) continue;
    const incDay = new Date(`${prior.date}T00:00:00`);
    ages.push(Math.min(3650, Math.max(0, Math.round((expDay.getTime() - incDay.getTime()) / 86400000))));
  }
  if (!ages.length) return null;
  return ages.reduce((a, b) => a + b, 0) / ages.length;
}

function bufferDays(txns: MoneyTxn[], currency: Currency, ready: number) {
  if (ready <= 0) return 0;
  const start = Date.now() - 30 * 86400000;
  let spent = 0;
  for (const t of txns) {
    if (t.kind !== "expense" || t.currency !== currency) continue;
    const d = new Date(`${t.date}T00:00:00`).getTime();
    if (d >= start) spent += t.amount;
  }
  if (spent <= 0) return null;
  return ready / (spent / 30);
}

export function paymentToAccountKind(method: PaymentMethod): AccountKind {
  if (method === "card") return "credit";
  if (method === "bank_transfer" || method === "cheque") return "checking";
  return "cash";
}

export const DEFAULT_ACCOUNTS: Omit<MoneyAccount, "createdAt" | "updatedAt">[] = [
  { id: "acct-cash", name: "Cash", kind: "cash", openingBalance: 0, currency: "PKR", archived: false, last4: "", creditLimit: 0, network: "" },
  { id: "acct-bank", name: "Bank", kind: "checking", openingBalance: 0, currency: "PKR", archived: false, last4: "", creditLimit: 0, network: "" },
  { id: "acct-card", name: "Card", kind: "credit", openingBalance: 0, currency: "PKR", archived: false, last4: "", creditLimit: 0, network: "" },
];

export const DEFAULT_ENVELOPES: { id: string; name: string; group: string; color: number }[] = [
  { id: "env-groceries", name: "Groceries", group: "Everyday", color: 0xff059669 },
  { id: "env-food", name: "Food & Dining", group: "Everyday", color: 0xffd97706 },
  { id: "env-fuel", name: "Fuel", group: "Everyday", color: 0xffb45309 },
  { id: "env-utilities", name: "Utilities", group: "Home", color: 0xff2563eb },
  { id: "env-rent", name: "Rent", group: "Home", color: 0xff7c3aed },
  { id: "env-medical", name: "Medical", group: "Life", color: 0xffdc2626 },
  { id: "env-shopping", name: "Shopping", group: "Everyday", color: 0xffdb2777 },
  { id: "env-travel", name: "Travel", group: "Life", color: 0xff0891b2 },
  { id: "env-education", name: "Education", group: "Life", color: 0xff4f46e5 },
  { id: "env-business", name: "Business", group: "Work", color: 0xff0f766e },
  { id: "env-other", name: "Other", group: "Everyday", color: 0xff64748b },
];
