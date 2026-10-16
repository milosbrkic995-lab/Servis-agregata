"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { clients, generators, serviceRecords } from "@/db/schema";
import { addMonths } from "@/lib/generator-utils";
import { requireAdmin } from "@/lib/permissions";

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function numberValue(input: string, min = 0): number | null {
  if (!input) return null;
  const n = Number(input.replace(",", "."));
  return Number.isFinite(n) && n >= min ? n : null;
}

function isDateOnly(input: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const date = new Date(`${input}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === input;
}

function readEquipmentFields(formData: FormData) {
  const controller = value(formData, "controller") || null;
  const generatorSerialNumber = value(formData, "generatorSerialNumber") || null;
  const operatingMode = value(formData, "operatingMode") || "auto";
  const yearInput = value(formData, "manufacturingYear");
  const manufacturingYear = yearInput ? numberValue(yearInput, 1900) : null;
  const yearInvalid = Boolean(
    yearInput &&
      (manufacturingYear === null ||
        !Number.isInteger(manufacturingYear) ||
        manufacturingYear > 2100),
  );
  return {
    controller,
    generatorSerialNumber,
    operatingMode,
    manufacturingYear,
    yearInvalid,
  };
}

const isOperatingMode = (mode: string) =>
  ["auto", "manual", "stopped"].includes(mode);

export async function createClientAction(formData: FormData) {
  await requireAdmin();
  const name = value(formData, "name");
  const email = value(formData, "email").toLowerCase();
  const company = value(formData, "company") || null;
  const phone = value(formData, "phone") || null;
  const pib = value(formData, "pib").replace(/\s+/g, "") || null;
  const address = value(formData, "address") || null;
  const notes = value(formData, "notes") || null;

  if (!name || name.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !pib || !/^\d{9}$/.test(pib)) {
    redirect("/admin/clients?status=invalid");
  }

  try {
    await db.insert(clients).values({ name, email, company, phone, pib, address, notes });
  } catch (error) {
    console.error("[admin] create client failed", error);
    redirect("/admin/clients?status=duplicate-or-error");
  }
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  redirect("/admin/clients?status=created");
}

export async function updateClientAction(formData: FormData) {
  await requireAdmin();
  const id = value(formData, "clientId");
  const name = value(formData, "name");
  const email = value(formData, "email").toLowerCase();
  const company = value(formData, "company") || null;
  const phone = value(formData, "phone") || null;
  const pib = value(formData, "pib").replace(/\s+/g, "") || null;
  const address = value(formData, "address") || null;
  const notes = value(formData, "notes") || null;
  if (!id || !name || name.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !pib || !/^\d{9}$/.test(pib)) {
    redirect("/admin/clients?status=invalid");
  }
  const previous = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!previous[0]) redirect("/admin/clients?status=not-found");
  try {
    await db.update(clients).set({
      name, email, company, phone, pib, address, notes,
      // If email changes, unlink the old login so the new email + PIB pair can link on next sign-in.
      userId: previous[0].email.toLowerCase() === email ? previous[0].userId : null,
      updatedAt: new Date(),
    }).where(eq(clients.id, id));
  } catch (error) {
    console.error("[admin] update client failed", error);
    redirect("/admin/clients?status=duplicate-or-error");
  }
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  redirect("/admin/clients?status=updated");
}

export async function updateGeneratorAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = value(formData, "generatorId");
  const name = value(formData, "name");
  const manufacturer = value(formData, "manufacturer");
  const model = value(formData, "model");
  const serialNumber = value(formData, "serialNumber");
  const powerValue = numberValue(value(formData, "powerValue"), 0.01);
  const powerUnit = value(formData, "powerUnit");
  const location = value(formData, "location");
  const commissionedAt = value(formData, "commissionedAt");
  const intervalMonths = numberValue(value(formData, "intervalMonths"), 1);
  const currentHours = numberValue(value(formData, "currentHours") || "0", 0);
  const clientId = value(formData, "clientId") || null;
  const equipment = readEquipmentFields(formData);

  if (!id || !name || !manufacturer || !model || !serialNumber || !location ||
      !isDateOnly(commissionedAt) || powerValue === null ||
      !["kW", "kVA"].includes(powerUnit) || intervalMonths === null ||
      !Number.isInteger(intervalMonths) || intervalMonths > 120 || currentHours === null ||
      !isOperatingMode(equipment.operatingMode) || equipment.yearInvalid) {
    redirect("/admin/generators?status=invalid");
  }

  const existing = await db.select({ id: generators.id }).from(generators).where(eq(generators.id, id)).limit(1);
  if (!existing[0]) redirect("/admin/generators?status=not-found");
  const recentService = await db.select({ completedAt: serviceRecords.completedAt }).from(serviceRecords)
    .where(eq(serviceRecords.generatorId, id)).orderBy(desc(serviceRecords.completedAt)).limit(1);
  if (clientId) {
    const owner = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, clientId)).limit(1);
    if (!owner[0]) redirect("/admin/generators?status=invalid-client");
  }
  await db.update(generators).set({
    clientId, name, manufacturer, model, serialNumber,
    controller: equipment.controller,
    generatorSerialNumber: equipment.generatorSerialNumber,
    operatingMode: equipment.operatingMode,
    manufacturingYear: equipment.manufacturingYear,
    powerValue, powerUnit, location, commissionedAt,
    intervalType: "calendar", intervalMonths,
    intervalHours: null, currentHours,
    nextServiceDate: addMonths(recentService[0]?.completedAt ?? commissionedAt, intervalMonths),
    updatedAt: new Date(),
  }).where(eq(generators.id, id));

  revalidatePath("/admin");
  revalidatePath("/admin/generators");
  revalidatePath(`/admin/generators/${id}`);
  if (clientId) revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
  revalidatePath("/dashboard");
  redirect("/admin/generators?status=updated");
}

export async function createServiceRecordAction(formData: FormData) {
  const admin = await requireAdmin();
  const generatorId = value(formData, "generatorId");
  const completedAt = value(formData, "completedAt");
  const hoursInput = value(formData, "hoursAtService");
  const workNotes = value(formData, "workNotes").slice(0, 2000);
  const hours = hoursInput ? numberValue(hoursInput, 0) : null;
  if (!generatorId || !isDateOnly(completedAt) || completedAt > new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date()) || (hoursInput && hours === null)) {
    redirect("/admin/work-orders?status=invalid");
  }
  const rows = await db.select().from(generators).where(eq(generators.id, generatorId)).limit(1);
  const generator = rows[0];
  if (!generator) redirect("/admin/work-orders?status=generator-not-found");
  const hoursAtService = hours ?? (generator.intervalType === "hours" ? generator.currentHours : null);
  if (generator.intervalType === "hours" && hoursAtService === null) redirect("/admin/work-orders?status=hours-required");
  await db.insert(serviceRecords).values({
    userId: admin.id,
    generatorId: generator.id,
    completedAt,
    hoursAtService,
    workNotes,
  });
  await db.update(generators).set({
    lastServiceHours: hoursAtService,
    currentHours: hoursAtService ?? generator.currentHours,
    nextServiceDate: generator.intervalType === "calendar" ? addMonths(completedAt, generator.intervalMonths ?? 12) : null,
    updatedAt: new Date(),
  }).where(eq(generators.id, generator.id));
  revalidatePath("/admin/work-orders");
  revalidatePath("/admin/generators");
  revalidatePath(`/admin/generators/${generator.id}`);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/generators/${generator.id}`);
  redirect("/admin/work-orders?status=created");
}

export async function createGeneratorAction(formData: FormData) {
  const admin = await requireAdmin();
  const name = value(formData, "name");
  const manufacturer = value(formData, "manufacturer");
  const model = value(formData, "model");
  const serialNumber = value(formData, "serialNumber");
  const powerValue = numberValue(value(formData, "powerValue"), 0.01);
  const powerUnit = value(formData, "powerUnit");
  const location = value(formData, "location");
  const commissionedAt = value(formData, "commissionedAt");
  const intervalMonths = numberValue(value(formData, "intervalMonths"), 1);
  const currentHours = numberValue(value(formData, "currentHours") || "0", 0);
  const clientId = value(formData, "clientId") || null;
  const equipment = readEquipmentFields(formData);

  if (!name || !manufacturer || !model || !serialNumber || !location ||
      !isDateOnly(commissionedAt) || powerValue === null ||
      !["kW", "kVA"].includes(powerUnit) || intervalMonths === null ||
      !Number.isInteger(intervalMonths) || intervalMonths > 120 || currentHours === null ||
      !isOperatingMode(equipment.operatingMode) || equipment.yearInvalid) {
    redirect("/admin/generators?status=invalid");
  }
  if (clientId) {
    const owner = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, clientId)).limit(1);
    if (!owner[0]) redirect("/admin/generators?status=invalid-client");
  }

  await db.insert(generators).values({
    userId: admin.id,
    clientId,
    name,
    manufacturer,
    model,
    serialNumber,
    controller: equipment.controller,
    generatorSerialNumber: equipment.generatorSerialNumber,
    operatingMode: equipment.operatingMode,
    manufacturingYear: equipment.manufacturingYear,
    powerValue,
    powerUnit,
    location,
    commissionedAt,
    intervalType: "calendar",
    intervalMonths,
    intervalHours: null,
    currentHours,
    lastServiceHours: null,
    nextServiceDate: addMonths(commissionedAt, intervalMonths),
    reminderDays: 7,
    notificationsEnabled: true,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/generators");
  revalidatePath("/admin/clients");
  if (clientId) revalidatePath(`/admin/clients/${clientId}`);
  redirect("/admin/generators?status=created");
}
