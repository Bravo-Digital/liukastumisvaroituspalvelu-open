import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db"; 
import { and, eq } from "drizzle-orm";
import { usersTable, smsQueueTable, warningsTable, smsLogsTable } from "@/lib/schema";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";
import fs from 'node:fs';
import path from 'node:path';



export const runtime = 'nodejs';

function parseLookup(searchParams: URLSearchParams) {
  const by = searchParams.get("by") === "id" ? "id" : "phone";
  const identifier = searchParams.get("identifier");
  if (!identifier) throw new Error("Missing identifier");
  if (by === "id") {
    const id = Number(identifier);
    if (!Number.isInteger(id)) throw new Error("Invalid user id");
    return { mode: "id" as const, id };
  }
  return { mode: "phone" as const, phone: identifier };
}

async function getUserBundle(by: "id" | "phone", identifier: number | string) {
  const user = by === "id"
    ? (await db.select().from(usersTable).where(eq(usersTable.id, identifier as number)).limit(1))[0]
    : (await db.select().from(usersTable).where(eq(usersTable.phone, identifier as string)).limit(1))[0];

  if (!user) return null;

  const deliveries = await db
    .select({
      queueId: smsQueueTable.id,
      warningId: smsQueueTable.warningId,
      scheduledAt: smsQueueTable.scheduledAt,
      sentAt: smsQueueTable.sentAt,
      status: smsQueueTable.status,
      attempts: smsQueueTable.attempts,
      gatewayMessageId: smsQueueTable.gatewayMessageId,
      lastError: smsQueueTable.lastError,
      warning_area: warningsTable.area,
      warning_status: warningsTable.status,
      warning_onsetAt: warningsTable.onsetAt,
      warning_expiresAt: warningsTable.expiresAt,
    })
    .from(smsQueueTable)
    .leftJoin(warningsTable, eq(smsQueueTable.warningId, warningsTable.id))
    .where(eq(smsQueueTable.userId, user.id));

  const smsLogs = await db
    .select({
      id: smsLogsTable.id,
      phone: smsLogsTable.phone,
      message: smsLogsTable.message,
      receivedAt: smsLogsTable.receivedAt,
      status: smsLogsTable.status,
      error: smsLogsTable.error,
    })
    .from(smsLogsTable)
    .where(eq(smsLogsTable.phone, user.phone));

  return { user, deliveries, smsLogs } as const;
}

function toJSON(bundle: Awaited<ReturnType<typeof getUserBundle>>) {
  if (!bundle) return null;
  const { user, deliveries, smsLogs } = bundle;
  return {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      phone: user.phone,
      area: user.area,
      joinDate: user.joinDate,
      hour: user.hour,
      language: user.language,
    },
    smsDeliveries: deliveries,
    smsLogs,
  };
}

async function toPDFBuffer(bundle: NonNullable<Awaited<ReturnType<typeof getUserBundle>>>) {

    const doc = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: false });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));

    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf');
    const fontBuf = fs.readFileSync(fontPath);
    doc.registerFont('Body', fontBuf);
    doc.font('Body');
  
    doc.addPage();
  
    // Header
    doc.fontSize(18).text('Liukasbotti GDPR Data Export / Yleisen tietosuoja-asetuksen mukainen vienti / GDPR-dataexport', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Exported: ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown();
  

  // User section
  const { user, deliveries, smsLogs } = bundle;
  doc.fontSize(14).text("User Profile / Käyttäjän profiili / Användarprofil", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12)
    .text(`ID: ${user.id}`)
    .text(`Phone/Puhelin/Telefon: ${user.phone}`)
    .text(`Area/Alue/Område: ${user.area}`)
    .text(`Join date/Liittymispv/Anslutningsdatum: ${user.joinDate}`)
    .text(`Hour/Tunti/Timme: ${user.hour ?? "—"}`)
    .text(`Language/Kieli/Språk: ${user.language}`);

  // Deliveries
  doc.moveDown();
  doc.fontSize(14).text("SMS Deliveries / Queue // Tekstiviestien toimitukset / Jono // SMS-leveranser / Kö", { underline: true });
  doc.moveDown(0.5);
  if (deliveries.length === 0) {
    doc.fontSize(12).text("No deliveries.");
  } else {
    deliveries.forEach((d, i) => {
      doc.fontSize(12)
        .text(`#${i + 1}`)
        .text(`  queueId: ${d.queueId}`)
        .text(`  warningId: ${d.warningId}`)
        .text(`  scheduledAt: ${d.scheduledAt}`)
        .text(`  sentAt: ${d.sentAt ?? "—"}`)
        .text(`  status: ${d.status}`)
        .text(`  attempts: ${d.attempts}`)
        .text(`  gatewayMessageId: ${d.gatewayMessageId ?? "—"}`)
        .text(`  lastError: ${d.lastError ?? "—"}`)
        .text(`  warning.area: ${d.warning_area}`)
        .text(`  warning.status: ${d.warning_status}`)
        .text(`  warning.onsetAt: ${d.warning_onsetAt}`)
        .text(`  warning.expiresAt: ${d.warning_expiresAt}`)
        .moveDown(0.5);
    });
  }

  // SMS Logs
  doc.moveDown();
  doc.fontSize(14).text("SMS Logs / SMS-lokit / SMS-loggar", { underline: true });
  doc.moveDown(0.5);
  if (smsLogs.length === 0) {
    doc.fontSize(12).text("No logs.");
  } else {
    smsLogs.forEach((l, i) => {
      doc.fontSize(12)
        .text(`#${i + 1}`)
        .text(`  id: ${l.id}`)
        .text(`  message: ${l.message}`)
        .text(`  receivedAt: ${l.receivedAt}`)
        .text(`  status: ${l.status}`)
        .text(`  error: ${l.error ?? "—"}`)
        .moveDown(0.5);
    });
  }

  doc.end();
  return await new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));
}

export async function GET(req: Request) {
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const lookup = parseLookup(searchParams);
  const format = (searchParams.get("format") || "pdf").toLowerCase();

  const bundle = await getUserBundle(
    lookup.mode,
    lookup.mode === "id" ? lookup.id : lookup.phone
  );

  if (!bundle) {
    return new NextResponse("User not found", { status: 404 });
  }

  if (format === "json") {
    const payload = toJSON(bundle)!;
    return NextResponse.json(payload, {
      headers: {
        "Content-Disposition": `attachment; filename=gdpr-user-${bundle.user.id}.json` ,
      },
    });
  }

  // default PDF
  const pdf = await toPDFBuffer(bundle);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=gdpr-user-${bundle.user.id}.pdf` ,
      "Cache-Control": "no-store",
    },
  });
}