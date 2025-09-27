"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { usersTable, warningsTable, smsQueueTable } from "@/lib/schema";
import { desc, and, count, eq, gte, lte } from "drizzle-orm";
import { baseMessageByLang, formatStampForMessage, isImmediateHour, nextRunAtForHour } from "@/lib/smsUtil";
import { feedbackTable } from "@/lib/schema";
import {
  setAdminCookie, clearAdminCookie, getAdminSession,
  setPending2faCookie, clearPending2faCookie, hasPending2faCookie
} from "@/lib/adminAuth";
import { getAdminMfa, saveAdminMfaEnabled, saveAdminMfaSecret } from "@/lib/adminMfa";
import { newTotpSecret, totpUri, verifyTotp } from "@/lib/totp";
import QRCode from "qrcode";
import { revalidatePath } from "next/cache";

export type LoginState = { error?: string | null };

///
// STEP 1: password
//
export async function adminStartSignIn(_: any, formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  const ok =
    username === (process.env.ADMIN_USERNAME || "") &&
    password === (process.env.ADMIN_PASSWORD || "");

  if (!ok) return { error: "Invalid credentials" };

  const mfa = await getAdminMfa();

  if (mfa?.mfaEnabled && mfa.mfaSecret) {
    await setPending2faCookie();
    redirect("/admin/login/2fa");
  } else {
    await setAdminCookie(username);
    redirect("/admin");
  }
}

//
// STEP 2: verify TOTP
//
export async function adminVerifyTotp(_: any, formData: FormData) {
  const hasPending = await hasPending2faCookie();
  if (!hasPending) return { error: "Session expired. Please sign in again." };

  const code = String(formData.get("code") || "").replace(/\s+/g, "");
  const mfa = await getAdminMfa();

  if (!mfa?.mfaEnabled || !mfa.mfaSecret) {
    return { error: "2FA is not enabled." };
  }

  const valid = verifyTotp(mfa.mfaSecret, code);
  if (!valid) return { error: "Invalid code" };

  await clearPending2faCookie();
  await setAdminCookie(process.env.ADMIN_USERNAME || "admin");
  redirect("/admin");
}

//
// Admin: 2FA setup (only when already logged in)
//
export async function createMfaEnrollment() {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");

  const current = await getAdminMfa();
  const secret = current?.mfaSecret ?? newTotpSecret();
  if (!current?.mfaSecret) {
    await saveAdminMfaSecret(secret);
  }

  const issuer = "Liukasbotti Admin";
  const label = process.env.ADMIN_USERNAME || "admin";
  const uri = totpUri({ secret, issuer, label });

  const qrDataUrl = await QRCode.toDataURL(uri);
  return { secret, uri, qrDataUrl };
}
export async function finalizeMfaEnable(formData: FormData) {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");

  const code = String(formData.get("code") || "").replace(/\s+/g, "");
  const mfa = await getAdminMfa();
  if (!mfa?.mfaSecret) throw new Error("No secret to verify");

  if (!verifyTotp(mfa.mfaSecret, code)) {
    return { error: "Invalid code" };
  }

  await saveAdminMfaEnabled(true);
  revalidatePath("/admin/2fa");
  return { ok: true };
}

export async function disableMfa() {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");

  await saveAdminMfaEnabled(false);
  await saveAdminMfaSecret(null);
  revalidatePath("/admin/2fa");
  return { ok: true };
}


// SIGN OUT
export async function adminSignOut() {
  await clearAdminCookie();
  await clearPending2faCookie();
  redirect("/admin/login");
}

// INITIAL SUMMARY (last 30d)
export async function getAdminSummary() {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");

  const now = new Date();
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [[{ totalUsers }], [{ newUsers }], [{ warnings }], [{ smsSent }]] = await Promise.all([
    db.select({ totalUsers: count() }).from(usersTable),
    db
      .select({ newUsers: count() })
      .from(usersTable)
      .where(and(gte(usersTable.joinDate, from), lte(usersTable.joinDate, now))),
    db
      .select({ warnings: count() })
      .from(warningsTable)
      .where(and(gte(warningsTable.onsetAt, from), lte(warningsTable.onsetAt, now))),
    db
      .select({ smsSent: count() })
      .from(smsQueueTable)
      .where(and(eq(smsQueueTable.status, "sent"), gte(smsQueueTable.sentAt, from), lte(smsQueueTable.sentAt, now))),
  ]);

  return {
    totalUsers: Number(totalUsers),
    newUsers: Number(newUsers),
    warnings: Number(warnings),
    smsSent: Number(smsSent),
  };
}

type Lang = "fi" | "sv" | "en";
const LANGS: Lang[] = ["fi", "sv", "en"];

function normalizeLang(raw: string | null | undefined): Lang {
  const v = (raw || "").toLowerCase();
  return (LANGS as string[]).includes(v as Lang) ? (v as Lang) : "fi";
}

/** Enqueue a manual warning for all users; scheduler.ts will actually send it. */
export async function sendWarningToAll(_: any, formData: FormData) {
    const session = await getAdminSession();
    if (!session) return { error: "Unauthorized" };
  
    const area = String(formData.get("area") || "ALL");
    const hours = Number(formData.get("hours") || 6);
    const sendNow = String(formData.get("sendNow") || "on") === "on";
  
    // Create the warning window
    const onsetAt = new Date();
    const expiresAt = new Date(onsetAt.getTime() + hours * 60 * 60 * 1000);
    const id = `manual-${Date.now()}`;
  
    await db.insert(warningsTable).values({
      id,
      area,
      status: "active",
      onsetAt,
      expiresAt,
    });
  
    // Load users
    const users = await db.select().from(usersTable);
    if (users.length === 0) return { ok: true, warningId: id, recipients: 0 };
  
    // Build base texts once (timestamped in Helsinki TZ)
    const stamp = formatStampForMessage();
    const textFor: Record<Lang, string> = {
      fi: baseMessageByLang("fi", stamp),
      sv: baseMessageByLang("sv", stamp),
      en: baseMessageByLang("en", stamp),
    };
  
    // Prepare queue rows (status=pending)
    const now = new Date();
    const rows = users.flatMap((u) => {
      const lang = normalizeLang(u.language);
      const message = textFor[lang];
  
      // Respect user's preferred hour unless "send now"
      let scheduledAt =
        sendNow || isImmediateHour(u.hour)
          ? now
          : nextRunAtForHour(u.hour!, now);
  
      // Clamp to the warning window
      if (scheduledAt < onsetAt) scheduledAt = onsetAt;
      if (scheduledAt > expiresAt) return []; // skip if beyond expiry
  
      return [{
        warningId: id,
        userId: u.id,
        phone: u.phone,
        language: lang,
        message,
        scheduledAt,
        status: "pending" as const,
      }];
    });
  
    // Insert in chunks; ON CONFLICT DO NOTHING prevents duplicates (unique idx present)
    const CHUNK = 1000;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await db
        .insert(smsQueueTable)
        .values(rows.slice(i, i + CHUNK))
        .onConflictDoNothing(); 
    }
  
    // Done: scheduler.ts will send these within its next tick
    return { ok: true, warningId: id, recipients: rows.length };
  }



/** List latest feedback (optionally filter by status). Used by the /admin page (server component). */
export async function getFeedbackList(opts?: { limit?: number; status?: "pending" | "handled" | "resolved" | "all" }) {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");

  const limit = opts?.limit ?? 50;
  const status = opts?.status ?? "all";

  const q = db
    .select()
    .from(feedbackTable)
    .orderBy(desc(feedbackTable.createdAt))
    .limit(limit);

  if (status !== "all") {
    return await db
      .select()
      .from(feedbackTable)
      .where(eq(feedbackTable.status, status))
      .orderBy(desc(feedbackTable.createdAt))
      .limit(limit);
  }
  return await q;
}

/** Mark a feedback row as handled. */
export async function markFeedbackHandled(formData: FormData) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return { error: "Invalid feedback id" };

  await db.update(feedbackTable).set({ status: "handled" }).where(eq(feedbackTable.id, id));
  revalidatePath("/admin");
  return { ok: true };
}

/** Return currently-active, not-expired warnings. */
export async function getActiveWarningsForAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");

  const now = new Date();
  return await db
    .select()
    .from(warningsTable)
    .where(and(eq(warningsTable.status, "active"), gte(warningsTable.expiresAt, now)))
    .orderBy(desc(warningsTable.createdAt));
}

/** Update a warning's expiry (accepts a datetime-local string from the form). */
export async function updateWarningExpiry(formData: FormData) {
  const session = await getAdminSession();
  if (!session) return { error: "Unauthorized" };

  const id = String(formData.get("id") || "");
  const expires = String(formData.get("expiresAt") || "");
  if (!id || !expires) return { error: "Missing fields" };

  // "YYYY-MM-DDTHH:mm" from <input type="datetime-local">
  const newExpiresAt = new Date(expires);
  if (Number.isNaN(newExpiresAt.getTime())) return { error: "Invalid datetime" };

  await db.update(warningsTable).set({ expiresAt: newExpiresAt }).where(eq(warningsTable.id, id));
  revalidatePath("/admin");
  return { ok: true };
}