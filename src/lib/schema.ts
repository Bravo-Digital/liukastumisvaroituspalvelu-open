import { index, integer, pgTable, serial, timestamp, varchar, text, boolean, uniqueIndex, jsonb } from "drizzle-orm/pg-core";

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
export const auditEvents = pgTable(
  "audit_events",
  {
    id: serial("id").primaryKey(),
    ts: timestamp("ts", { mode: "date", withTimezone: true }).notNull().defaultNow(),

    actorType: varchar("actor_type", { length: 20 }),
    actorId: varchar("actor_id", { length: 128 }),
    action: varchar("action", { length: 64 }).notNull(),
    subjectType: varchar("subject_type", { length: 32 }),
    subjectId: varchar("subject_id", { length: 128 }),
    outcome: varchar("outcome", { length: 16 }),

    ip: varchar("ip", { length: 45 }),
    userAgent: text("user_agent"),

    prevHash: varchar("prev_hash", { length: 128 }),
    hash: varchar("hash", { length: 128 }), // 64 is enough for sha256 hex, 128 is fine too

    meta: jsonb("meta"),
  },
  (t) => ({
    byTs: index("audit_by_ts").on(t.ts),
    uniqHash: uniqueIndex("audit_uniq_hash").on(t.hash), // for idempotency
  })
);
export const adminLoginAttemptsTable = pgTable("admin_login_attempts", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  ip: text("ip").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});