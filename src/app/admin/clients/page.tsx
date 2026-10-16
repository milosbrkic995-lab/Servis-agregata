import { desc } from "drizzle-orm";
import { Mail, UserCheck, UserRoundPlus } from "lucide-react";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { createClientAction, linkClientAccountAction, updateClientAction } from "../actions";

const statusMessages: Record<string, string> = {
  created: "Komitent je dodat u evidenciju.",
  updated: "Podaci o komitentu su sačuvani.",
  linked: "Nalog je povezan sa komitentom.",
  invalid: "Proveri ime i ispravnu email adresu.",
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
      <section><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Master panel</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Komitenti</h2><p className="mt-2 text-sm text-muted-foreground">Dodaj komitente i kasnije poveži naloge čije su email adrese potvrđene.</p></section>
      {status && statusMessages[status] ? <p role="status" className="rounded-md border border-border bg-muted/50 p-3 text-sm">{statusMessages[status]}</p> : null}
      <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2"><UserRoundPlus size={19} className="text-primary"/><div><h3 className="font-semibold">Dodaj komitenta</h3><p className="mt-1 text-xs text-muted-foreground">Email adresa se koristi za povezivanje sa verifikovanim korisničkim nalogom.</p></div></div>
        <form action={createClientAction} className="grid gap-3 sm:grid-cols-2">
          <Field name="name" label="Ime i prezime / naziv" required placeholder="Steva Stebanović" />
          <Field name="email" label="Email" type="email" required placeholder="steva@primer.rs" />
          <Field name="company" label="Firma" placeholder="Naziv firme (opciono)" />
          <Field name="phone" label="Telefon" placeholder="Telefon (opciono)" />
          <Field name="pib" label="PIB" placeholder="PIB (opciono)" />
          <Field name="address" label="Adresa / lokacija" placeholder="Adresa (opciono)" />
          <label className="grid gap-1.5 text-sm sm:col-span-2"><span className="font-medium">Napomene</span><textarea name="notes" rows={2} maxLength={2000} className="rounded-md border border-input bg-background px-3 py-2" placeholder="Interna napomena (opciono)" /></label>
          <div className="sm:col-span-2"><button className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90" type="submit">Sačuvaj komitenta</button></div>
        </form>
      </section>
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4"><h3 className="font-semibold">Evidencija komitenata ({rows.length})</h3></div>
        {rows.length ? <div className="divide-y divide-border">{rows.map((client) => <article key={client.id} className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h4 className="font-semibold">{client.name}</h4>{client.company ? <p className="mt-1 text-sm text-muted-foreground">{client.company}</p> : null}<p className="mt-2 flex items-center gap-2 break-all text-sm text-muted-foreground"><Mail size={14}/>{client.email}</p><div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">{client.phone ? <span>{client.phone}</span> : null}{client.pib ? <span>PIB: {client.pib}</span> : null}{client.address ? <span>{client.address}</span> : null}</div></div><span className="rounded-md border border-border px-2 py-1 text-xs">{client.userId ? "Nalog povezan" : "Bez korisničkog naloga"}</span></div>
          <details className="mt-4 rounded-md border border-border p-3"><summary className="cursor-pointer text-sm font-medium">Izmeni podatke komitenta</summary><form action={updateClientAction} className="mt-3 grid gap-3 sm:grid-cols-2"><input type="hidden" name="clientId" value={client.id}/><Field name="name" label="Ime / naziv" required defaultValue={client.name}/><Field name="email" label="Email" type="email" required defaultValue={client.email}/><Field name="company" label="Firma" defaultValue={client.company ?? ""}/><Field name="phone" label="Telefon" defaultValue={client.phone ?? ""}/><Field name="pib" label="PIB" defaultValue={client.pib ?? ""}/><Field name="address" label="Adresa" defaultValue={client.address ?? ""}/><label className="grid gap-1.5 text-sm sm:col-span-2"><span className="font-medium">Napomene</span><textarea name="notes" rows={2} maxLength={2000} defaultValue={client.notes ?? ""} className="rounded-md border border-input bg-background px-3 py-2"/></label><div className="sm:col-span-2"><button type="submit" className="inline-flex min-h-10 items-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">Sačuvaj izmene</button></div></form></details>
          {!client.userId ? <form action={linkClientAccountAction} className="mt-4 flex flex-wrap items-center gap-2"><input type="hidden" name="clientId" value={client.id}/><button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"><UserCheck size={15}/> Poveži verifikovan nalog</button><span className="text-xs text-muted-foreground">Korisnik mora prethodno da se registruje i potvrdi email.</span></form> : null}
        </article>)}</div> : <div className="p-8 text-center text-sm text-muted-foreground">Još nema komitenata. Unesi prvog iz formulara iznad.</div>}
      </section>
    </div>
  );
}

function Field({ name, label, required, type = "text", placeholder, defaultValue }: { name: string; label: string; required?: boolean; type?: string; placeholder?: string; defaultValue?: string }) {
  return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}{required ? " *" : ""}</span><input className="min-h-10 rounded-md border border-input bg-background px-3" name={name} type={type} required={required} maxLength={254} placeholder={placeholder} defaultValue={defaultValue}/></label>;
}
