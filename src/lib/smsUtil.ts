import { DateTime } from "luxon";

const HELSINKI_TZ = "Europe/Helsinki";

export function isImmediateHour(hour: string | null | undefined) {
  return !hour || hour.trim() === "";
}

export function nextRunAtForHour(hour: string, now = new Date()): Date {
  const [h, m] = hour.split(":").map(Number);

  // Interpret "now" in Helsinki timezone
  const baseLocal = DateTime.fromJSDate(now, { zone: HELSINKI_TZ });

  // Build today's date at requested hour in Helsinki local time
  let dt = baseLocal.set({ hour: h, minute: m, second: 0, millisecond: 0 });

  // If time already passed, push to tomorrow
  if (dt <= baseLocal) {
    dt = dt.plus({ days: 1 });
  }

  // Convert back to UTC Date for DB storage
  return dt.toUTC().toJSDate();
}

export function formatStampForMessage(now = new Date()): string {
    return DateTime.fromJSDate(now, { zone: HELSINKI_TZ })
      .toFormat("dd.MM.yyyy HH:mm");
  }
  

export function baseMessageByLang(lang: string, stamp = formatStampForMessage()) {
  const msgs: Record<string, string> = {
    fi: `[${stamp}] Varoitus: Ulkona on erittäin liukasta. Ole varovainen liikkuessasi ulkona.`,
    en: `[${stamp}] Warning: Pedestrian conditions are very slippery. Please be careful when walking outside.`,
    sv: `[${stamp}] Varning: Fotgängarvädret är mycket halt. Var försiktig när du är utomhus.`,
  };
  return msgs[lang] ?? msgs.fi;
}
