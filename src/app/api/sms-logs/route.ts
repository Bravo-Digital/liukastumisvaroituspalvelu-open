import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { smsLogsTable } from "@/lib/schema";
import { desc } from "drizzle-orm"; 

export async function GET() {
  try {
    // Get the 50 most recent SMS logs
    const logs = await db
      .select()
      .from(smsLogsTable)
      .orderBy(desc(smsLogsTable.receivedAt)) 
      .limit(50);

    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("Error fetching SMS logs:", err);
    return NextResponse.json(
      { error: "Failed to fetch SMS logs", details: err?.message },
      { status: 500 }
    );
  }
}
