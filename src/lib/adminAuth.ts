import { cookies } from "next/headers";
import crypto from "crypto";
import { redirect } from "next/navigation";

const COOKIE_NAME = "admin_session";
const SESSION_TTL_SEC = 60 * 60 * 12; // 12h

function hmac(value: string) {
  const secret = process.env.ADMIN_SECRET || "dev-secret";
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSessionToken(username: string, expSec: number) {
  const payload = `${username}.${expSec}`;
  const sig = hmac(payload);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): { valid: boolean; username?: string } {
  if (!token) return { valid: false };
  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false };
  const [username, expStr, sig] = parts;
  const payload = `${username}.${expStr}`;
  const expected = hmac(payload);
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  const exp = Number(expStr);
  if (!ok || !exp || Date.now() / 1000 > exp) return { valid: false };
  return { valid: true, username };
}

export async function requireAdmin() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const { valid } = verifySessionToken(token);
  if (!valid) redirect("/admin/login");
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const res = verifySessionToken(token);
  return res.valid ? res : null;
}

export async function setAdminCookie(username: string) {
  const store = await cookies();
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const token = createSessionToken(username, exp);
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
