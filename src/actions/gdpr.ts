"use server";

import { db } from "@/lib/db"; // 🔧 adjust if your db path differs
import { eq } from "drizzle-orm";
import { usersTable, smsQueueTable, smsLogsTable } from "@/lib/schema"; // 🔧 adjust path to your schema.ts

function parseLookup(by: string | null, identifier: string | null) {
  const mode = (by === "id" ? "id" : "phone") as "id" | "phone";
  if (!identifier) throw new Error("Missing identifier");
  if (mode === "id") {
    const id = Number(identifier);
    if (!Number.isInteger(id)) throw new Error("Invalid user id");
    return { mode, id } as const;
  }
  return { mode, phone: identifier } as const;
}

export async function rectifyUser(formData: FormData) {
  const by = String(formData.get("by") || "phone");
  const identifier = String(formData.get("identifier") || "");
  const patch = {
    phone: (formData.get("phone") as string | null) || undefined,
    language: (formData.get("language") as string | null) || undefined,
    hour: (formData.get("hour") as string | null) || undefined,
    area: (formData.get("area") as string | null) || undefined,
  } as Partial<{ phone: string; language: string; hour: string; area: string }>;

  const lookup = parseLookup(by, identifier);

  // Find user
  const user = lookup.mode === "id"
    ? (await db.select().from(usersTable).where(eq(usersTable.id, lookup.id)).limit(1))[0]
    : (await db.select().from(usersTable).where(eq(usersTable.phone, lookup.phone)).limit(1))[0];

  if (!user) throw new Error("User not found");

  const updateData: any = {};
  if (patch.phone && patch.phone !== user.phone) updateData.phone = patch.phone;
  if (patch.language && patch.language !== user.language) updateData.language = patch.language;
  if (patch.hour !== undefined && patch.hour !== user.hour) updateData.hour = patch.hour;
  if (patch.area && patch.area !== user.area) updateData.area = patch.area;

  if (Object.keys(updateData).length === 0) return;

  // Update user
  await db.update(usersTable).set(updateData).where(eq(usersTable.id, user.id));

  // Keep queued SMS in sync if phone changed
  if (updateData.phone) {
    await db.update(smsQueueTable).set({ phone: updateData.phone }).where(eq(smsQueueTable.userId, user.id));
  }
}

export async function eraseUser(formData: FormData) {
  const by = String(formData.get("by") || "phone");
  const identifier = String(formData.get("identifier") || "");
  const confirm = String(formData.get("confirm") || "");
  if (confirm.toUpperCase() !== "ERASE") throw new Error("Confirmation missing. Type ERASE to confirm.");

  const lookup = parseLookup(by, identifier);

  // Find user
  const user = lookup.mode === "id"
    ? (await db.select().from(usersTable).where(eq(usersTable.id, lookup.id)).limit(1))[0]
    : (await db.select().from(usersTable).where(eq(usersTable.phone, lookup.phone)).limit(1))[0];

  if (!user) throw new Error("User not found");

  // Delete related records first
  await db.delete(smsQueueTable).where(eq(smsQueueTable.userId, user.id));
  await db.delete(smsLogsTable).where(eq(smsLogsTable.phone, user.phone));

  // Finally delete user
  await db.delete(usersTable).where(eq(usersTable.id, user.id));
}