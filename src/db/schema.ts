import { integer, pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core";

export const warningsTable = pgTable("warnings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  link: varchar("link", { length: 512 }).notNull().unique(),
  severity: varchar("severity", { length: 50 }).notNull(),
  location: varchar("location", { length: 256 }).notNull(),
  publishedAt: timestamp("published_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  effectiveAt: timestamp("effective_at", { mode: "date" }).notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
});

export const warningDetailsTable = pgTable("warning_details", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  warningId: integer().notNull(),
  lang: varchar("lang", { length: 5 }).notNull(),
  headline: varchar("headline", { length: 512 }),
  description: text("description").notNull(),
  event: varchar("event", { length: 128 }).notNull(),
});
