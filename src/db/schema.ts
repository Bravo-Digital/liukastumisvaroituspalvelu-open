import { integer, pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core";

export const warningsTable = pgTable("warnings", {
  id: varchar("id", { length: 256 }).primaryKey(),
  severity: varchar("severity", { length: 50 }).notNull(),
  certainty: varchar("certainty", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  onsetAt: timestamp("effective_at", { mode: "date" }).notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
})


export const warningDetailsTable = pgTable("warning_details", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  warningId: varchar("warning_id", { length: 256 }).notNull(),
  lang: varchar("lang", { length: 5 }).notNull(),
  location: varchar("location", { length: 256 }).array().notNull(),
  headline: varchar("headline", { length: 512 }),
  description: text("description").notNull(),
  event: varchar("event", { length: 128 }).notNull(),
});
