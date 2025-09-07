// src/scheduler.ts
import { db } from "@/lib/db";
import { smsQueueTable, warningsTable } from "@/lib/schema";
import { and, eq, lte, sql, inArray } from "drizzle-orm";
import { sendBulkSms as gatewaySendSms } from "@/actions/sendSms";


const SENDER = process.env.REPLY_SENDER!;
const MAX_BATCH = 1000;          // recipients per GatewayAPI call
const MAX_ATTEMPTS = 5;          // retry limit
const BACKOFF_MINUTES = [1, 5, 15, 30, 60]; // backoff per attempt idx

type QueueRow = {
  id: number;
  warningId: string;
  userId: number;
  phone: string;
  language: string;
  message: string;
  scheduledAt: Date;
  attempts: number;
};

function groupByMessageAndLang(rows: QueueRow[]) {
  const map = new Map<string, QueueRow[]>();
  for (const r of rows) {
    const key = `${r.language}::${r.message}`;
    (map.get(key) ?? map.set(key, []).get(key)!).push(r);
  }
  return map;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

async function fetchDueJobs(limit = 5000): Promise<QueueRow[]> {
  const now = new Date();
  const rows = await db
    .select({
      id: smsQueueTable.id,
      warningId: smsQueueTable.warningId,
      userId: smsQueueTable.userId,
      phone: smsQueueTable.phone,
      language: smsQueueTable.language,
      message: smsQueueTable.message,
      scheduledAt: smsQueueTable.scheduledAt,
      attempts: smsQueueTable.attempts,
    })
    .from(smsQueueTable)
    .where(and(
      eq(smsQueueTable.status, "pending"),
      lte(smsQueueTable.scheduledAt, now)
    ))
    .limit(limit);

  return rows;
}

async function markSent(ids: number[]) {
  const now = new Date();
  await db.update(smsQueueTable)
    .set({ status: "sent", sentAt: now, lastError: null })
    .where(inArray(smsQueueTable.id, ids));
}

async function markError(rows: QueueRow[], err: unknown) {
  const e = (err instanceof Error) ? err.message : String(err);
  for (const r of rows) {
    const nextAttempts = r.attempts + 1;
    let updates: any = { attempts: nextAttempts, lastError: e };

    if (nextAttempts >= MAX_ATTEMPTS) {
      updates.status = "error";
    } else {
      // schedule next try with backoff
      const minutes = BACKOFF_MINUTES[Math.min(nextAttempts - 1, BACKOFF_MINUTES.length - 1)];
      const next = new Date(Date.now() + minutes * 60 * 1000);
      updates.scheduledAt = next;
    }

    await db.update(smsQueueTable)
      .set(updates)
      .where(eq(smsQueueTable.id, r.id));
  }
}

async function processQueueOnce() {
  const due = await fetchDueJobs();
  if (due.length === 0) {
    console.log("[Scheduler] No due jobs.");
    return;
  }

  // Filter out jobs where warning already expired or is cancelled
  const warningIds = Array.from(new Set(due.map(d => d.warningId)));
  const warnings = await db.select().from(warningsTable).where(inArray(warningsTable.id, warningIds));
  const valid = new Set(
    warnings
      .filter(w => w.status === "active" && w.expiresAt > new Date())
      .map(w => w.id)
  );
  const filtered = due.filter(d => valid.has(d.warningId));
  const cancelledOrExpired = due.filter(d => !valid.has(d.warningId));

  if (cancelledOrExpired.length > 0) {
    await db.update(smsQueueTable)
      .set({ status: "cancelled", lastError: "Warning cancelled/expired" })
      .where(inArray(smsQueueTable.id, cancelledOrExpired.map(r => r.id)));
  }

  if (filtered.length === 0) {
    console.log("[Scheduler] Nothing to send after filtering expired/cancelled.");
    return;
  }

  // Group by (language + exact message) for bulk sends
  const grouped = groupByMessageAndLang(filtered);

  for (const [key, rows] of grouped.entries()) {
    // Chunk recipients for GatewayAPI
    const chunks = chunk(rows, MAX_BATCH);
    for (const rowsChunk of chunks) {
      const recipients = rowsChunk.map(r => ({ msisdn: r.phone }));
      const sample = rowsChunk[0];
      try {
        const res = await gatewaySendSms({
          sender: SENDER,
          message: sample.message,
          recipients,
        });
        
        // GatewayAPI returns { ids: [messageId1, messageId2, ...], usage: {...} }
        /* 
        if (!res?.ids || res.ids.length === 0) {
          throw new Error("No message IDs returned from GatewayAPI");
        }
        */
        // Map returned IDs to each recipient row
       // const msgId = res.ids[0];
        
        for (const r of rowsChunk) {
          await db.update(smsQueueTable)
            .set({
              status: "sent",
              sentAt: new Date(),
              lastError: null,
              gatewayMessageId: null // GatewayAPI ID. Will be implemented later on
            })
            .where(eq(smsQueueTable.id, r.id));
        }
        
        console.log(`[Scheduler] Sent ${rowsChunk.length} SMS for ${key}`);
        
      } catch (err) {
        console.error("[Scheduler] Gateway send failed:", err);
        await markError(rowsChunk, err);
      }
    }
  }
}

console.log("[Scheduler] Running SMS scheduler minute task...");
setInterval(processQueueOnce, 60 * 1000);

// Optional: run immediately on startup
processQueueOnce();
