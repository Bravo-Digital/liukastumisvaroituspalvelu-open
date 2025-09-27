// src/actions/winterStats.ts
"use server";

import { db } from "@/lib/db";
import { usersTable, warningsTable } from "@/lib/schema";
import { count, sql, and } from "drizzle-orm";

export type WinterStats = { users: number; warnings: number };


function winterWindowLocalStrings(year: number) {

  const start = `${year}-10-01 00:00:00`;
  const end = `${year + 1}-04-30 23:59:59.999`;
  return { start, end };
}

export async function getWinterStats(year: number): Promise<WinterStats> {
  const { start, end } = winterWindowLocalStrings(year);

  // WARNINGS: count by onset/effective time inside the winter window
  const [wRow] = await db
    .select({ warnings: count() })
    .from(warningsTable)
    .where(
      and(
        sql`${warningsTable.onsetAt} >= ${start}::timestamp`,
        sql`${warningsTable.onsetAt} <= ${end}::timestamp`
      )
    );

  // USERS: everyone who joined on/before the end of the window
  const [uRow] = await db
    .select({ users: count() })
    .from(usersTable)
    .where(sql`${usersTable.joinDate} <= ${end}::timestamp`);

  return {
    warnings: Number(wRow?.warnings ?? 0),
    users: Number(uRow?.users ?? 0),
  };
}
