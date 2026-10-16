import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { appNotifications, clients, generators, serviceRecords, userSettings } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { getServiceStatus, serviceCountdown } from "@/lib/generator-utils";
import { requireUser } from "@/lib/auth";
import type {
  AppNotification,
  GeneratorRecord,
  ServiceRecord,
  UserSettings,
} from "@/lib/generator-types";

function mapGenerator(row: typeof generators.$inferSelect): GeneratorRecord {
  return {
    ...row,
    intervalType: row.intervalType === "hours" ? "hours" : "calendar",
    powerUnit: row.powerUnit === "kW" ? "kW" : "kVA",
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapNotification(row: typeof appNotifications.$inferSelect): AppNotification {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    browserNotifiedAt: row.browserNotifiedAt?.toISOString() ?? null,
  };
}

function mapService(row: typeof serviceRecords.$inferSelect): ServiceRecord {
  return {
    id: row.id,
    generatorId: row.generatorId,
    completedAt: row.completedAt,
    hoursAtService: row.hoursAtService,
    workNotes: row.workNotes,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

/** Client portal data is always scoped through clients.userId -> generators.clientId. */
export async function getDashboardData() {
  const currentUser = await requireUser();
  const linkedClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.userId, currentUser.id))
    .limit(1);
  const clientId = linkedClients[0]?.id;

  const [rows, settingsRows] = await Promise.all([
    clientId
      ? db.select().from(generators).where(eq(generators.clientId, clientId)).orderBy(desc(generators.updatedAt))
      : Promise.resolve([] as (typeof generators.$inferSelect)[]),
    db.select().from(userSettings).where(eq(userSettings.userId, currentUser.id)).limit(1),
  ]);
  const settings: UserSettings = settingsRows[0]
    ? {
        remindersEnabled: settingsRows[0].remindersEnabled,
        emailNotificationsEnabled: settingsRows[0].emailNotificationsEnabled,
      }
    : { remindersEnabled: true, emailNotificationsEnabled: false };

  if (settings.remindersEnabled) {
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date());
    for (const generator of rows) {
      if (!generator.notificationsEnabled) continue;
      const mapped = mapGenerator(generator);
      const status = getServiceStatus(mapped, today);
      if (status === "current") continue;
      const dueDate = generator.intervalType === "hours" ? today : generator.nextServiceDate ?? today;
      const existing = await db
        .select({ id: appNotifications.id })
        .from(appNotifications)
        .where(and(
          eq(appNotifications.userId, currentUser.id),
          eq(appNotifications.generatorId, generator.id),
          eq(appNotifications.kind, "service"),
          eq(appNotifications.dueDate, dueDate),
        ))
        .limit(1);
      if (existing.length > 0) continue;

      const title = status === "overdue" ? "Servis je zakasnio" : status === "today" ? "Servis je na redu danas" : "Servis se približava";
      const body = `${generator.name} · ${serviceCountdown(mapped, today)}.`;
await db.insert(appNotifications).values({
  id: crypto.randomUUID(),
  userId: currentUser.id,
  generatorId: generator.id,
  kind: "service",
  title,
  body,
  dueDate,
});

      if (settings.emailNotificationsEnabled && currentUser.email) {
        await sendEmail({
          to: currentUser.email,
          subject: title,
          fromName: "Servisni dnevnik",
          html: `<p>${escapeHtml(title)}: <strong>${escapeHtml(generator.name)}</strong>.</p><p>${escapeHtml(body)}</p><p>Prijavite se u aplikaciju da biste pregledali detalje.</p>`,
        });
      }
    }
  }

  return {
    user: { name: currentUser.name, email: currentUser.email },
    generators: rows.map(mapGenerator),
    settings,
  };
}

export async function getGeneratorDetails(id: string) {
  const currentUser = await requireUser();
  const linkedClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.userId, currentUser.id))
    .limit(1);
  const clientId = linkedClients[0]?.id;
  if (!clientId) return null;

  const generatorRows = await db
    .select()
    .from(generators)
    .where(and(eq(generators.id, id), eq(generators.clientId, clientId)))
    .limit(1);
  const generator = generatorRows[0];
  if (!generator) return null;

  // Authorization is established above from the generator's clientId; include its
  // full service history regardless of which staff account entered the record.
  const records = await db
    .select()
    .from(serviceRecords)
    .where(eq(serviceRecords.generatorId, generator.id))
    .orderBy(desc(serviceRecords.completedAt));

  return {
    generator: mapGenerator(generator),
    records: records.map(mapService),
  };
}

export async function getNotificationsForCurrentUser(): Promise<AppNotification[]> {
  const currentUser = await requireUser();
  await getDashboardData();
  const rows = await db
    .select()
    .from(appNotifications)
    .where(eq(appNotifications.userId, currentUser.id))
    .orderBy(desc(appNotifications.createdAt));
  return rows.map(mapNotification);
}

export async function getSettingsForCurrentUser(): Promise<UserSettings> {
  const currentUser = await requireUser();
  const rows = await db.select().from(userSettings).where(eq(userSettings.userId, currentUser.id)).limit(1);
  return rows[0]
    ? {
        remindersEnabled: rows[0].remindersEnabled,
        emailNotificationsEnabled: rows[0].emailNotificationsEnabled,
      }
    : { remindersEnabled: true, emailNotificationsEnabled: false };
}

export async function getPendingBrowserNotifications(): Promise<AppNotification[]> {
  const currentUser = await requireUser();
  const rows = await db
    .select()
    .from(appNotifications)
    .where(and(eq(appNotifications.userId, currentUser.id), isNull(appNotifications.browserNotifiedAt)))
    .orderBy(desc(appNotifications.createdAt));
  return rows.map(mapNotification);
}
