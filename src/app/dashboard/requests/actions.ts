"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { clients, generators, serviceRequestMessages, serviceRequests } from "@/db/schema";
import { requireUser } from "@/lib/auth";

function value(data: FormData, key: string) { return String(data.get(key) ?? "").trim(); }

async function linkedClient(userId: string) {
  const rows = await db.select({ id: clients.id, name: clients.name, company: clients.company, email: clients.email })
    .from(clients).where(eq(clients.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function createServiceRequestAction(formData: FormData) {
  const currentUser = await requireUser();
  const client = await linkedClient(currentUser.id);
  if (!client) redirect("/dashboard/requests?status=no-client");

  const generatorId = value(formData, "generatorId");
  const subject = value(formData, "subject").slice(0, 180);
  const description = value(formData, "description").slice(0, 4000);
  const urgency = value(formData, "urgency");
  if (!generatorId || subject.length < 3 || description.length < 8 || !["normal", "urgent"].includes(urgency)) {
    redirect(`/dashboard/requests/new?status=invalid&generatorId=${encodeURIComponent(generatorId)}`);
  }

  const owned = await db.select({ id: generators.id, name: generators.name, serialNumber: generators.serialNumber })
    .from(generators).where(and(eq(generators.id, generatorId), eq(generators.clientId, client.id))).limit(1);
  const generator = owned[0];
  if (!generator) redirect("/dashboard/requests/new?status=generator-not-found");

  const rows = await db.insert(serviceRequests).values({
    clientId: client.id,
    generatorId: generator.id,
    clientNameSnapshot: client.company || client.name,
    clientEmailSnapshot: client.email,
    generatorNameSnapshot: generator.name,
    generatorSerialSnapshot: generator.serialNumber,
    submittedByUserId: currentUser.id,
    submittedByName: currentUser.name,
    submittedByEmail: currentUser.email,
    subject,
    description,
    urgency,
    status: "new",
    updatedAt: new Date(),
  }).returning({ id: serviceRequests.id });

  revalidatePath("/admin");
  revalidatePath("/admin/service-requests");
  revalidatePath("/dashboard/requests");
  redirect(`/dashboard/requests/${rows[0].id}?status=created`);
}

export async function sendClientServiceRequestMessageAction(formData: FormData) {
  const currentUser = await requireUser();
  const client = await linkedClient(currentUser.id);
  const requestId = value(formData, "requestId");
  const message = value(formData, "message").slice(0, 3000);
  if (!client || !requestId || message.length < 2) redirect("/dashboard/requests?status=message-invalid");

  const found = await db.select({ id: serviceRequests.id }).from(serviceRequests)
    .where(and(eq(serviceRequests.id, requestId), eq(serviceRequests.clientId, client.id))).limit(1);
  if (!found[0]) redirect("/dashboard/requests?status=not-found");

  await db.transaction(async (tx) => {
    await tx.insert(serviceRequestMessages).values({
      requestId,
      authorUserId: currentUser.id,
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      authorRole: "client",
      message,
    });
    await tx.update(serviceRequests).set({ updatedAt: new Date() }).where(eq(serviceRequests.id, requestId));
  });

  revalidatePath(`/dashboard/requests/${requestId}`);
  revalidatePath("/admin/service-requests");
  revalidatePath(`/admin/service-requests/${requestId}`);
  redirect(`/dashboard/requests/${requestId}?status=reply-sent`);
}
