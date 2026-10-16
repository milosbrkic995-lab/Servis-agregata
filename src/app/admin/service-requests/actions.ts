"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { serviceRequestMessages, serviceRequests } from "@/db/schema";
import { requireAdmin } from "@/lib/permissions";

const allowedStatuses = ["new", "in_progress", "scheduled", "resolved", "closed"] as const;
type RequestStatus = (typeof allowedStatuses)[number];
function value(data: FormData, key: string) { return String(data.get(key) ?? "").trim(); }

export async function updateServiceRequestAction(formData: FormData) {
  const admin = await requireAdmin();
  const requestId = value(formData, "requestId");
  const status = value(formData, "status") as RequestStatus;
  const message = value(formData, "message").slice(0, 3000);
  if (!requestId || !allowedStatuses.includes(status)) redirect("/admin/service-requests?status=invalid");
  const requestRows = await db.select({ id: serviceRequests.id }).from(serviceRequests)
    .where(eq(serviceRequests.id, requestId)).limit(1);
  if (!requestRows[0]) redirect("/admin/service-requests?status=not-found");
  if (message.length === 1) redirect(`/admin/service-requests/${requestId}?status=message-invalid`);

  await db.transaction(async (tx) => {
    if (message.length >= 2) {
      await tx.insert(serviceRequestMessages).values({
        requestId,
        authorUserId: admin.id,
        authorName: admin.name,
        authorEmail: admin.email,
        authorRole: "admin",
        message,
      });
    }
    await tx.update(serviceRequests).set({ status, updatedAt: new Date() }).where(eq(serviceRequests.id, requestId));
  });

  revalidatePath("/admin");
  revalidatePath("/admin/service-requests");
  revalidatePath(`/admin/service-requests/${requestId}`);
  revalidatePath("/dashboard/requests");
  revalidatePath(`/dashboard/requests/${requestId}`);
  redirect(`/admin/service-requests/${requestId}?status=updated`);
}
