// src/app/(protected)/admin/report/route.ts
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { usersTable, warningsTable, smsQueueTable, feedbackTable } from "@/lib/schema";
import { and, count, eq, gte, lte, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseRange(search: URLSearchParams) {
  const fromStr = search.get("from");
  const toStr = search.get("to");

  const now = new Date();
  const defFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const from = fromStr ? new Date(`${fromStr}T00:00:00`) : defFrom;
  const to = toStr ? new Date(`${toStr}T23:59:59.999`) : now;

  return {
    from,
    to,
    fromStr: fromStr ?? from.toISOString().slice(0, 10),
    toStr: toStr ?? to.toISOString().slice(0, 10),
  };
}

// CSV helpers
function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function pushRow(lines: string[], cols: (string | number | boolean | null | undefined)[]) {
  lines.push(cols.map(csvEscape).join(","));
}

export async function GET(req: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const { from, to, fromStr, toStr } = parseRange(searchParams);

  // Summary metrics 
  const [[{ totalUsers }], [{ newUsers }], [{ warnings }], [{ smsSent }]] = await Promise.all([
    db.select({ totalUsers: count() }).from(usersTable),
    db.select({ newUsers: count() }).from(usersTable).where(and(gte(usersTable.joinDate, from), lte(usersTable.joinDate, to))),
    db.select({ warnings: count() }).from(warningsTable).where(and(gte(warningsTable.onsetAt, from), lte(warningsTable.onsetAt, to))),
    db
      .select({ smsSent: count() })
      .from(smsQueueTable)
      .where(and(eq(smsQueueTable.status, "sent"), gte(smsQueueTable.sentAt, from), lte(smsQueueTable.sentAt, to))),
  ]);

  // Feedback rows within range
  const feedbackRows = await db
    .select({
      id: feedbackTable.id,
      createdAt: feedbackTable.createdAt,
      name: feedbackTable.name,
      email: feedbackTable.email,
      category: feedbackTable.category,
      subject: feedbackTable.subject,
      message: feedbackTable.message,
      status: feedbackTable.status,
    })
    .from(feedbackTable)
    .where(and(gte(feedbackTable.createdAt, from), lte(feedbackTable.createdAt, to)))
    .orderBy(desc(feedbackTable.createdAt));

  // Simple breakdown by category
  const feedbackByCategory: Record<string, number> = {};
  for (const r of feedbackRows) {
    const key = r.category || "uncategorized";
    feedbackByCategory[key] = (feedbackByCategory[key] || 0) + 1;
  }

  const lines: string[] = [];

  // Header: range
  pushRow(lines, ["From", from.toISOString()]);
  pushRow(lines, ["To", to.toISOString()]);
  lines.push("");

  // Summary block
  pushRow(lines, ["Metric", "Value"]);
  pushRow(lines, ["Total users (all time)", Number(totalUsers)]);
  pushRow(lines, ["New users (range)", Number(newUsers)]);
  pushRow(lines, ["Warnings (range)", Number(warnings)]);
  pushRow(lines, ["SMS sent (range)", Number(smsSent)]);
  pushRow(lines, ["Feedback (range)", feedbackRows.length]);
  // Category breakdown
  for (const [cat, n] of Object.entries(feedbackByCategory)) {
    pushRow(lines, [`Feedback – ${cat}`, n]);
  }

  // Spacer
  lines.push("");
  lines.push("");

  // Feedback details table
  pushRow(lines, [
    "Feedback ID",
    "Created At",
    "Name",
    "Email",
    "Category",
    "Subject",
    "Message",
    "Status",
  ]);

  for (const r of feedbackRows) {
    pushRow(lines, [
      r.id,
      r.createdAt?.toISOString?.() ?? "",
      r.name ?? "",
      r.email ?? "",
      r.category ?? "",
      r.subject ?? "",
      r.message ?? "",
      r.status ?? "",
    ]);
  }

  const csv = lines.join("\n");
  const filename = `liukasbotti_report_${fromStr}_to_${toStr}.csv`;

  // Add BOM so Excel opens UTF-8 nicely
  const body = "\uFEFF" + csv;

  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
