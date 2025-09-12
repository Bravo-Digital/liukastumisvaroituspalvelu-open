import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { usersTable, warningsTable } from "@/lib/schema"
import { lte, gte, and } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear()

  const startDate = new Date(`${year}-10-01`)
  const endDate = new Date(`${year + 1}-04-30`)

  // Users joined on or before the end of winter
  const users = await db
    .select()
    .from(usersTable)
    .where(lte(usersTable.joinDate, endDate))

  // Warnings created during the winter period
  const warnings = await db
    .select()
    .from(warningsTable)
    .where(
      and(
        gte(warningsTable.createdAt, startDate),
        lte(warningsTable.createdAt, endDate)
      )
    )

  return NextResponse.json({
    users: users.length,
    warnings: warnings.length,
  })
}
