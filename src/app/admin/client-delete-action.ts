"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { clients, generators, session, user as authUser } from "@/db/schema";
import { requireAdmin } from "@/lib/permissions";

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/**
 * Deletes the client profile but deliberately preserves assigned generators,
 * their service history, and request history. Equipment is detached first.
 * The linked portal user's sessions are revoked; the user row is kept so no
 * unrelated user-owned history is cascaded away.
 */
export async function deleteClientAction(formData: FormData) {
  await requireAdmin();

  const clientId = value(formData, "clientId");
  const confirmation = value(formData, "confirmDelete");
  if (!clientId || confirmation !== "DELETE") {
    redirect("/admin/clients?status=delete-confirmation");
  }

  const rows = await db
    .select({ id: clients.id, name: clients.name, userId: clients.userId })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  const client = rows[0];
  if (!client) redirect("/admin/clients?status=not-found");

  if (client.userId) {
    const linkedRows = await db
      .select({ id: authUser.id, role: authUser.role })
      .from(authUser)
      .where(eq(authUser.id, client.userId))
      .limit(1);
    if (linkedRows[0]?.role === "admin") {
      redirect("/admin/clients?status=protected-account");
    }
  }

  try {
    await db.transaction(async (tx) => {
      // Never delete generators or their service_records from this action.
      await tx.update(generators)
        .set({ clientId: null, updatedAt: new Date() })
        .where(eq(generators.clientId, clientId));

      // service_requests.client_id uses ON DELETE SET NULL and stores snapshots.
      await tx.delete(clients).where(eq(clients.id, clientId));

      // Stop existing sessions without deleting the auth user and its other history.
      if (client.userId) {
        await tx.delete(session).where(eq(session.userId, client.userId));
      }
    });
  } catch (error) {
    console.error("[admin] delete client failed", error);
    redirect("/admin/clients?status=delete-error");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/generators");
  revalidatePath("/admin/work-orders");
  revalidatePath("/admin/service-requests");
  revalidatePath("/dashboard");
  redirect("/admin/clients?status=deleted");
}
