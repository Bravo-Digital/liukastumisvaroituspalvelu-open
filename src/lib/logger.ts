// src/lib/logger.ts
import pino from "pino";
import crypto from "crypto";
import { db } from "@/lib/db";
import { auditEvents } from "@/lib/schema";
import { desc, sql } from "drizzle-orm";

// ---------- pino (stdout) ----------
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: null,
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true, singleLine: true } }
      : undefined,
  redact: {
    paths: [
      "headers.authorization",
      "Authorization",
      "body.password",
      "SMTP_PASS",
      "GATEWAYAPI_API_KEY",
    ],
    remove: true,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function maskPhone(p?: string | null) {
  if (!p) return "";
  const s = String(p);
  if (s.length <= 4) return "***";
  return s.slice(0, 3) + "***" + s.slice(-2);
}

// ---------- audit (DB + stdout) ----------

/** Minimal, no-PII shape for audit inputs */
export type AuditInput = {
  actor_type: string;                // "admin" | "worker" | "api" | ...
  actor_id?: string | null;          // username, phone hash, etc.
  action: string;                    // e.g. "login_password", "warning_send_all"
  subject_type?: string | null;      // "user" | "warning" | "report" | ...
  subject_id?: string | number | null;
  outcome?: "success" | "fail" | "error" | string | null;
  ip?: string | null;
  user_agent?: string | null;
  meta?: Record<string, unknown> | null; // put any extra fields here
};

function stableStringify(value: any): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",")}}`;
}

function computeHash(prevHash: string | null, payload: unknown) {
  return crypto
    .createHash("sha256")
    .update(prevHash ?? "")
    .update(stableStringify(payload))
    .digest("hex");
}

// Cache last hash for the process; we still lock in DB to avoid forks
let lastHashCache: string | null = null;

// Loosely-typed executor so it works with both db and tx (transaction)
async function getLastHashGeneric(executor: any): Promise<string | null> {
  const last = await executor
    .select({ hash: auditEvents.hash })
    .from(auditEvents)
    .orderBy(desc(auditEvents.id))
    .limit(1);
  return last[0]?.hash ?? null;
}

/**
 * Write a tamper-evident audit row into Postgres and also log to stdout (pino).
 * Uses a transaction + pg_advisory_xact_lock to serialize writers and keep the chain linear.
 */
export async function audit(ev: AuditInput) {
  const payload = {
    ts: new Date().toISOString(),
    actorType: ev.actor_type,
    actorId: ev.actor_id ?? null,
    action: ev.action,
    subjectType: ev.subject_type ?? null,
    subjectId: ev.subject_id != null ? String(ev.subject_id) : null,
    outcome: ev.outcome ?? null,
    ip: ev.ip ?? null,
    userAgent: ev.user_agent ?? null,
    meta: ev.meta ?? null,
  };

  await db.transaction(async (tx) => {
    // Serialize writers to avoid chain forks
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${BigInt(9424242)})`);

    const prevHash = lastHashCache ?? (await getLastHashGeneric(tx));
    const hash = computeHash(prevHash, payload);

    await tx.insert(auditEvents).values({
      ts: new Date(payload.ts),
      actorType: payload.actorType,
      actorId: payload.actorId,
      action: payload.action,
      subjectType: payload.subjectType,
      subjectId: payload.subjectId,
      outcome: payload.outcome,
      ip: payload.ip,
      userAgent: payload.userAgent,
      prevHash: prevHash,
      hash,
      meta: payload.meta as any,
    });

    lastHashCache = hash;
  });

  // Also to stdout (for ops/observability)
  logger.info({ type: "audit", ...payload });
}
