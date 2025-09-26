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

/**
 * Parse a user-supplied time into a 24h HOUR string without leading zero ("0".."23").
 * Handles numbers, AM/PM, 08:00/0800, number words (EN/FI/SV), and broad time-of-day words (EN/FI/SV).
 */
function parseUserHour(raw: string | undefined | null): string | null {
  if (!raw) return null;

  const stripDiacritics = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // normalize
  let s = stripDiacritics(raw.toString().trim().toLowerCase())
    .replace(/\b(at|klo|kl|o'?clock)\b/g, " ") // fillers
    .replace(/\s+/g, " ")
    .trim();

  // normalize a.m./p.m. -> am/pm
  s = s.replace(/\b(a\.?\s*m\.?|p\.?\s*m\.?)\b/g, (m) =>
    m.toLowerCase().includes("a") ? "am" : "pm"
  );

  const toHour = (h: number) => (h >= 0 && h <= 23 ? String(h) : null);

  // --- time-of-day keywords (EN / FI / SV) ---
  // Order matters: specific before general
  const keywordRules: Array<{ re: RegExp; hour: number }> = [
    // Midnight / noon first
    { re: /\b(midnight|keskiyo|puoliyo|midnatt)\b/, hour: 0 },
    { re: /\b(noon|midday|keskipaiva|lounas(?:aika)?|middag|lunch(?:time|tid)?)\b/, hour: 12 },

    // Dawn / dusk
    { re: /\b(dawn|sunrise|auringonnousu|aamunkoitto|gryning)\b/, hour: 5 },
    { re: /\b(dusk|sunset|iltahamara|auringonlasku|skymning)\b/, hour: 21 },

    // Early/late variants
    { re: /\bearly\s+morning\b|\baikainen\s+aamu\b|\btidigt?\s+pa\s+morgonen\b/, hour: 6 },
    { re: /\blate\s+morning\b|\bforenoon\b|\baamupaiva(?:lla)?\b|\bformiddag(?:en)?\b/, hour: 10 },
    { re: /\blate\s+afternoon\b|\bmyohainen\s+iltapaiva\b|\bsen\s+eftermiddag\b/, hour: 16 },
    { re: /\blate\s+evening\b|\bmyohainen\s+ilta\b|\bsen\s+kvall\b/, hour: 20 },

    // General periods
    { re: /\b(morning|aamu(?:lla)?)\b|\bmorgon(?:en)?\b/, hour: 8 },
    { re: /\b(aamupaiva(?:lla)?)\b|\bforenoon\b|\bformiddag(?:en)?\b/, hour: 10 },
    { re: /\b(afternoon|iltapaiva(?:lla)?)\b|\beftermiddag(?:en)?\b/, hour: 15 },
    { re: /\b(evening|ilta(?:lla)?)\b|\bkvall(?:en)?\b/, hour: 19 },
    { re: /\b(night|yo(?:lla)?)\b|\bnatt(?:en)?\b/, hour: 22 },

    // Daytime catch-alls
    { re: /\b(daytime|paiva(?:lla)?)\b|\bdagtid\b/, hour: 10 },
  ];

  for (const { re, hour } of keywordRules) {
    if (re.test(s)) return toHour(hour);
  }

  // --- numeric/format parsing ---

  // 12-hour with am/pm ("7am", "7:30 pm", "11.00pm")
  {
    const m = s.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\b/);
    if (m) {
      let h = parseInt(m[1], 10);
      const minutes = m[2] ? parseInt(m[2], 10) : 0;
      const mer = m[3];
      if (h >= 1 && h <= 12 && minutes >= 0 && minutes <= 59) {
        if (mer === "am") h = h === 12 ? 0 : h;
        else h = h === 12 ? 12 : h + 12;
        return toHour(h);
      }
      return null;
    }
  }

  // Compact HHMM / HMM (e.g., "0800", "730", "1800")
  {
    const m = s.match(/\b(\d{3,4})\b/);
    if (m) {
      const num = m[1];
      if (num.length === 4) {
        const h = parseInt(num.slice(0, 2), 10);
        const minutes = parseInt(num.slice(2, 4), 10);
        if (minutes >= 0 && minutes <= 59) return toHour(h);
      } else {
        const h = parseInt(num.slice(0, 1), 10);
        const minutes = parseInt(num.slice(1, 3), 10);
        if (minutes >= 0 && minutes <= 59) return toHour(h);
      }
    }
  }

  // HH:MM or HH.MM
  {
    const m = s.match(/\b(\d{1,2})[:.](\d{2})\b/);
    if (m) {
      const h = parseInt(m[1], 10);
      const minutes = parseInt(m[2], 10);
      if (minutes >= 0 && minutes <= 59) return toHour(h);
    }
  }

  // Bare hour (0..23)
  {
    const m = s.match(/\b([01]?\d|2[0-3])\b/);
    if (m) return toHour(parseInt(m[1], 10));
  }

  // Abbrev "7a"/"7p"
  {
    const m = s.match(/\b(\d{1,2})\s*([ap])\b/);
    if (m) {
      let h = parseInt(m[1], 10);
      const mer = m[2] === "a" ? "am" : "pm";
      if (h >= 1 && h <= 12) {
        h = mer === "am" ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
        return toHour(h);
      }
    }
  }

  // Number words (EN + FI + SV basics)
  const WORDS: Record<string, number> = {
    // EN
    zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12,
    // FI (diacritics stripped: ä->a, ö->o)
    nolla:0, yksi:1, kaksi:2, kolme:3, nelja:4, viisi:5, kuusi:6, seitseman:7, kahdeksan:8, yhdeksan:9, kymmenen:10, yksitoista:11, kaksitoista:12,
    // SV
    noll:0, ett:1, tva:2, tre:3, fyra:4, fem:5, sex:6, sju:7, atta:8, nio:9, tio:10, elva:11, tolv:12,
  };
  for (const tok of s.split(/\s+/)) {
    const key = tok.replace(/[^a-z0-9]/g, "");
    if (key in WORDS) return toHour(WORDS[key]);
  }

  return null;
}

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

          // 2) cancel any unsent / queued jobs for this user
          await db
            .update(smsQueueTable)
            .set({
              status: "cancelled",
              lastError: "Unsubscribed via STOP",
            })
            .where(
              and(
                eq(smsQueueTable.userId, user.id),
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

  // 1) Parse unpadded hour ("0".."23") from the rest of the message
  const hourParsed = parseUserHour(parts.slice(2).join(" ")); // string | null

  // 2) Convert to "HH:00" for DB + SMS
  const hourForDb = hourParsed ? `${hourParsed.padStart(2, "0")}:00` : null;


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
            area,
            hour: hourForDb,      // always "HH:00" ("00:00", "08:00", "19:00")
            language,
          }).onConflictDoNothing();

          const smsText = hourForDb
            ? CONFIRMATION_MESSAGES[language](area, hourForDb)
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
