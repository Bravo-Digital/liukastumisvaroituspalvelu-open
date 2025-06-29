import { eq } from "drizzle-orm";
import { db } from "@/db/index"; // your initialized Drizzle client
import { warningsTable, warningDetailsTable } from "@/db/schema";

interface WarningInfo {
  lang: string;
  event: string;
  effective: string;
  expires: string;
  headline?: string;
  description: string;
  areaDesc: string;
}

interface Warning {
  title: string;
  link: string;
  published: string;
  info: WarningInfo[];
}

export async function saveWarnings(warnings: Warning[]) {
  for (const warning of warnings) {
    // Check if warning already exists by link
    const existing = await db
      .select()
      .from(warningsTable)
      .where(eq(warningsTable.link, warning.link));

    if (existing.length === 0) {
      // Insert new warning
      const insertResult = await db
        .insert(warningsTable)
        .values({
          link: warning.link,
          severity: warning.info[0].event, // take first info's event as severity (you can adjust if needed)
          location: warning.info[0].areaDesc,
          publishedAt: new Date(warning.published),
          createdAt: new Date(),
          effectiveAt: new Date(warning.info[0].effective),
          expiresAt: new Date(warning.info[0].expires),
        })
        .returning({ id: warningsTable.id });

      const warningId = insertResult[0].id;

      // Insert details for each language
      for (const detail of warning.info) {
        await db.insert(warningDetailsTable).values({
          warningId,
          lang: detail.lang,
          headline: detail.headline || null,
          description: detail.description,
          event: detail.event,
        });
      }
    } else {
      // Update existing warning

      const warningId = existing[0].id;

      await db
        .update(warningsTable)
        .set({
          severity: warning.info[0].event,
          location: warning.info[0].areaDesc,
          publishedAt: new Date(warning.published),
          effectiveAt: new Date(warning.info[0].effective),
          expiresAt: new Date(warning.info[0].expires),
        })
        .where(eq(warningsTable.id, warningId));

      // For details, delete old ones and re-insert (simpler than update merge)
      await db.delete(warningDetailsTable).where(eq(warningDetailsTable.warningId, warningId));

      for (const detail of warning.info) {
        await db.insert(warningDetailsTable).values({
          warningId,
          lang: detail.lang,
          headline: detail.headline || null,
          description: detail.description,
          event: detail.event,
        });
      }
    }
  }
}
