// THIS FILE fetches the warnings from Ilmatieteen laitos. If warnings are found, SMS is sent accordingly 
import { XMLParser } from "fast-xml-parser";
import Parser from "rss-parser";
import { usersTable, smsQueueTable } from "@/lib/schema";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { warningsTable } from "@/lib/schema";
import { isImmediateHour, nextRunAtForHour, baseMessageByLang } from "@/lib/smsUtil";


interface Area {
  areaDesc: string;
}

interface InfoBlock {
  language: string;
  status: string;
  event: string;
  onset: string;
  expires: string;
  headline: string;
  description: string;
  area: Area | Area[];
}

interface Info {
  lang: string;
  event: string;
  onset: string;
  expires: string;
  headline: string;
  description: string;
  areaDesc: string[];
}
const areaMap: Record<string, string> = {
  "southern finland": "uusimaa",
  "the southern part of the country": "uusimaa",
  "helsinki": "uusimaa",
  "uusimaa": "uusimaa",
  "whole country": "uusimaa",
  "all of finland": "uusimaa",
};

function normalizeArea(desc: string): string {
  const d = desc.toLowerCase();
  for (const key in areaMap) {
    if (d.includes(key)) return areaMap[key];
  }
  return d;
}

function safeOnset(str?: string): Date {
  if (!str) return new Date();
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

function sevenDaysLater(base: Date): Date {
  return new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
}
// const FEED_URL = 'https://vbxa.github.io/liukasbotti-test-rss/testWarnings.rss'
const FEED_URL = 'https://alerts.fmi.fi/cap/feed/rss_en-GB.rss';

let modified: string | null = null;

const areasToCheck = ["Uusimaa"];

async function enqueueJobsForWarning(
  warningId: string,
  onsetAt: Date,
  expiresAt: Date,
  details: Array<{ lang: string; areaDesc: string[] }>
) {
  // Fetch users once, then filter by area & language and schedule
  const users = await db.select().from(usersTable);
  if (users.length === 0) return;

  const HELSINKI_TZ = "Europe/Helsinki";
  const now = new Date();

  // Pre-index detail areas by language prefix (fi/en/sv)
  type DetailByLang = Record<string, Set<string>>;
  const areasByLang: DetailByLang = {};
  for (const d of details) {
    const key = d.lang.slice(0,2).toLowerCase();
    const set = (areasByLang[key] ??= new Set<string>());
    for (const area of d.areaDesc) set.add(normalizeArea(area));
  }
  
  // Helper: does user's area appear in the warning detail areas (by lang fallback)?
  function userAreaMatches(userArea: string, lang: string) {
    const key = lang.slice(0,2).toLowerCase();
    const set = areasByLang[key] ?? areasByLang["fi"] ?? areasByLang["en"] ?? new Set<string>();
  
    let ua = userArea.toLowerCase();
  
    // Map Helsinki as part of Uusimaa
    if (ua === "helsinki") ua = "uusimaa";
  
    for (const a of set) {
      if (a.includes(ua) || ua.includes(a)) return true;
    }
    return false;
  }

  // Prepare rows; use ON CONFLICT (user_id, warning_id) DO NOTHING for idempotency
  const rowsToInsert: {
    warningId: string;
    userId: number;
    phone: string;
    language: string;
    message: string;
    scheduledAt: Date;
  }[] = [];

  for (const u of users) {
    // Area filter: only queue for matching users
    if (!userAreaMatches(u.area, u.language)) continue;

    // Determine scheduled time
    let scheduledAt: Date;
    if (isImmediateHour(u.hour)) {
      scheduledAt = now; // immediate
    } else {
      scheduledAt = nextRunAtForHour(u.hour!, now);
    }
    // Clamp to warning window [onsetAt, expiresAt]
    if (scheduledAt < onsetAt) scheduledAt = onsetAt;
    if (scheduledAt > expiresAt) continue; // would be after expiry -> skip

    // Compose message text now (lets us group identical messages later)
    const msg = baseMessageByLang(u.language);

    rowsToInsert.push({
      warningId,
      userId: u.id,
      phone: u.phone,
      language: u.language,
      message: msg,
      scheduledAt,
    });
  }

  // Bulk insert in chunks with ON CONFLICT DO NOTHING
  const CHUNK = 1000;
  for (let i = 0; i < rowsToInsert.length; i += CHUNK) {
    const slice = rowsToInsert.slice(i, i + CHUNK);
    if (slice.length === 0) continue;
    await db.insert(smsQueueTable)
      .values(slice)
      // drizzle way to do ON CONFLICT (user_id, warning_id)
      .onConflictDoNothing({ target: [smsQueueTable.userId, smsQueueTable.warningId] });
  }

  console.log(`[Index] Enqueued ${rowsToInsert.length} SMS jobs for warning ${warningId}`);
}


async function checkWarnings() {
  try {
    const headResponse = await fetch(FEED_URL, { method: 'HEAD' });
    const lastModified = headResponse.headers.get('last-modified');
    if (modified === lastModified) return; 
    modified = lastModified;

    const parser = new Parser();
    const feed = await parser.parseURL(FEED_URL);

    const warnings = [];

    for (const item of feed.items) {
      console.log("TITLE:", item.title);

      const isPedestrianSlippery = /pedestrian/i.test(String(item.title)) || /slippery/i.test(String(item.title));
      const matchesTargetArea = /uusimaa|southern|whole/i.test(String(item.title));
      console.log("MATCHES TARGET AREA?", matchesTargetArea);

      if (isPedestrianSlippery && matchesTargetArea && item.link) {
        const capResponse = await fetch(item.link);
        const capText = await capResponse.text();

        const xmlParser = new XMLParser({ 
          ignoreAttributes: false,
          removeNSPrefix: true });
        const cap = xmlParser.parse(capText);
        const alert = cap.alert;


        console.log("CAP parsed identifier:", alert.identifier);
        console.log("CAP areaDesc:", alert.info?.area?.areaDesc);
        console.log("CAP expires:", alert.expires);

        if (!matchesTargetArea) {
          console.log("Skipped because target area did not match");
        }
        if (!isPedestrianSlippery) {
          console.log("Skipped because not pedestrian slippery");
        }

        if (!alert || !alert.identifier) {
          console.warn('[checkWarnings] Skipping CAP item, no alert or identifier', capText);
          continue;
        }

        const identifier = alert.identifier;
        const type = alert.msgType;

        const infoList = Array.isArray(alert.info) ? alert.info : [alert.info];

        const info: Info[] = infoList.map((infoBlock: InfoBlock): Info => {
          const areaDescs: string[] = Array.isArray(infoBlock.area)
            ? infoBlock.area.map((a: Area) => a.areaDesc)
            : [infoBlock.area?.areaDesc].filter(Boolean) as string[];

          return {
            lang: infoBlock.language,
            event: infoBlock.event,
            onset: infoBlock.onset,
            expires: infoBlock.expires,
            headline: infoBlock.headline,
            description: infoBlock.description,
            areaDesc: areaDescs,
          };
        });

        const relevantInfo = info.filter(block =>
          block.areaDesc.some(desc => {
            const normalized = normalizeArea(desc);
            const matches = areasToCheck.some(target =>
              normalized.includes(target.toLowerCase())
            );
            if (!matches) {
              console.log(
                `[Debug] Skipped area '${desc}' normalized to '${normalized}' — does not match target areas`
              );
            }
            return matches;
          })
        );

        if (relevantInfo.length === 0) continue;

        warnings.push({ identifier, type, info: relevantInfo });
      }
    }

    if (warnings.length > 0) {
      for (const warning of warnings) {
        const existing = await db
          .select()
          .from(warningsTable)
          .where(eq(warningsTable.id, warning.identifier));

        if (warning.type === 'Cancel') {
          if (existing.length > 0) {
            console.log(`[Index] Cancelling existing warning: ${warning.identifier}`);
            await db.update(warningsTable)
              .set({ status: 'cancelled' })
              .where(eq(warningsTable.id, warning.identifier));
          } else {
            console.log(`[Index] Cancel received but warning not found: ${warning.identifier}`);
          }
          continue;
        }

        if (existing.length === 0) {
          // Check if there is any active warning that hasn't expired
          const activeWarnings = await db
            .select()
            .from(warningsTable)
            .where(sql`${warningsTable.expiresAt} > now()`);
        
          if (activeWarnings.length > 0) {
            console.log(`[Index] Skipping new warning ${warning.identifier} because an active warning exists`);
            continue; 
          }
        
          console.log(`[Index] Inserting new warning: ${warning.identifier}`);
          const createdAt = new Date();
          const onsetAt = safeOnset(warning.info[0].onset);
          const expiresAt = sevenDaysLater(createdAt);
        
          await db.insert(warningsTable).values({
            id: warning.identifier,
            area: "Helsinki",
            status: "active",
            createdAt,
            onsetAt,
            expiresAt,
          });
        
          for (const detail of warning.info) {        
            await enqueueJobsForWarning(
              warning.identifier,
              onsetAt,
              expiresAt,
              [detail]
            );
          }
        }
        
        
        else if (warning.type === "Update") {
          console.log(`[Index] Updating existing warning: ${warning.identifier}`);
          const onsetAt = safeOnset(warning.info[0].onset);
          const expiresAt = sevenDaysLater(new Date());
          
          await db.update(warningsTable)
            .set({
              area: "helsinki",
              onsetAt,
              expiresAt,
            })
            .where(eq(warningsTable.id, warning.identifier));
        }
        
        else {
          console.log(`[Index] Warning already exists and is not an update: ${warning.identifier}`);
        }
      }
    }

  } catch (error) {
    console.error('Error fetching feed:', error);
  }
}

async function startPolling() {
  await checkWarnings();

  setInterval(async () => {
    await checkWarnings();
  }, 60 * 1000);
}

startPolling();
