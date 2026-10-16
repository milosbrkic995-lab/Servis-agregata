import { asc, eq } from "drizzle-orm";
import { Zap } from "lucide-react";

import { db } from "@/db";
import { clients, generators } from "@/db/schema";
import { dateOnly } from "@/lib/generator-utils";
import { createGeneratorAction, updateGeneratorAction } from "../actions";
import { ClientSelectWithPreview } from "./client-select";

const statusMessages: Record<string, string> = {
  created: "Agregat je dodat.",
  updated: "Podaci o agregatu su sačuvani.",
  "not-found": "Agregat nije pronađen.",
  invalid: "Proveri obavezna polja, datum, snagu, interval, radne sate, režim rada i godinu proizvodnje.",
  "invalid-client": "Izabrani komitent nije pronađen.",
};

const modeLabels: Record<string, string> = {
  auto: "Auto mod",
  manual: "Ručni mod",
  stopped: "Zastoj",
};

export default async function AdminGeneratorsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const [clientRows, generatorRows] = await Promise.all([
    db.select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      company: clients.company,
      phone: clients.phone,
      pib: clients.pib,
      address: clients.address,
    }).from(clients).orderBy(asc(clients.name)),
    db.select({
      id: generators.id,
      name: generators.name,
      manufacturer: generators.manufacturer,
      model: generators.model,
      serialNumber: generators.serialNumber,
      controller: generators.controller,
      generatorSerialNumber: generators.generatorSerialNumber,
      operatingMode: generators.operatingMode,
      manufacturingYear: generators.manufacturingYear,
      powerValue: generators.powerValue,
      powerUnit: generators.powerUnit,
      location: generators.location,
      commissionedAt: generators.commissionedAt,
      intervalMonths: generators.intervalMonths,
      currentHours: generators.currentHours,
      clientId: generators.clientId,
      clientName: clients.name,
      clientCompany: clients.company,
    })
      .from(generators)
      .leftJoin(clients, eq(generators.clientId, clients.id))
      .orderBy(asc(generators.name)),
  ]);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Master panel</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Registar agregata</h2>
        <p className="mt-2 text-sm text-muted-foreground">Unesi podatke sa kartona agregata. Izbor komitenta automatski prikazuje njegove podatke, a lokacija opreme i tehnički podaci čuvaju se za svaki agregat posebno.</p>
      </section>

      {status && statusMessages[status] ? <p role="status" className="rounded-md border border-border bg-muted/50 p-3 text-sm">{statusMessages[status]}</p> : null}

      <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Zap size={19} className="text-primary" />
          <div><h3 className="font-semibold">Dodaj agregat</h3><p className="mt-1 text-xs text-muted-foreground">Podaci o komitentu se preuzimaju iz njegovog kartona.</p></div>
        </div>
        <form action={createGeneratorAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ClientSelectWithPreview clients={clientRows} />

          <div className="sm:col-span-2 lg:col-span-3"><h4 className="border-b border-border pb-2 text-sm font-semibold">Podaci o opremi</h4></div>
          <Field name="manufacturer" label="Proizvođač" required placeholder="Npr. Perkins" />
          <Field name="name" label="Generator" required placeholder="Npr. Stamford / Leroy-Somer" />
          <Field name="controller" label="Kontroler" placeholder="Npr. Deep Sea / ComAp" />
          <Field name="currentHours" label="Br. rad. sati" required type="number" step="0.1" defaultValue="0" />
          <Field name="location" label="Lokacija opreme" required placeholder="Gde se agregat nalazi" />
          <Field name="generatorSerialNumber" label="Ser. br. (agregata)" placeholder="Serijski broj agregata" />

          <div className="sm:col-span-2 lg:col-span-3"><h4 className="border-b border-border pb-2 text-sm font-semibold">Model i SN motora</h4></div>
          <Field name="model" label="Model motora" required placeholder="Model sa pločice motora" />
          <Field name="serialNumber" label="Serijski broj motora" required placeholder="SN motora sa pločice" />
          <Field name="manufacturingYear" label="God. proizvodnje" type="number" min="1900" max="2100" step="1" placeholder="Npr. 2022" />
          <label className="grid gap-1.5 text-sm"><span className="font-medium">Agregat ostavljen</span><select name="operatingMode" defaultValue="auto" required className="min-h-10 rounded-md border border-input bg-background px-3"><option value="auto">Auto mod</option><option value="manual">Ručni mod</option><option value="stopped">Zastoj</option></select></label>

          <div className="sm:col-span-2 lg:col-span-3"><h4 className="border-b border-border pb-2 text-sm font-semibold">Podaci za servis</h4></div>
          <Field name="powerValue" label="Snaga" required type="number" step="0.01" placeholder="100" />
          <label className="grid gap-1.5 text-sm"><span className="font-medium">Jedinica snage *</span><select name="powerUnit" required className="min-h-10 rounded-md border border-input bg-background px-3"><option value="kVA">kVA</option><option value="kW">kW</option></select></label>
          <Field name="commissionedAt" label="Pušten u rad" required type="date" defaultValue={dateOnly()} />
          <Field name="intervalMonths" label="Servisni interval (meseci)" required type="number" step="1" defaultValue="6" />

          <div className="sm:col-span-2 lg:col-span-3"><button className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90" type="submit">Sačuvaj agregat</button></div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4"><h3 className="font-semibold">Svi agregati ({generatorRows.length})</h3></div>
        {generatorRows.length ? <div className="divide-y divide-border">{generatorRows.map((g) => (
          <article key={g.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="font-semibold">{g.name}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{g.manufacturer} · motor: {g.model} · SN motora: {g.serialNumber}</p>
                <p className="mt-1 text-xs text-muted-foreground">SN agregata: {g.generatorSerialNumber || "Nije unet"} · {g.currentHours.toLocaleString("sr-Latn-RS")} rad. sati · {g.location}</p>
              </div>
              <div className="text-left sm:text-right"><p className="text-sm font-medium">{g.clientCompany || g.clientName || "J&B POWER — sopstveni agregat"}</p><p className="mt-1 text-xs text-muted-foreground">{modeLabels[g.operatingMode] ?? "Nije podešeno"}{g.manufacturingYear ? ` · godište ${g.manufacturingYear}` : ""}</p></div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Kontroler: {g.controller || "Nije unet"}</p>
            <details className="mt-4 rounded-md border border-border p-3">
              <summary className="cursor-pointer text-sm font-medium">Izmeni agregat / dodelu</summary>
              <form action={updateGeneratorAction} className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <input type="hidden" name="generatorId" value={g.id} />
                <ClientSelectWithPreview clients={clientRows} defaultValue={g.clientId ?? ""} />

                <div className="sm:col-span-2 lg:col-span-3"><h4 className="border-b border-border pb-2 text-sm font-semibold">Podaci o opremi</h4></div>
                <Field name="manufacturer" label="Proizvođač" required defaultValue={g.manufacturer} />
                <Field name="name" label="Generator" required defaultValue={g.name} />
                <Field name="controller" label="Kontroler" defaultValue={g.controller ?? ""} />
                <Field name="currentHours" label="Br. rad. sati" required type="number" step="0.1" defaultValue={String(g.currentHours)} />
                <Field name="location" label="Lokacija opreme" required defaultValue={g.location} />
                <Field name="generatorSerialNumber" label="Ser. br. (agregata)" defaultValue={g.generatorSerialNumber ?? ""} />

                <div className="sm:col-span-2 lg:col-span-3"><h4 className="border-b border-border pb-2 text-sm font-semibold">Model i SN motora</h4></div>
                <Field name="model" label="Model motora" required defaultValue={g.model} />
                <Field name="serialNumber" label="Serijski broj motora" required defaultValue={g.serialNumber} />
                <Field name="manufacturingYear" label="God. proizvodnje" type="number" min="1900" max="2100" step="1" defaultValue={g.manufacturingYear ? String(g.manufacturingYear) : ""} />
                <label className="grid gap-1.5 text-sm"><span className="font-medium">Agregat ostavljen</span><select name="operatingMode" defaultValue={g.operatingMode ?? "auto"} required className="min-h-10 rounded-md border border-input bg-background px-3"><option value="auto">Auto mod</option><option value="manual">Ručni mod</option><option value="stopped">Zastoj</option></select></label>

                <div className="sm:col-span-2 lg:col-span-3"><h4 className="border-b border-border pb-2 text-sm font-semibold">Podaci za servis</h4></div>
                <Field name="powerValue" label="Snaga" required type="number" step="0.01" defaultValue={String(g.powerValue)} />
                <label className="grid gap-1.5 text-sm"><span className="font-medium">Jedinica snage *</span><select name="powerUnit" required defaultValue={g.powerUnit} className="min-h-10 rounded-md border border-input bg-background px-3"><option value="kVA">kVA</option><option value="kW">kW</option></select></label>
                <Field name="commissionedAt" label="Pušten u rad" required type="date" defaultValue={g.commissionedAt} />
                <Field name="intervalMonths" label="Servisni interval (meseci)" required type="number" step="1" defaultValue={String(g.intervalMonths ?? 6)} />
                <div className="sm:col-span-2 lg:col-span-3"><button className="inline-flex min-h-10 items-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground" type="submit">Sačuvaj izmene</button></div>
              </form>
            </details>
          </article>
        ))}</div> : <div className="p-8 text-center text-sm text-muted-foreground">Još nema agregata u registru.</div>}
      </section>
    </div>
  );
}

function Field({ name, label, required, type = "text", placeholder, step, min, max, defaultValue }: { name: string; label: string; required?: boolean; type?: string; placeholder?: string; step?: string; min?: string; max?: string; defaultValue?: string }) {
  return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}{required ? " *" : ""}</span><input className="min-h-10 rounded-md border border-input bg-background px-3" name={name} type={type} step={step} min={min} max={max} required={required} placeholder={placeholder} defaultValue={defaultValue} /></label>;
}
