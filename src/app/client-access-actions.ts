"use server";

import { createHash, randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { account as authAccount, clients, session, user, verification } from "@/db/schema";
import { requireUser } from "@/lib/auth";

function normalizeEmail(input: string): string {
  return String(input ?? "").trim().toLowerCase();
}

function normalizePib(input: string): string {
  return String(input ?? "").replace(/\D/g, "");
}

function validEmail(input: string): boolean {
  return input.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
}

async function getAttemptKey(email: string) {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-real-ip")
    ?? requestHeaders.get("cf-connecting-ip")
    ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  const digest = createHash("sha256").update(`${email}|${ip}`).digest("hex");
  const identifier = `client-pib-login:${digest}`;
  const rows = await db.select().from(verification)
    .where(eq(verification.identifier, identifier))
    .orderBy(desc(verification.updatedAt))
    .limit(1);
  const row = rows[0];
  const now = new Date();
  const isActive = Boolean(row && row.expiresAt.getTime() > now.getTime());
  return { identifier, row, isActive, blocked: Boolean(isActive && Number(row?.value ?? "0") >= 5), now };
}

async function recordFailedAttempt(state: Awaited<ReturnType<typeof getAttemptKey>>) {
  const expiresAt = new Date(state.now.getTime() + 15 * 60 * 1000);
  if (state.row) {
    await db.update(verification).set({
      value: state.isActive ? String(Number(state.row.value || "0") + 1) : "1",
      expiresAt,
      updatedAt: state.now,
    }).where(eq(verification.id, state.row.id));
  } else {
    await db.insert(verification).values({
      id: randomUUID(),
      identifier: state.identifier,
      value: "1",
      expiresAt,
    });
  }
}

async function rejectAttempt(
  state: Awaited<ReturnType<typeof getAttemptKey>>,
  message = "Email i PIB ne odgovaraju nijednom kartonu komitenta. Proverite podatke u administratorskom panelu.",
) {
  if (!state.blocked) await recordFailedAttempt(state);
  return { ok: false as const, message };
}

/**
 * Check that the email + PIB pair was entered by the administrator in the client
 * register. Failed attempts are rate-limited per email/IP for 15 minutes.
 */
export async function validateClientPibAccess(emailInput: string, pibInput: string) {
  const email = normalizeEmail(emailInput);
  const pib = normalizePib(pibInput);
  if (!validEmail(email) || !/^\d{9}$/.test(pib)) {
    return { ok: false as const, message: "Unesite ispravnu email adresu i PIB od tačno 9 cifara." };
  }

  const attempt = await getAttemptKey(email);
  if (attempt.blocked) {
    return {
      ok: false as const,
      message: "Previše neuspešnih pokušaja prijave. Sačekajte 15 minuta pre ponovnog pokušaja.",
    };
  }

  const matchingClients = await db
    .select({ id: clients.id, name: clients.name, company: clients.company, userId: clients.userId })
    .from(clients)
    .where(and(
      sql`lower(${clients.email}) = ${email}`,
      sql`regexp_replace(coalesce(${clients.pib}, ''), '[^0-9]', '', 'g') = ${pib}`,
    ))
    .limit(1);
  const client = matchingClients[0];
  if (!client) return rejectAttempt(attempt);

  const accounts = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(sql`lower(${user.email}) = ${email}`)
    .limit(1);
  const account = accounts[0];

  // Never let the client screen be used to log in as an administrator.
  if (account?.role === "admin") {
    return rejectAttempt(attempt, "Ovaj email pripada administratorskom nalogu. Izaberite prijavu administratora.");
  }
  if (client.userId && client.userId !== account?.id) {
    return rejectAttempt(attempt, "Ovaj karton je već povezan sa drugim korisničkim nalogom. Administrator treba da proveri povezivanje.");
  }

  if (account) {
    const otherProfiles = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.userId, account.id))
      .limit(1);
    if (otherProfiles[0] && otherProfiles[0].id !== client.id) {
      return rejectAttempt(attempt, "Ovaj korisnički nalog je već povezan sa drugim kartonom komitenta.");
    }

    // The correct email + PIB pair is the agreed client credential. For accounts
    // created before this login method existed, reset/add the credential password
    // to the PIB so legacy client accounts can use the new flow too.
    const credentialRows = await db.select({ id: authAccount.id, password: authAccount.password })
      .from(authAccount)
      .where(and(eq(authAccount.userId, account.id), eq(authAccount.providerId, "credential")))
      .limit(1);
    const existingCredential = credentialRows[0];
    let credentialAlreadyMatches = false;
    if (existingCredential?.password) {
      try {
        credentialAlreadyMatches = await verifyPassword({ hash: existingCredential.password, password: pib });
      } catch {
        credentialAlreadyMatches = false;
      }
    }
    if (!credentialAlreadyMatches) {
      const hashedPib = await hashPassword(pib);
      if (existingCredential) {
        await db.update(authAccount).set({ password: hashedPib, updatedAt: attempt.now })
          .where(eq(authAccount.id, existingCredential.id));
      } else {
        await db.insert(authAccount).values({
          id: randomUUID(),
          userId: account.id,
          accountId: account.id,
          providerId: "credential",
          password: hashedPib,
        });
      }
      // Revoke old sessions only if the credential had to be reset from the verified pair.
      await db.delete(session).where(eq(session.userId, account.id));
    }
  }

  if (attempt.row) {
    await db.delete(verification).where(eq(verification.identifier, attempt.identifier));
  }
  return {
    ok: true as const,
    name: client.company || client.name,
    accountExists: Boolean(account),
  };
}

/** After Better Auth signs a client in, link that account to the pre-entered record. */
export async function linkClientPibAccess(pibInput: string) {
  const currentUser = await requireUser();
  const roleRows = await db.select({ role: user.role }).from(user).where(eq(user.id, currentUser.id)).limit(1);
  if (roleRows[0]?.role === "admin") {
    return { ok: false as const, message: "Administratorski nalog ne može se povezati kao komitent." };
  }

  const email = normalizeEmail(currentUser.email);
  const pib = normalizePib(pibInput);
  if (!validEmail(email) || !/^\d{9}$/.test(pib)) {
    return { ok: false as const, message: "Email ili PIB nisu ispravni." };
  }

  const matchingClients = await db
    .select({ id: clients.id, userId: clients.userId })
    .from(clients)
    .where(and(
      sql`lower(${clients.email}) = ${email}`,
      sql`regexp_replace(coalesce(${clients.pib}, ''), '[^0-9]', '', 'g') = ${pib}`,
    ))
    .limit(1);
  const client = matchingClients[0];
  if (!client) return { ok: false as const, message: "Podaci se ne poklapaju sa kartonom komitenta." };
  if (client.userId && client.userId !== currentUser.id) {
    return { ok: false as const, message: "Pristup ovom kartonu je već dodeljen drugom nalogu." };
  }

  const existingProfiles = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.userId, currentUser.id))
    .limit(1);
  if (existingProfiles[0] && existingProfiles[0].id !== client.id) {
    return { ok: false as const, message: "Ovaj nalog je već povezan sa drugim komitentom." };
  }

  if (!client.userId) {
    await db.update(clients)
      .set({ userId: currentUser.id, updatedAt: new Date() })
      .where(eq(clients.id, client.id));
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${client.id}`);
  return { ok: true as const };
}
