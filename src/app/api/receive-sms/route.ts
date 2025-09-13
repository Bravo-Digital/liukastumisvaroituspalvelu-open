import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { usersTable, smsLogsTable } from "@/lib/schema";
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
    const message = body.message ?? body.text ?? "";

    const parts = message.trim().split(/\s+/);
    let status: string = "ignored";
    let error: string | null = null;

    const keyword = parts[0].toUpperCase();
    const language = LANGUAGE_MAP[keyword] ?? "fi";

    if (JOIN_KEYWORDS.includes(keyword)) {
      const area = parts[1] ?? "Unknown";

        // Use the specified hour if provided, otherwise leave blank (immediate)
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
          await db.insert(usersTable).values({
            phone: from,
            area: area,
            hour: hour,
            language: language,
          }).onConflictDoNothing();

      // Use different confirmation message if hour is blank
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
          console.error("Error handling SMS:", err);
          status = "error";
          error = err?.message ?? "Unknown error";
        }
      }
    }

    await db.insert(smsLogsTable).values({
      phone: from,
      message: message,
      status: status,
      error: error,
    });

    return NextResponse.json({ status, receivedPayload: body });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Server error", details: err?.message }, { status: 500 });
  }
}
