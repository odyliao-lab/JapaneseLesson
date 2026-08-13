import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { localSessions, localUsers, profiles } from "../db/schema";

export const LOCAL_SESSION_COOKIE = "jpll_session";
const PASSWORD_ITERATIONS = 210_000;

export function isLocalDeployment() {
  return String((env as unknown as Record<string, unknown>).LOCAL_DEPLOYMENT ?? "") === "true";
}

export async function createLocalAccount(emailValue: string, displayNameValue: string, password: string) {
  const email = normalizeEmail(emailValue);
  const displayName = displayNameValue.trim().slice(0, 60);
  if (!isValidEmail(email) || displayName.length < 2 || password.length < 8) {
    throw new Error("請輸入有效 Email、至少 2 字的名稱，以及至少 8 字元的密碼。");
  }
  const db = getDb();
  const existing = await db.select({ email: localUsers.email }).from(localUsers).where(eq(localUsers.email, email)).limit(1);
  if (existing.length) throw new Error("此 Email 已建立帳號，請直接登入。");
  const passwordHash = await hashPassword(password);
  await db.batch([
    db.insert(localUsers).values({ email, displayName, passwordHash }),
    db.insert(profiles).values({ email, displayName, role: "student" }).onConflictDoNothing(),
  ]);
  return createSession(email);
}

export async function authenticateLocalAccount(emailValue: string, password: string) {
  const email = normalizeEmail(emailValue);
  const [account] = await getDb().select().from(localUsers).where(eq(localUsers.email, email)).limit(1);
  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    throw new Error("Email 或密碼不正確。");
  }
  return createSession(email);
}

export async function getLocalUser(sessionToken: string | undefined) {
  if (!sessionToken) return null;
  const tokenHash = await sha256(sessionToken);
  const db = getDb();
  const [session] = await db.select().from(localSessions).where(eq(localSessions.tokenHash, tokenHash)).limit(1);
  if (!session || new Date(session.expiresAt) <= new Date()) return null;
  const [account] = await db.select().from(localUsers).where(eq(localUsers.email, session.email)).limit(1);
  if (!account) return null;
  return { email: account.email, displayName: account.displayName, fullName: account.displayName };
}

export async function revokeLocalSession(sessionToken: string | undefined) {
  if (!sessionToken) return;
  await getDb().delete(localSessions).where(eq(localSessions.tokenHash, await sha256(sessionToken)));
}

async function createSession(email: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = bytesToBase64Url(bytes);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await getDb().insert(localSessions).values({ tokenHash: await sha256(token), email, expiresAt });
  return { token, expiresAt };
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  return `pbkdf2-sha256:${PASSWORD_ITERATIONS}:${bytesToBase64Url(salt)}:${bytesToBase64Url(hash)}`;
}

async function verifyPassword(password: string, stored: string) {
  const [algorithm, iterationsText, saltText, hashText] = stored.split(":");
  if (algorithm !== "pbkdf2-sha256") return false;
  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 100_000) return false;
  const actual = await derivePassword(password, base64UrlToBytes(saltText), iterations);
  const expected = base64UrlToBytes(hashText);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
  return difference === 0;
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
