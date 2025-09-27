import { db } from "@/lib/db";
import { adminSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function getAdminMfa() {
  const [row] = await db.select().from(adminSettings).where(eq(adminSettings.id, 1));
  return row ?? { id: 1, mfaEnabled: false, mfaSecret: null, updatedAt: new Date() };
}

export async function saveAdminMfaEnabled(enabled: boolean) {
  await db
    .insert(adminSettings)
    .values({ id: 1, mfaEnabled: enabled })
    .onConflictDoUpdate({
      target: adminSettings.id,
      set: { mfaEnabled: enabled, updatedAt: new Date() },
    });
}

export async function saveAdminMfaSecret(secret: string | null) {
  await db
    .insert(adminSettings)
    .values({ id: 1, mfaSecret: secret })
    .onConflictDoUpdate({
      target: adminSettings.id,
      set: { mfaSecret: secret, updatedAt: new Date() },
    });
}
