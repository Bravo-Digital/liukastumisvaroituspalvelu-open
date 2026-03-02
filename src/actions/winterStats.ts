// src/actions/winterStats.ts
"use server";

import { DateTime } from "luxon";
import { db } from "@/lib/db";
import { usersTable, warningsTable } from "@/lib/schema";
import { count, and, gte, lte } from "drizzle-orm";

export type WinterStats = { users: number; warnings: number };

const HELSINKI_TZ = "Europe/Helsinki";

/**
 * Winter season window is defined in Helsinki local time:
 *   start: Oct 1 00:00:00.000
 *   end:   Apr 30 23:59:59.999 (next year)
 *
 */

function winterWindowUtcDates(year: number) {
  const startLocal = DateTime.fromObject(
    { year, month: 10, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 },
    { zone: HELSINKI_TZ }
  );

  const endLocal = DateTime.fromObject(
    { year: year + 1, month: 4, day: 30, hour: 23, minute: 59, second: 59, millisecond: 999 },
    { zone: HELSINKI_TZ }
  );

  return {
    startUtc: startLocal.toUTC().toJSDate(),
    endUtc: endLocal.toUTC().toJSDate(),
  };
}

export async function getWinterStats(year: number): Promise<WinterStats> {
  const { startUtc, endUtc } = winterWindowUtcDates(year);

  // WARNINGS: count by onset/effective time inside the winter window
  const [wRow] = await db
    .select({ warnings: count() })
    .from(warningsTable)
    .where(and(gte(warningsTable.onsetAt, startUtc), lte(warningsTable.onsetAt, endUtc)));

  // USERS: everyone who joined on/before the end of the window
  const [uRow] = await db
    .select({ users: count() })
    .from(usersTable)
    .where(lte(usersTable.joinDate, endUtc));

  return {
    warnings: Number(wRow?.warnings ?? 0),
    users: Number(uRow?.users ?? 0),
  };
}