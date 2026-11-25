"use client";

import type { LedgerSnapshot } from "./db";

const ITERATIONS = 120_000;
const MAGIC = "raseed-backup.v1";

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function b64(bytes: ArrayBuffer | Uint8Array) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of u8) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(s: string) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptSnapshot(snap: LedgerSnapshot, passphrase: string): Promise<Blob> {
  if (passphrase.trim().length < 6) throw new Error("Passphrase must be at least 6 characters");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const plain = new TextEncoder().encode(JSON.stringify(snap));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  const payload = {
    magic: MAGIC,
    kdf: "PBKDF2-HMAC-SHA256",
    iterations: ITERATIONS,
    salt: b64(salt),
    iv: b64(iv),
    ciphertext: b64(cipher),
  };
  return new Blob([JSON.stringify(payload)], { type: "application/octet-stream" });
}

export async function decryptSnapshot(file: Blob, passphrase: string): Promise<LedgerSnapshot> {
  const payload = JSON.parse(await file.text()) as {
    magic?: string;
    salt: string;
    iv: string;
    ciphertext: string;
    iterations?: number;
  };
  if (payload.magic !== MAGIC) throw new Error("Not a Ledgerly backup file");
  const salt = fromB64(payload.salt);
  const iv = fromB64(payload.iv);
  const key = await deriveKey(passphrase, salt);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    fromB64(payload.ciphertext) as BufferSource,
  );
  return JSON.parse(new TextDecoder().decode(plain)) as LedgerSnapshot;
}

export async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const dig = await crypto.subtle.digest("SHA-256", data);
  return b64(dig);
}

export async function hashPin(pin: string, salt: string) {
  return hashPassword(pin, salt);
}

export function randomSalt() {
  return b64(crypto.getRandomValues(new Uint8Array(16)));
}
