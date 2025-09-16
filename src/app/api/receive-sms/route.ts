import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { and, eq, sql } from "drizzle-orm";
import { usersTable, smsLogsTable, smsQueueTable } from "@/lib/schema";
import { sendBulkSms } from "@/actions/sendSms";

const JOIN_KEYWORDS = ["JOIN", "LIITY", "DELTA"];
const LANGUAGE_MAP: Record<string, string> = {
  JOIN: "en",
  LIITY: "fi",
  DELTA: "sv",
};

const CONFIRMATION_MESSAGES: Record<string, (area: string, hour: string) => string> = {
  en: (area, hour) => `Thank you for joining - you will now receive slippery warnings for ${area} at ${hour}!`,
  fi: (area, hour) => `Kiitos liittymisestä - saat nyt liukkausvaroituksia alueelle ${area} klo ${hour}!`,
  sv: (area, hour) => `Tack för att du anslöt - du kommer nu få varningar för hala vägar för ${area} kl ${hour}!`,
};

const IMMEDIATE_CONFIRMATION_MESSAGES: Record<string, (area: string) => string> = {
  en: (area) => `Thank you for joining - you will now receive warnings for ${area}!`,
  fi: (area) => `Kiitos liittymisestä - saat nyt varoitukset alueelle ${area}!`,
  sv: (area) => `Tack för att du anslöt - du kommer nu få varningar för ${area}!`,
};

const STOP_CONFIRM_MESSAGES: Record<string, string> = {
  fi: "Olet poistettu palvelusta. Et saa enää varoitusviestejä.",
  en: "You have been unsubscribed. You will no longer receive warnings.",
  sv: "Du har avregistrerats. Du kommer inte längre att få varningar.",
};

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    try {
      body = await req.json();
    } catch {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    }

    console.log("Received SMS payload:", body);

    const from = body.from ?? body.msisdn ?? "unknown";
    const message = (body.message ?? body.text ?? "").toString();

    const parts = message.trim().split(/\s+/);
    let status: string = "ignored";
    let error: string | null = null;

    const keyword = (parts[0] ?? "").toUpperCase();
    const defaultLanguage = LANGUAGE_MAP[keyword] ?? "fi";

    // STOP: unsubscribe user & cancel queued jobs
    if (keyword === "STOP") {
      try {
        const existing = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.phone, from))
          .limit(1);

        if (existing.length > 0) {
          const user = existing[0];
          const lang = (user.language || "fi").toLowerCase();

          // 1) delete user
          await db.delete(usersTable).where(eq(usersTable.phone, from));

          // 2) cancel any unsent / queued jobs for this user (pending/sending and not yet sent)
          await db
            .update(smsQueueTable)
            .set({
              status: "cancelled",
              lastError: "Unsubscribed via STOP",
            })
            .where(
              and(
                eq(smsQueueTable.userId, user.id),
                // cancel anything not definitively sent
                sql`${smsQueueTable.status} IN ('pending', 'sending') OR ${smsQueueTable.sentAt} IS NULL`
              )
            );

          // 3) confirmation SMS
          await sendBulkSms({
            sender: process.env.REPLY_SENDER!,
            message: STOP_CONFIRM_MESSAGES[lang] ?? STOP_CONFIRM_MESSAGES.fi,
            recipients: [{ msisdn: from }],
          });

          status = "unsubscribed";
        } else {
          return;
        }
      } catch (err: any) {
        console.error("Error processing STOP:", err);
        status = "error";
        error = err?.message ?? "Unknown error";
      }

      // log and return
      await db.insert(smsLogsTable).values({
        phone: from,
        message,
        status,
        error,
      });
      return NextResponse.json({ status });
    }

    // JOIN / LIITY / DELTA 
    const language = defaultLanguage;
    if (JOIN_KEYWORDS.includes(keyword)) {
      const area = parts[1] ?? "Unknown";

      // optional hour
      let hour: string | null = null;
      if (parts[2]) {
        const h = parseInt(parts[2], 10);
        if (!isNaN(h) && h >= 0 && h <= 23) {
          hour = (h < 10 ? "0" : "") + h + ":00";
        }
      }

      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.phone, from))
        .limit(1);

      if (existingUser.length > 0) {
        status = "already_registered";
      } else {
        try {
          await db
            .insert(usersTable)
            .values({
              phone: from,
              area,
              hour,
              language,
            })
            .onConflictDoNothing();

          const smsText = hour
            ? CONFIRMATION_MESSAGES[language](area, hour)
            : IMMEDIATE_CONFIRMATION_MESSAGES[language](area);

          await sendBulkSms({
            sender: process.env.REPLY_SENDER!,
            message: smsText,
            recipients: [{ msisdn: from }],
          });

          status = "registered";
        } catch (err: any) {
          console.error("Error handling JOIN:", err);
          status = "error";
          error = err?.message ?? "Unknown error";
        }
      }
    }

    // log all messages
    await db.insert(smsLogsTable).values({
      phone: from,
      message,
      status,
      error,
    });

    return NextResponse.json({ status, receivedPayload: body });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Server error", details: err?.message },
      { status: 500 }
    );
  }
}
