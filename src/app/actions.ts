"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { appNotifications, generators, serviceRecords, userSettings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { addMonths, dateOnly } from "@/lib/generator-utils";
import type { ActionResult, GeneratorFormValues, IntervalType, PowerUnit } from "@/lib/generator-types";

interface ParsedGenerator {
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  powerValue: number;
  powerUnit: PowerUnit;
  location: string;
  commissionedAt: string;
  intervalType: IntervalType;
  intervalMonths: number | null;
  intervalHours: number | null;
  currentHours: number;
  reminderDays: number;
  notificationsEnabled: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGeneratorForm(value: unknown): value is GeneratorFormValues {
  if (!isRecord(value)) return false;
  const textFields = ["name", "manufacturer", "model", "serialNumber", "powerValue", "location", "commissionedAt", "intervalMonths", "intervalHours", "currentHours", "reminderDays"];
  return textFields.every((field) => typeof value[field] === "string")
    && (value.id === undefined || typeof value.id === "string")
    && (value.intervalType === "calendar" || value.intervalType === "hours")
    && (value.powerUnit === "kVA" || value.powerUnit === "kW")
    && typeof value.notificationsEnabled === "boolean";
}

function parseNumber(value: string, min = 0): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= min ? parsed : null;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function parseGenerator(values: GeneratorFormValues): ParsedGenerator | string {
  const name = values.name.trim();
  const manufacturer = values.manufacturer.trim();
  const model = values.model.trim();
  const serialNumber = values.serialNumber.trim();
  const location = values.location.trim();
  const powerValue = parseNumber(values.powerValue, 0.01);
  const currentHours = values.currentHours.trim() ? parseNumber(values.currentHours) : 0;
  const reminderDays = values.reminderDays.trim() ? parseNumber(values.reminderDays) : 7;
  const intervalMonths = values.intervalType === "calendar" ? parseNumber(values.intervalMonths, 1) : null;
  const intervalHours = values.intervalType === "hours" ? parseNumber(values.intervalHours, 1) : null;
  if (!name || !manufacturer || !model || !serialNumber || !location || !validDate(values.commissionedAt)) {
    return "Popunite sva obavezna polja i proverite datum puštanja u rad.";
  }
  if (name.length > 120 || manufacturer.length > 120 || model.length > 120 || serialNumber.length > 120 || location.length > 200) {
    return "Neki podaci su predugački. Skratite unos i pokušajte ponovo.";
  }
  if (powerValue === null || currentHours === null || reminderDays === null) {
    return "Unesite ispravne brojeve za snagu, radne sate i podsetnik.";
  }
  if (!Number.isInteger(reminderDays) || reminderDays > 365) {
    return "Podsetnik može biti podešen najviše 365 dana unapred.";
  }
  if (values.intervalType === "calendar" && (intervalMonths === null || !Number.isInteger(intervalMonths) || intervalMonths > 120)) {
    return "Izaberite interval servisa od 1 do 120 meseci.";
  }
  if (values.intervalType === "hours" && intervalHours === null) {
    return "Izaberite interval servisa u radnim satima.";
  }
  return {
    name,
    manufacturer,
    model,
    serialNumber,
    powerValue,
    powerUnit: values.powerUnit,
    location,
    commissionedAt: values.commissionedAt,
    intervalType: values.intervalType,
    intervalMonths,
    intervalHours,
    currentHours,
    reminderDays,
    notificationsEnabled: values.notificationsEnabled,
  };
}

function refreshGeneratorPages(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/settings");
  if (id) revalidatePath(`/dashboard/generators/${id}`);
}

export async function saveGenerator(input: unknown): Promise<ActionResult> {
  if (!isGeneratorForm(input)) return { ok: false, message: "Podaci nisu ispravni. Proverite formular." };
  const parsed = parseGenerator(input);
  if (typeof parsed === "string") return { ok: false, message: parsed };
  try {
    const user = await requireUser();
    if (input.id) {
      const existing = await db
        .select({ id: generators.id })
        .from(generators)
        .where(and(eq(generators.id, input.id), eq(generators.userId, user.id)))
        .limit(1);
      if (!existing[0]) return { ok: false, message: "Agregat nije pronađen." };
      const history = await db
        .select({ completedAt: serviceRecords.completedAt })
        .from(serviceRecords)
        .where(and(eq(serviceRecords.generatorId, input.id), eq(serviceRecords.userId, user.id)))
        .orderBy(desc(serviceRecords.completedAt))
        .limit(1);
      const startDate = history[0]?.completedAt ?? parsed.commissionedAt;
      await db
        .update(generators)
        .set({
          ...parsed,
          nextServiceDate: parsed.intervalType === "calendar" ? addMonths(startDate, parsed.intervalMonths ?? 12) : null,
          updatedAt: new Date(),
        })
        .where(and(eq(generators.id, input.id), eq(generators.userId, user.id)));
      refreshGeneratorPages(input.id);
      return { ok: true, message: "Podaci o agregatu su sačuvani." };
    }

    await db.insert(generators).values({
      ...parsed,
      userId: user.id,
      nextServiceDate: parsed.intervalType === "calendar" ? addMonths(parsed.commissionedAt, parsed.intervalMonths ?? 12) : null,
    });
    refreshGeneratorPages();
    return { ok: true, message: "Agregat je dodat u evidenciju." };
  } catch (error) {
    console.error("[generator] save failed", error);
    return { ok: false, message: "Čuvanje nije uspelo. Pokušajte ponovo." };
  }
}

export async function deleteGenerator(input: unknown): Promise<ActionResult> {
  if (typeof input !== "string" || input.length > 120) return { ok: false, message: "Agregat nije pronađen." };
  try {
    const user = await requireUser();
    const deleted = await db
      .delete(generators)
      .where(and(eq(generators.id, input), eq(generators.userId, user.id)))
      .returning({ id: generators.id });
    if (!deleted[0]) return { ok: false, message: "Agregat nije pronađen." };
    refreshGeneratorPages(input);
    return { ok: true, message: "Agregat je uklonjen." };
  } catch (error) {
    console.error("[generator] delete failed", error);
    return { ok: false, message: "Uklanjanje nije uspelo. Pokušajte ponovo." };
  }
}

export async function recordService(input: unknown): Promise<ActionResult> {
  if (!isRecord(input) || typeof input.generatorId !== "string" || typeof input.completedAt !== "string" || typeof input.hoursAtService !== "string" || typeof input.workNotes !== "string") {
    return { ok: false, message: "Podaci o servisu nisu ispravni." };
  }
  if (!input.generatorId || !validDate(input.completedAt) || input.completedAt > dateOnly()) {
    return { ok: false, message: "Proverite datum obavljenog servisa." };
  }
  const hours = input.hoursAtService.trim() ? parseNumber(input.hoursAtService) : null;
  if (input.hoursAtService.trim() && hours === null) {
    return { ok: false, message: "Unesite ispravno stanje radnih sati." };
  }
  try {
    const user = await requireUser();
    const rows = await db
      .select()
      .from(generators)
      .where(and(eq(generators.id, input.generatorId), eq(generators.userId, user.id)))
      .limit(1);
    const generator = rows[0];
    if (!generator) return { ok: false, message: "Agregat nije pronađen." };
    const hoursAtService = hours ?? (generator.intervalType === "hours" ? generator.currentHours : null);
    if (generator.intervalType === "hours" && hoursAtService === null) {
      return { ok: false, message: "Unesite stanje radnih sati pri servisu." };
    }
    await db.insert(serviceRecords).values({
      userId: user.id,
      generatorId: generator.id,
      completedAt: input.completedAt,
      hoursAtService,
      workNotes: input.workNotes.trim().slice(0, 2000),
    });
    await db
      .update(generators)
      .set({
        lastServiceHours: hoursAtService,
        currentHours: hoursAtService ?? generator.currentHours,
        nextServiceDate:
          generator.intervalType === "calendar"
            ? addMonths(input.completedAt, generator.intervalMonths ?? 12)
            : null,
        updatedAt: new Date(),
      })
      .where(and(eq(generators.id, generator.id), eq(generators.userId, user.id)));
    refreshGeneratorPages(generator.id);
    return { ok: true, message: "Servis je upisan u istoriju." };
  } catch (error) {
    console.error("[service] record failed", error);
    return { ok: false, message: "Evidentiranje servisa nije uspelo. Pokušajte ponovo." };
  }
}

export async function updateGeneratorHours(idInput: unknown, valueInput: unknown): Promise<ActionResult> {
  if (typeof idInput !== "string" || typeof valueInput !== "string") return { ok: false, message: "Unesite ispravno stanje radnih sati." };
  const hours = parseNumber(valueInput);
  if (hours === null) return { ok: false, message: "Unesite ispravno stanje radnih sati." };
  try {
    const user = await requireUser();
    const updated = await db
      .update(generators)
      .set({ currentHours: hours, updatedAt: new Date() })
      .where(and(eq(generators.id, idInput), eq(generators.userId, user.id)))
      .returning({ id: generators.id });
    if (!updated[0]) return { ok: false, message: "Agregat nije pronađen." };
    refreshGeneratorPages(idInput);
    return { ok: true, message: "Stanje radnih sati je sačuvano." };
  } catch (error) {
    console.error("[generator] hours update failed", error);
    return { ok: false, message: "Čuvanje nije uspelo. Pokušajte ponovo." };
  }
}

export async function updateNotificationSettings(input: unknown): Promise<ActionResult> {
  if (!isRecord(input) || typeof input.remindersEnabled !== "boolean" || typeof input.emailNotificationsEnabled !== "boolean") {
    return { ok: false, message: "Proverite podešavanja obaveštenja." };
  }
  try {
    const user = await requireUser();
    await db
      .insert(userSettings)
      .values({
        userId: user.id,
        remindersEnabled: input.remindersEnabled,
        emailNotificationsEnabled: input.emailNotificationsEnabled,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          remindersEnabled: input.remindersEnabled,
          emailNotificationsEnabled: input.emailNotificationsEnabled,
          updatedAt: new Date(),
        },
      });
    refreshGeneratorPages();
    return { ok: true, message: "Podešavanja su sačuvana." };
  } catch (error) {
    console.error("[settings] save failed", error);
    return { ok: false, message: "Podešavanja nisu sačuvana. Pokušajte ponovo." };
  }
}

function validIds(input: unknown): input is string[] {
  return Array.isArray(input) && input.length <= 100 && input.every((id) => typeof id === "string");
}

export async function markNotificationsRead(input: unknown): Promise<ActionResult> {
  if (!validIds(input)) return { ok: false, message: "Obaveštenja nisu ažurirana." };
  if (input.length === 0) return { ok: true };
  try {
    const user = await requireUser();
    await db
      .update(appNotifications)
      .set({ readAt: new Date() })
      .where(and(eq(appNotifications.userId, user.id), inArray(appNotifications.id, input)));
    revalidatePath("/dashboard/notifications");
    return { ok: true };
  } catch (error) {
    console.error("[notifications] read update failed", error);
    return { ok: false, message: "Obaveštenja nisu ažurirana." };
  }
}

export async function markBrowserNotificationsSent(input: unknown): Promise<ActionResult> {
  if (!validIds(input)) return { ok: false, message: "Obaveštenje nije poslato." };
  if (input.length === 0) return { ok: true };
  try {
    const user = await requireUser();
    await db
      .update(appNotifications)
      .set({ browserNotifiedAt: new Date() })
      .where(and(eq(appNotifications.userId, user.id), inArray(appNotifications.id, input)));
    return { ok: true };
  } catch (error) {
    console.error("[notifications] browser delivery update failed", error);
    return { ok: false, message: "Obaveštenje nije poslato." };
  }
}
