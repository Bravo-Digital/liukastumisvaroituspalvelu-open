import { integer, pgTable, serial, timestamp, varchar, text, boolean, uniqueIndex } from "drizzle-orm/pg-core";

export const warningsTable = pgTable("warnings", {
  id: varchar("id", { length: 256 }).primaryKey(),
  area: varchar("area", { length: 128 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  onsetAt: timestamp("effective_at", { mode: "date" }).notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
});


export const feedbackTable = pgTable("feedback", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 256 }),
  category: varchar("category", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 512 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
});

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  phone: varchar("phone", { length: 20 }).notNull(),
  area: varchar("area", { length: 128 }).notNull(),
  joinDate: timestamp("join_date", { mode: "date" }).notNull().defaultNow(),
  hour: varchar("hour", { length: 5 }), 
  language: varchar("language", { length: 2 }).notNull().default("fi"),
});

export const adminSettings = pgTable("admin_settings", {
  id: integer("id").primaryKey().default(1), // always 1
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  mfaSecret: text("mfa_secret"), // Base32 secret for TOTP
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const smsLogsTable = pgTable("sms_logs", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  message: text("message").notNull(),
  receivedAt: timestamp("received_at").defaultNow(),
  status: varchar("status", { length: 20 }).notNull(),
  error: text("error"), 
});
export const smsQueueTable = pgTable(
  "sms_queue",
  {
    id: serial("id").primaryKey(),
    warningId: varchar("warning_id", { length: 256 }).notNull(),
    userId: integer("user_id").notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    language: varchar("language", { length: 2 }).notNull(),
    message: text("message").notNull(),
    scheduledAt: timestamp("scheduled_at", { mode: "date" }).notNull(),
    sentAt: timestamp("sent_at", { mode: "date" }),
    status: varchar("status", { length: 20 }).notNull().default("pending"), 
    attempts: integer("attempts").notNull().default(0),
    gatewayMessageId: varchar("gateway_message_id", { length: 64 }), 
    lastError: text("last_error"),
  },
  (table) => {
    return {
      userWarningUnique: uniqueIndex("sms_queue_user_warning_unique").on(
        table.userId,
        table.warningId
      ),
    };
  }
);