import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { appNotifications, generators, serviceRecords, userSettings } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { requireUser } from "@/lib/auth";
import { getServiceStatus, serviceCountdown } from "@/lib/generator-utils";
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

export async function getDashboardData() {
  const user = await requireUser();
  const [rows, settingsRows] = await Promise.all([
    db.select().from(generators).where(eq(generators.userId, user.id)).orderBy(desc(generators.updatedAt)),
    db.select().from(userSettings).where(eq(userSettings.userId, user.id)).limit(1),
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
        .where(
          and(
            eq(appNotifications.userId, user.id),
            eq(appNotifications.generatorId, generator.id),
            eq(appNotifications.kind, "service"),
            eq(appNotifications.dueDate, dueDate),
          ),
        )
        .limit(1);
      if (existing.length > 0) continue;

      const title = status === "overdue" ? "Servis je zakasnio" : status === "today" ? "Servis je na redu danas" : "Servis se približava";
      const body = `${generator.name} · ${serviceCountdown(mapped, today)}.`;
      await db.insert(appNotifications).values({
        userId: user.id,
        generatorId: generator.id,
        kind: "service",
        title,
        body,
        dueDate,
      });

      if (settings.emailNotificationsEnabled && user.email) {
        await sendEmail({
          to: user.email,
          subject: title,
          fromName: "Servisni dnevnik",
          html: `<p>${escapeHtml(title)}: <strong>${escapeHtml(generator.name)}</strong>.</p><p>${escapeHtml(body)}</p><p>Prijavite se u aplikaciju da biste pregledali detalje.</p>`,
        });
      }
    }
  }

  return {
    user: { name: user.name, email: user.email },
    generators: rows.map(mapGenerator),
    settings,
  };
}

export async function getGeneratorDetails(id: string) {
  const user = await requireUser();
  const [generatorRows, records] = await Promise.all([
    db
      .select()
      .from(generators)
      .where(and(eq(generators.id, id), eq(generators.userId, user.id)))
      .limit(1),
    db
      .select()
      .from(serviceRecords)
      .where(and(eq(serviceRecords.generatorId, id), eq(serviceRecords.userId, user.id)))
      .orderBy(desc(serviceRecords.completedAt)),
  ]);
  if (!generatorRows[0]) return null;
  return {
    generator: mapGenerator(generatorRows[0]),
    records: records.map(mapService),
  };
}

export async function getNotificationsForCurrentUser(): Promise<AppNotification[]> {
  const user = await requireUser();
  await getDashboardData();
  const rows = await db
    .select()
    .from(appNotifications)
    .where(eq(appNotifications.userId, user.id))
    .orderBy(desc(appNotifications.createdAt));
  return rows.map(mapNotification);
}

export async function getSettingsForCurrentUser(): Promise<UserSettings> {
  const user = await requireUser();
  const rows = await db.select().from(userSettings).where(eq(userSettings.userId, user.id)).limit(1);
  return rows[0]
    ? {
        remindersEnabled: rows[0].remindersEnabled,
        emailNotificationsEnabled: rows[0].emailNotificationsEnabled,
      }
    : { remindersEnabled: true, emailNotificationsEnabled: false };
}

export async function getPendingBrowserNotifications(): Promise<AppNotification[]> {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(appNotifications)
    .where(and(eq(appNotifications.userId, user.id), isNull(appNotifications.browserNotifiedAt)))
    .orderBy(desc(appNotifications.createdAt));
  return rows.map(mapNotification);
}
