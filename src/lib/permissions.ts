import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export type AppRole = "admin" | "client";

export async function getUserRole(userId: string): Promise<AppRole> {
  const rows = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return rows[0]?.role === "admin" ? "admin" : "client";
}

/** Call inside every administrator-only server action. Never trust a client form field for roles. */
export async function requireAdmin() {
  const currentUser = await requireUser();
  const role = await getUserRole(currentUser.id);
  if (role !== "admin") {
    throw new Error("Nemate dozvolu za ovu radnju.");
  }
  return currentUser;
}
