"use server";

import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { generators, serviceRecords } from "@/db/schema";
import { addMonths, dateOnly } from "@/lib/generator-utils";
import { requireAdmin } from "@/lib/permissions";

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function parseHours(input: string): number | null {
  if (!input) return null;
  const parsed = Number(input.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function isDateOnly(input: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const date = new Date(`${input}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === input;
}

/** Create one individual service-history record for each selected generator. */
export async function createBulkServiceRecordAction(formData: FormData) {
  const admin = await requireAdmin();
  const generatorIds = [...new Set(formData.getAll("generatorIds").map((value) => String(value).trim()).filter(Boolean))];
  const completedAt = formValue(formData, "completedAt");
  const workNotes = formValue(formData, "workNotes").slice(0, 2000);

  if (generatorIds.length < 1 || generatorIds.length > 100 || !isDateOnly(completedAt) || completedAt > dateOnly()) {
    redirect("/admin/work-orders?status=invalid");
  }

  const selectedGenerators = await db
    .select()
    .from(generators)
    .where(inArray(generators.id, generatorIds));

  if (selectedGenerators.length !== generatorIds.length) {
    redirect("/admin/work-orders?status=generator-not-found");
  }

  const prepared = selectedGenerators.map((generator) => {
    const rawHours = formValue(formData, `hoursAtService_${generator.id}`);
    const hoursAtService = parseHours(rawHours);
    if (rawHours && hoursAtService === null) {
      redirect("/admin/work-orders?status=invalid-hours");
    }
    if (generator.intervalType === "hours" && hoursAtService === null) {
      redirect("/admin/work-orders?status=hours-required");
    }
    return { generator, hoursAtService };
  });

  await db.transaction(async (tx) => {
    for (const { generator, hoursAtService } of prepared) {
      await tx.insert(serviceRecords).values({
        userId: admin.id,
        generatorId: generator.id,
        completedAt,
        hoursAtService,
        workNotes,
      });
      await tx.update(generators).set({
        lastServiceHours: hoursAtService,
        currentHours: hoursAtService ?? generator.currentHours,
        nextServiceDate: generator.intervalType === "calendar"
          ? addMonths(completedAt, generator.intervalMonths ?? 12)
          : null,
        updatedAt: new Date(),
      }).where(inArray(generators.id, [generator.id]));
    }
  });

  revalidatePath("/admin/work-orders");
  revalidatePath("/admin/generators");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  for (const id of generatorIds) {
    revalidatePath(`/admin/generators/${id}`);
    revalidatePath(`/dashboard/generators/${id}`);
  }
  redirect(`/admin/work-orders?status=created&count=${generatorIds.length}`);
}
