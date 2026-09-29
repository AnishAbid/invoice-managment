"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Receipt } from "./types";

interface ReceiptDB extends DBSchema {
  receipts: {
    key: string;
    value: Receipt;
    indexes: { "by-created": number };
  };
  files: {
    key: string; // receipt id
    value: Blob;
  };
  meta: {
    key: string;
    value: number;
  };
}

let dbPromise: Promise<IDBPDatabase<ReceiptDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<ReceiptDB>("receipt-manager", 1, {
      upgrade(database) {
        const store = database.createObjectStore("receipts", { keyPath: "id" });
        store.createIndex("by-created", "createdAt");
        database.createObjectStore("files");
        database.createObjectStore("meta");
      },
    });
  }
  return dbPromise;
}

export async function listReceipts(): Promise<Receipt[]> {
  const all = await (await db()).getAllFromIndex("receipts", "by-created");
  return all.reverse();
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

/** Returns the next sequential receipt number, e.g. RCPT-202609-0007. */
export async function nextReceiptNumber(): Promise<string> {
  const d = await db();
  const now = new Date();
  const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const key = `seq-${period}`;
  const current = (await d.get("meta", key)) ?? 0;
  return `RCPT-${period}-${String(current + 1).padStart(4, "0")}`;
}

/** Call after a new generated receipt is saved so the counter advances. */
export async function commitReceiptNumber() {
  const d = await db();
  const now = new Date();
  const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const key = `seq-${period}`;
  const current = (await d.get("meta", key)) ?? 0;
  await d.put("meta", current + 1, key);
}
