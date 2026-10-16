import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    // New accounts are clients by default. Promote the owner's account manually
    // after applying database/02-promote-admin.sql.
    role: text("role").notNull().default("client"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_email_idx").on(t.email)],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("session_token_idx").on(t.token),
    index("session_user_idx").on(t.userId),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/** A business/person managed from the administrator's master panel. */
export const clients = pgTable(
  "clients",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company"),
    phone: text("phone"),
    pib: text("pib"),
    address: text("address"),
    notes: text("notes"),
    // Null until a verified Better Auth account is explicitly linked by admin.
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("clients_email_idx").on(t.email),
    uniqueIndex("clients_user_idx").on(t.userId),
    index("clients_name_idx").on(t.name),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  generators: many(generators),
  notifications: many(appNotifications),
  settings: many(userSettings),
  clientProfiles: many(clients),
}));

export const clientRelations = relations(clients, ({ one, many }) => ({
  user: one(user, { fields: [clients.userId], references: [user.id] }),
  generators: many(generators),
}));

export const generators = pgTable(
  "generators",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    // Original creator/owner field is preserved for backward compatibility.
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Null means the generator belongs to J&B POWER; otherwise it belongs to this client.
    clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    manufacturer: text("manufacturer").notNull(),
    model: text("model").notNull(),
    serialNumber: text("serial_number").notNull(),
    // Additional technical data from the equipment card.
    controller: text("controller"),
    generatorSerialNumber: text("generator_serial_number"),
    operatingMode: text("operating_mode").notNull().default("auto"),
    manufacturingYear: integer("manufacturing_year"),
    powerValue: real("power_value").notNull(),
    powerUnit: text("power_unit").notNull(),
    location: text("location").notNull(),
    commissionedAt: date("commissioned_at", { mode: "string" }).notNull(),
    intervalType: text("interval_type").notNull().default("calendar"),
    intervalMonths: integer("interval_months"),
    intervalHours: real("interval_hours"),
    currentHours: real("current_hours").notNull().default(0),
    lastServiceHours: real("last_service_hours"),
    nextServiceDate: date("next_service_date", { mode: "string" }),
    reminderDays: integer("reminder_days").notNull().default(7),
    notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("generators_user_idx").on(t.userId),
    index("generators_client_idx").on(t.clientId),
  ],
);

export const generatorRelations = relations(generators, ({ one, many }) => ({
  owner: one(user, { fields: [generators.userId], references: [user.id] }),
  client: one(clients, { fields: [generators.clientId], references: [clients.id] }),
  serviceRecords: many(serviceRecords),
}));

export const serviceRecords = pgTable(
  "service_records",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    generatorId: text("generator_id")
      .notNull()
      .references(() => generators.id, { onDelete: "cascade" }),
    completedAt: date("completed_at", { mode: "string" }).notNull(),
    hoursAtService: real("hours_at_service"),
    workNotes: text("work_notes").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("service_records_user_idx").on(t.userId),
    index("service_records_generator_idx").on(t.generatorId),
  ],
);

export const appNotifications = pgTable(
  "app_notifications",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    generatorId: text("generator_id").references(() => generators.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    dueDate: date("due_date", { mode: "string" }),
    readAt: timestamp("read_at"),
    browserNotifiedAt: timestamp("browser_notified_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("app_notifications_user_idx").on(t.userId)],
);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  remindersEnabled: boolean("reminders_enabled").notNull().default(true),
  emailNotificationsEnabled: boolean("email_notifications_enabled")
    .notNull()
    .default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
