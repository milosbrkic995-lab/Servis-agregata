import Link from "next/link";
import { desc } from "drizzle-orm";
import { ArrowUpRight, Building2, Mail, MapPin, Phone, UserRoundPlus } from "lucide-react";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { createClientAction, updateClientAction } from "../actions";

const statusMessages: Record<string, string> = {
  created: "Komitent je dodat u evidenciju. Može da se prijavi emailom i PIB-om.",
  updated: "Podaci o komitentu su sačuvani.",
  linked: "Nalog je povezan sa komitentom.",
  invalid: "Proveri naziv, ispravnu email adresu i PIB firme.",
  "duplicate-or-error": "Komitent sa tom email adresom možda već postoji. Proveri evidenciju i pokušaj ponovo.",
  "not-found": "Komitent nije pronađen.",
  "already-linked": "Komitent već ima povezan nalog.",
  "no-verified-account": "Nije pronađen registrovan nalog sa potvrđenom email adresom koja se poklapa sa komitentom.",
  "account-used": "Ovaj korisnički nalog je već povezan sa drugim komitentom.",
};

export default async function AdminClientsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const rows = await db.select().from(clients).orderBy(desc(clients.createdAt));

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Master panel</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Komitenti</h2>
        <p className="mt-2 text-sm text-muted-foreground">Unesi komitenta i njegov PIB. Pri prvoj prijavi koristiće email i PIB; pristup se automatski veže za ovaj karton.</p>
      </section>

      {status && statusMessages[status] ? <p role="status" className="rounded-md border border-border bg-muted/50 p-3 text-sm">{statusMessages[status]}</p> : null}

      <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserRoundPlus size={19} className="text-primary" />
          <div><h3 className="font-semibold">Dodaj komitenta</h3><p className="mt-1 text-xs text-muted-foreground">Unesi podatke koje će komitent koristiti za prijavu u portal.</p></div>
        </div>
        <form action={createClientAction} className="grid gap-3 sm:grid-cols-2">
          <Field name="name" label="Ime i prezime / naziv" required placeholder="Steva Stebanović" />
          <Field name="email" label="Email" type="email" required placeholder="steva@primer.rs" />
          <Field name="company" label="Firma" placeholder="Naziv firme (opciono)" />
          <Field name="phone" label="Telefon" placeholder="Telefon (opciono)" />
          <Field name="pib" label="PIB firme" required placeholder="PIB firme" />
          <Field name="address" label="Adresa / lokacija" placeholder="Adresa (opciono)" />
          <label className="grid gap-1.5 text-sm sm:col-span-2"><span className="font-medium">Napomene</span><textarea name="notes" rows={2} maxLength={2000} className="rounded-md border border-input bg-background px-3 py-2" placeholder="Interna napomena (opciono)" /></label>
          <div className="sm:col-span-2"><button className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90" type="submit">Sačuvaj komitenta</button></div>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold">Evidencija komitenata</h3><span className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">{rows.length} komitenata</span></div>
        {rows.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((client) => (
              <article key={client.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5">
                <Link href={`/admin/clients/${client.id}`} aria-label={`Otvori karton komitenta ${client.name}`} className="group -m-2 mb-2 block rounded-lg p-2 outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 text-primary"><Building2 size={20} /></span>
                      <div className="min-w-0"><h4 className="break-words font-semibold group-hover:text-primary">{client.name}</h4>{client.company ? <p className="mt-1 break-words text-sm text-muted-foreground">{client.company}</p> : null}</div>
                    </div>
                    <ArrowUpRight size={18} className="mt-1 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <span className="mt-3 inline-flex min-h-9 items-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">Otvori karton i agregate →</span>
                </Link>

                <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
                  <p className="flex items-start gap-2 break-all text-muted-foreground"><Mail size={15} className="mt-0.5 shrink-0" />{client.email}</p>
                  {client.phone ? <p className="flex items-start gap-2 text-muted-foreground"><Phone size={15} className="mt-0.5 shrink-0" />{client.phone}</p> : null}
                  {client.address ? <p className="flex items-start gap-2 text-muted-foreground"><MapPin size={15} className="mt-0.5 shrink-0" />{client.address}</p> : null}
                  <p><span className="rounded-md border border-border px-2 py-1 text-xs">{client.userId ? "Nalog je već povezan" : "Nalog će se otvoriti pri prvoj prijavi"}</span></p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Komitent se prijavljuje emailom i PIB-om unetim u ovaj karton. Videće samo agregate koji su mu dodeljeni.</p>
                </div>

                <details className="mt-4 rounded-md border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium">Izmeni podatke komitenta</summary>
                  <form action={updateClientAction} className="mt-3 grid gap-3">
                    <input type="hidden" name="clientId" value={client.id} />
                    <Field name="name" label="Ime / naziv" required defaultValue={client.name} />
                    <Field name="email" label="Email" type="email" required defaultValue={client.email} />
                    <Field name="company" label="Firma" defaultValue={client.company ?? ""} />
                    <Field name="phone" label="Telefon" defaultValue={client.phone ?? ""} />
                    <Field name="pib" label="PIB firme" required defaultValue={client.pib ?? ""} />
                    <Field name="address" label="Adresa" defaultValue={client.address ?? ""} />
                    <label className="grid gap-1.5 text-sm"><span className="font-medium">Napomene</span><textarea name="notes" rows={2} maxLength={2000} defaultValue={client.notes ?? ""} className="rounded-md border border-input bg-background px-3 py-2" /></label>
                    <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">Sačuvaj izmene</button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        ) : <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">Još nema komitenata. Unesi prvog komitenta u formularu iznad.</div>}
      </section>
    </div>
  );
}

function Field({ name, label, required, type = "text", placeholder, defaultValue }: { name: string; label: string; required?: boolean; type?: string; placeholder?: string; defaultValue?: string }) {
  return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}{required ? " *" : ""}</span><input className="min-h-10 rounded-md border border-input bg-background px-3" name={name} type={type} required={required} maxLength={254} placeholder={placeholder} defaultValue={defaultValue} /></label>;
}
