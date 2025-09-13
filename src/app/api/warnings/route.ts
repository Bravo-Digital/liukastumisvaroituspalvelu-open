import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { warningsTable } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

    // Fetch all warnings from warningsTable only
    const allWarnings = await db
      .select()
      .from(warningsTable)
      .orderBy(desc(warningsTable.createdAt));

    // Map to unique warnings
    const warningsMap = new Map<string, { id: string; date: string; time: string; area: string }>();

    allWarnings.forEach((warning) => {
      if (!warningsMap.has(warning.id)) {
        const dateObj = new Date(warning.onsetAt);
        const date = `${dateObj.getDate().toString().padStart(2, "0")}.${(dateObj.getMonth() + 1)
          .toString()
          .padStart(2, "0")}.${dateObj.getFullYear()}`;
        const time = `${dateObj.getHours().toString().padStart(2, "0")}:${dateObj
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;

        warningsMap.set(warning.id, {
          id: warning.id,
          date,
          time,
          area: warning.area || "",
        });
      }
    });

    const allUniqueWarnings = Array.from(warningsMap.values());
    const paginatedWarnings = allUniqueWarnings.slice(offset, offset + limit);

    return NextResponse.json({
      warnings: paginatedWarnings,
      pagination: {
        total: allUniqueWarnings.length,
        limit,
        offset,
        hasMore: offset + limit < allUniqueWarnings.length,
      },
    });
  } catch (error) {
    console.error("Error fetching warnings:", error);
    return NextResponse.json({ error: "Failed to fetch warnings" }, { status: 500 });
  }
}
