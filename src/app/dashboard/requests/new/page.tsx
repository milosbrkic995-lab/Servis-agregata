import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft, Send } from "lucide-react";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { clients, generators } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { createServiceRequestAction } from "../actions";

type Props = { searchParams: Promise<{ generatorId?: string; status?: string }> };
export default async function NewServiceRequestPage({ searchParams }: Props) {
  const { generatorId, status } = await searchParams;
  const currentUser = await requireUser();
  const clientRows = await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, currentUser.id)).limit(1);
  const client = clientRows[0];
  if (!client) redirect("/dashboard/requests?status=no-client");
  const rows = await db.select({ id: generators.id, name: generators.name, manufacturer: generators.manufacturer, model: generators.model, serialNumber: generators.serialNumber, location: generators.location })
    .from(generators).where(eq(generators.clientId, client.id)).orderBy(asc(generators.name));

  return <div className="mx-auto max-w-3xl space-y-6">
    <Link href="/dashboard/requests" className="inline-flex min-h-9 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Moji zahtevi</Link>
    <section><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Novi servisni zahtev</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Zatraži servis</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Izaberi agregat i opiši šta se dešava. Servisni tim će videti zahtev i odgovoriti kroz ovaj portal.</p></section>
    {status === "invalid" ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Popuni sva obavezna polja. Opis treba da ima najmanje 8 znakova.</p> : null}
    {status === "generator-not-found" ? <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Izabrani agregat nije pronađen u tvojoj evidenciji.</p> : null}
    {rows.length ? <form action={createServiceRequestAction} className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-6">
      <label className="grid gap-1.5 text-sm"><span className="font-medium">Agregat *</span><select required name="generatorId" defaultValue={generatorId ?? ""} className="min-h-11 rounded-md border border-input bg-background px-3"><option value="" disabled>Izaberi agregat</option>{rows.map((g) => <option key={g.id} value={g.id}>{g.name} · {g.manufacturer} {g.model} · SN {g.serialNumber}</option>)}</select></label>
      <label className="grid gap-1.5 text-sm"><span className="font-medium">Naslov zahteva *</span><input name="subject" required minLength={3} maxLength={180} placeholder="Npr. Agregat ne startuje" className="min-h-11 rounded-md border border-input bg-background px-3"/></label>
      <label className="grid gap-1.5 text-sm"><span className="font-medium">Opis problema / potreban servis *</span><textarea name="description" required minLength={8} maxLength={4000} rows={5} placeholder="Opiši simptome, alarm na kontroleru, kada je problem počeo i druge važne detalje..." className="rounded-md border border-input bg-background px-3 py-2"/></label>
      <fieldset className="grid gap-2 text-sm"><legend className="mb-1 font-medium">Prioritet *</legend><label className="flex items-start gap-2 rounded-md border border-border p-3"><input type="radio" name="urgency" value="normal" defaultChecked className="mt-1"/><span><strong>Redovno</strong><span className="mt-0.5 block text-xs text-muted-foreground">Planirani servis ili problem koji ne zaustavlja rad.</span></span></label><label className="flex items-start gap-2 rounded-md border border-destructive/30 p-3"><input type="radio" name="urgency" value="urgent" className="mt-1"/><span><strong className="text-destructive">Hitno</strong><span className="mt-0.5 block text-xs text-muted-foreground">Agregat je stao ili postoji kvar koji zahteva brzu reakciju.</span></span></label></fieldset>
      <p className="text-xs leading-5 text-muted-foreground">Slanje zahteva ne znači da je termin servisa potvrđen. Termin će biti potvrđen kroz odgovor servisnog tima.</p>
      <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"><Send size={16}/> Pošalji zahtev</button>
    </form> : <div className="rounded-xl border border-dashed border-border p-8 text-center"><p className="font-semibold">Nema agregata povezanih sa nalogom</p><p className="mt-2 text-sm text-muted-foreground">Kontaktiraj J&amp;B POWER da proveri dodelu opreme.</p></div>}
  </div>;
}
