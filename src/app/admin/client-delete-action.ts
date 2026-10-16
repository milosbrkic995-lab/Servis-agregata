"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { clients, generators, user as authUser } from "@/db/schema";
import { requireAdmin } from "@/lib/permissions";

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/**
 * Permanently deletes a client, all generators assigned to that client,
 * their service history and notifications (via the existing FK cascades),
 * plus the linked non-admin portal account and its sessions.
 * A server-side confirmation is required; never trust the checkbox alone.
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
      // Delete assigned machines first; database FK cascades remove each
      // machine's service history and generator-linked notifications.
      await tx.delete(generators).where(eq(generators.clientId, clientId));

      // Remove the profile before its portal user, so nothing can be relinked
      // to a deleted client in the middle of the transaction.
      await tx.delete(clients).where(eq(clients.id, clientId));

      // Deleting the linked non-admin user removes its Better Auth accounts,
      // sessions, preferences and any remaining user-owned records by FK cascade.
      if (client.userId) {
        await tx
          .delete(authUser)
          .where(and(eq(authUser.id, client.userId), ne(authUser.role, "admin")));
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
  revalidatePath("/dashboard");
  redirect("/admin/clients?status=deleted");
}
