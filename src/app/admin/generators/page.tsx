import { asc, eq } from "drizzle-orm";
import { Zap } from "lucide-react";

import { db } from "@/db";
import { clients, generators } from "@/db/schema";
import { dateOnly } from "@/lib/generator-utils";
import { createGeneratorAction, updateGeneratorAction } from "../actions";

const statusMessages: Record<string, string> = {
  created: "Agregat je dodat.",
  updated: "Podaci o agregatu su sačuvani.",
  "not-found": "Agregat nije pronađen.",
  invalid: "Proveri obavezna polja, datum, snagu, interval i radne sate.",
  "invalid-client": "Izabrani komitent nije pronađen.",
};

export default async function AdminGeneratorsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const [clientRows, generatorRows] = await Promise.all([
    db.select({ id: clients.id, name: clients.name, email: clients.email }).from(clients).orderBy(asc(clients.name)),
    db.select({
  id: generators.id,
  name: generators.name,
  manufacturer: generators.manufacturer,
  model: generators.model,
  serialNumber: generators.serialNumber,
  powerValue: generators.powerValue,
  powerUnit: generators.powerUnit,
  location: generators.location,
  commissionedAt: generators.commissionedAt,
  intervalMonths: generators.intervalMonths,
  currentHours: generators.currentHours,
  clientId: generators.clientId,
  clientName: clients.name,
})
  .from(generators)
  .leftJoin(clients, eq(generators.clientId, clients.id))
  .orderBy(asc(generators.name)),
  ]);
  return (
    <div className="space-y-6">
      <section><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Master panel</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Registar agregata</h2><p className="mt-2 text-sm text-muted-foreground">Ti unosiš agregate. Izbor komitenta povezuje mašinu sa njegovim nalogom; „Vlasništvo J&amp;B POWER” ostavlja agregat van portala komitenata.</p></section>
      {status && statusMessages[status] ? <p role="status" className="rounded-md border border-border bg-muted/50 p-3 text-sm">{statusMessages[status]}</p> : null}
      <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2"><Zap size={19} className="text-primary"/><div><h3 className="font-semibold">Dodaj agregat</h3><p className="mt-1 text-xs text-muted-foreground">Ova početna forma vodi osnovne podatke i kalendarski interval servisa.</p></div></div>
        <form action={createGeneratorAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field name="name" label="Naziv agregata" required placeholder="Agregat 1" />
          <Field name="manufacturer" label="Proizvođač" required placeholder="Perkins" />
          <Field name="model" label="Model" required placeholder="Model motora / agregata" />
          <Field name="serialNumber" label="Serijski broj" required placeholder="Serijski broj" />
          <Field name="powerValue" label="Snaga" required type="number" step="0.01" placeholder="100" />
          <label className="grid gap-1.5 text-sm"><span className="font-medium">Jedinica snage *</span><select name="powerUnit" required className="min-h-10 rounded-md border border-input bg-background px-3"><option value="kVA">kVA</option><option value="kW">kW</option></select></label>
          <Field name="location" label="Lokacija" required placeholder="Lokacija agregata" />
          <Field name="commissionedAt" label="Pušten u rad" required type="date" defaultValue={dateOnly()} />
          <Field name="intervalMonths" label="Servisni interval (meseci)" required type="number" step="1" defaultValue="6" />
          <Field name="currentHours" label="Trenutni radni sati" required type="number" step="0.1" defaultValue="0" />
          <label className="grid gap-1.5 text-sm sm:col-span-2 lg:col-span-3"><span className="font-medium">Dodeli komitentu</span><select name="clientId" className="min-h-10 rounded-md border border-input bg-background px-3"><option value="">Vlasništvo J&amp;B POWER / bez komitenta</option>{clientRows.map((client) => <option key={client.id} value={client.id}>{client.name} — {client.email}</option>)}</select></label>
          <div className="sm:col-span-2 lg:col-span-3"><button className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90" type="submit">Sačuvaj agregat</button></div>
        </form>
      </section>
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4"><h3 className="font-semibold">Svi agregati ({generatorRows.length})</h3></div>
        {generatorRows.length ? <div className="divide-y divide-border">{generatorRows.map((g) => <article key={g.id} className="p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><h4 className="font-semibold">{g.name}</h4><p className="mt-1 text-sm text-muted-foreground">{g.manufacturer} {g.model} · SN: {g.serialNumber}</p><p className="mt-1 text-xs text-muted-foreground">{g.powerValue} {g.powerUnit} · {g.location}</p></div><div className="text-left sm:text-right"><p className="text-sm font-medium">{g.clientName ?? "J&B POWER — sopstveni agregat"}</p><p className="mt-1 text-xs text-muted-foreground">{g.clientId ? "Vidljiv dodeljenom komitentu" : "Nije prikazan komitentima"}</p></div></div><details className="mt-4 rounded-md border border-border p-3"><summary className="cursor-pointer text-sm font-medium">Izmeni agregat / dodelu</summary><form action={updateGeneratorAction} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><input type="hidden" name="generatorId" value={g.id}/><Field name="name" label="Naziv agregata" required defaultValue={g.name}/><Field name="manufacturer" label="Proizvođač" required defaultValue={g.manufacturer}/><Field name="model" label="Model" required defaultValue={g.model}/><Field name="serialNumber" label="Serijski broj" required defaultValue={g.serialNumber}/><Field name="powerValue" label="Snaga" required type="number" step="0.01" defaultValue={String(g.powerValue)}/><label className="grid gap-1.5 text-sm"><span className="font-medium">Jedinica snage *</span><select name="powerUnit" required defaultValue={g.powerUnit} className="min-h-10 rounded-md border border-input bg-background px-3"><option value="kVA">kVA</option><option value="kW">kW</option></select></label><Field name="location" label="Lokacija" required defaultValue={g.location}/><Field name="commissionedAt" label="Pušten u rad" required type="date" defaultValue={g.commissionedAt}/><Field name="intervalMonths" label="Servisni interval (meseci)" required type="number" step="1" defaultValue={String(g.intervalMonths ?? 6)}/><Field name="currentHours" label="Trenutni radni sati" required type="number" step="0.1" defaultValue={String(g.currentHours)}/><label className="grid gap-1.5 text-sm sm:col-span-2 lg:col-span-3"><span className="font-medium">Dodeli komitentu</span><select name="clientId" defaultValue={g.clientId ?? ""} className="min-h-10 rounded-md border border-input bg-background px-3"><option value="">Vlasništvo J&amp;B POWER / bez komitenta</option>{clientRows.map((client) => <option key={client.id} value={client.id}>{client.name} — {client.email}</option>)}</select></label><div className="sm:col-span-2 lg:col-span-3"><button className="inline-flex min-h-10 items-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground" type="submit">Sačuvaj izmene</button></div></form></details></article>)}</div> : <div className="p-8 text-center text-sm text-muted-foreground">Još nema agregata u registru.</div>}
      </section>
    </div>
  );
}

function Field({ name, label, required, type = "text", placeholder, step, defaultValue }: { name: string; label: string; required?: boolean; type?: string; placeholder?: string; step?: string; defaultValue?: string }) {
  return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}{required ? " *" : ""}</span><input className="min-h-10 rounded-md border border-input bg-background px-3" name={name} type={type} step={step} required={required} placeholder={placeholder} defaultValue={defaultValue}/></label>;
}
