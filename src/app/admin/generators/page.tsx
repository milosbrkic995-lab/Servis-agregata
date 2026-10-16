import { asc, eq } from "drizzle-orm";
import { Plus } from "lucide-react";

import { db } from "@/db";
import { clients, generators } from "@/db/schema";
import { dateOnly } from "@/lib/generator-utils";
import { createGeneratorAction, updateGeneratorAction } from "../actions";
import { ClientSelectWithPreview } from "./client-select";

const statusMessages: Record<string, string> = {
  created: "Agregat je dodat.",
  updated: "Podaci o agregatu su sačuvani.",
  "not-found": "Agregat nije pronađen.",
  invalid:
    "Proveri obavezna polja, datum, snagu, interval, radne sate, režim rada i godinu proizvodnje.",
  "invalid-client": "Izabrani komitent nije pronađen.",
};

const modeLabels: Record<string, string> = {
  auto: "Auto mod",
  manual: "Ručni mod",
  stopped: "Zastoj",
};

export default async function AdminGeneratorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; action?: string }>;
}) {
  const { status, action } = await searchParams;

  const [clientRows, generatorRows] = await Promise.all([
    db
      .select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        company: clients.company,
        phone: clients.phone,
        pib: clients.pib,
        address: clients.address,
      })
      .from(clients)
      .orderBy(asc(clients.name)),
    db
      .select({
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

  const unissuedRows = generatorRows.filter(
    (generator) => !generator.clientId,
  );
  const issuedCount = generatorRows.length - unissuedRows.length;
  const shouldOpenForm =
    action === "add" ||
    status === "invalid" ||
    status === "invalid-client";

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Master panel
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          Registar agregata
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Evidencija agregata, tehničkih podataka i zaduženja komitenata.
        </p>
      </section>

      {status && statusMessages[status] ? (
        <p
          role="status"
          className="rounded-md border border-border bg-muted/50 p-3 text-sm"
        >
          {statusMessages[status]}
        </p>
      ) : null}

      <section
        className="grid gap-3 sm:grid-cols-3"
        aria-label="Pregled zaliha agregata"
      >
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Ukupno u registru</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {generatorRows.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            Dodeljeno komitentima
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {issuedCount}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Neizdati agregati</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {unissuedRows.length}
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">
              Neizdati agregati ({unissuedRows.length})
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ovi agregati nemaju dodeljenog komitenta. Mogu da ostanu u
              evidenciji dok ih ne izdaš.
            </p>
          </div>
          <span className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
            Nije dodeljeno
          </span>
        </div>

        {unissuedRows.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {unissuedRows.map((g) => (
              <article
                key={g.id}
                className="min-w-0 rounded-lg border border-border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="break-words font-semibold">{g.name}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {g.manufacturer} · motor: {g.model} · SN motora: {g.serialNumber}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      SN agregata: {g.generatorSerialNumber || "Nije unet"} · {g.currentHours.toLocaleString("sr-Latn-RS")} rad. sati
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Lokacija: {g.location} · Kontroler: {g.controller || "Nije unet"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-border px-2 py-1 text-xs font-semibold">
                    NEIZDAT
                  </span>
                </div>

                <form
                  action={updateGeneratorAction}
                  className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                >
                  <input type="hidden" name="generatorId" value={g.id} />
                  <input type="hidden" name="name" value={g.name} />
                  <input type="hidden" name="manufacturer" value={g.manufacturer} />
                  <input type="hidden" name="model" value={g.model} />
                  <input type="hidden" name="serialNumber" value={g.serialNumber} />
                  <input type="hidden" name="controller" value={g.controller ?? ""} />
                  <input type="hidden" name="generatorSerialNumber" value={g.generatorSerialNumber ?? ""} />
                  <input type="hidden" name="operatingMode" value={g.operatingMode ?? "auto"} />
                  <input
                    type="hidden"
                    name="manufacturingYear"
                    value={g.manufacturingYear ? String(g.manufacturingYear) : ""}
                  />
                  <input type="hidden" name="powerValue" value={String(g.powerValue)} />
                  <input type="hidden" name="powerUnit" value={g.powerUnit} />
                  <input type="hidden" name="location" value={g.location} />
                  <input type="hidden" name="commissionedAt" value={g.commissionedAt} />
                  <input type="hidden" name="intervalMonths" value={String(g.intervalMonths ?? 6)} />
                  <input type="hidden" name="currentHours" value={String(g.currentHours)} />

                  <label className="grid min-w-0 gap-1.5 text-sm">
                    <span className="font-medium">Dodeli komitentu</span>
                    <select
                      name="clientId"
                      required
                      defaultValue=""
                      className="min-h-10 rounded-md border border-input bg-background px-3"
                    >
                      <option value="" disabled>
                        Izaberi komitenta
                      </option>
                      {clientRows.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.company || client.name} — {client.email}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                  >
                    Izdaj agregat
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
            Svi agregati u registru već su dodeljeni komitentima.
          </div>
        )}
      </section>

      <details
        id="dodaj-agregat"
        open={shouldOpenForm}
        className="rounded-lg border border-border bg-card"
      >
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Plus size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Dodaj agregat</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Otvori formu kada želiš da uneseš novi agregat.
            </span>
          </span>
          <span className="text-sm font-medium text-primary">Otvori formu</span>
        </summary>

        <div className="border-t border-border p-4 sm:p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Podaci o komitentu se preuzimaju iz njegovog kartona.
          </p>
          <form
            action={createGeneratorAction}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <ClientSelectWithPreview clients={clientRows} />

            <div className="sm:col-span-2 lg:col-span-3">
              <h4 className="border-b border-border pb-2 text-sm font-semibold">
                Podaci o opremi
              </h4>
            </div>
            <Field name="manufacturer" label="Proizvođač" required placeholder="Npr. Perkins" />
            <Field name="name" label="Generator" required placeholder="Npr. Stamford / Leroy-Somer" />
            <Field name="controller" label="Kontroler" placeholder="Npr. Deep Sea / ComAp" />
            <Field name="currentHours" label="Br. rad. sati" required type="number" step="0.1" defaultValue="0" />
            <Field name="location" label="Lokacija opreme" required placeholder="Gde se agregat nalazi" />
            <Field name="generatorSerialNumber" label="Ser. br. (agregata)" placeholder="Serijski broj agregata" />

            <div className="sm:col-span-2 lg:col-span-3">
              <h4 className="border-b border-border pb-2 text-sm font-semibold">
                Model i SN motora
              </h4>
            </div>
            <Field name="model" label="Model motora" required placeholder="Model sa pločice motora" />
            <Field name="serialNumber" label="Serijski broj motora" required placeholder="SN motora sa pločice" />
            <Field name="manufacturingYear" label="God. proizvodnje" type="number" min="1900" max="2100" step="1" placeholder="Npr. 2022" />

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Agregat ostavljen</span>
              <select
                name="operatingMode"
                defaultValue="auto"
                required
                className="min-h-10 rounded-md border border-input bg-background px-3"
              >
                <option value="auto">Auto mod</option>
                <option value="manual">Ručni mod</option>
                <option value="stopped">Zastoj</option>
              </select>
            </label>

            <div className="sm:col-span-2 lg:col-span-3">
              <h4 className="border-b border-border pb-2 text-sm font-semibold">
                Podaci za servis
              </h4>
            </div>
            <Field name="powerValue" label="Snaga" required type="number" step="0.01" placeholder="100" />

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Jedinica snage *</span>
              <select
                name="powerUnit"
                required
                className="min-h-10 rounded-md border border-input bg-background px-3"
              >
                <option value="kVA">kVA</option>
                <option value="kW">kW</option>
              </select>
            </label>

            <Field name="commissionedAt" label="Pušten u rad" required type="date" defaultValue={dateOnly()} />
            <Field name="intervalMonths" label="Servisni interval (meseci)" required type="number" step="1" defaultValue="6" />

            <div className="sm:col-span-2 lg:col-span-3">
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                type="submit"
              >
                Sačuvaj agregat
              </button>
            </div>
          </form>
        </div>
      </details>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-semibold">Svi agregati ({generatorRows.length})</h3>
        </div>

        {generatorRows.length ? (
          <div className="divide-y divide-border">
            {generatorRows.map((g) => (
              <article
                id={`generator-${g.id}`}
                key={g.id}
                className="scroll-mt-6 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold">{g.name}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {g.manufacturer} · motor: {g.model} · SN motora: {g.serialNumber}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      SN agregata: {g.generatorSerialNumber || "Nije unet"} · {g.currentHours.toLocaleString("sr-Latn-RS")} rad. sati · {g.location}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-sm font-medium">
                      {g.clientCompany || g.clientName || "Nije izdat / nije dodeljen komitentu"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {modeLabels[g.operatingMode] ?? "Nije podešeno"}
                      {g.manufacturingYear ? ` · godište ${g.manufacturingYear}` : ""}
                    </p>
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  Kontroler: {g.controller || "Nije unet"}
                </p>

                <details className="mt-4 rounded-md border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Izmeni agregat / dodelu
                  </summary>
                  <form
                    action={updateGeneratorAction}
                    className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    <input type="hidden" name="generatorId" value={g.id} />
                    <ClientSelectWithPreview
                      clients={clientRows}
                      defaultValue={g.clientId ?? ""}
                    />

                    <div className="sm:col-span-2 lg:col-span-3">
                      <h4 className="border-b border-border pb-2 text-sm font-semibold">
                        Podaci o opremi
                      </h4>
                    </div>
                    <Field name="manufacturer" label="Proizvođač" required defaultValue={g.manufacturer} />
                    <Field name="name" label="Generator" required defaultValue={g.name} />
                    <Field name="controller" label="Kontroler" defaultValue={g.controller ?? ""} />
                    <Field name="currentHours" label="Br. rad. sati" required type="number" step="0.1" defaultValue={String(g.currentHours)} />
                    <Field name="location" label="Lokacija opreme" required defaultValue={g.location} />
                    <Field name="generatorSerialNumber" label="Ser. br. (agregata)" defaultValue={g.generatorSerialNumber ?? ""} />

                    <div className="sm:col-span-2 lg:col-span-3">
                      <h4 className="border-b border-border pb-2 text-sm font-semibold">
                        Model i SN motora
                      </h4>
                    </div>
                    <Field name="model" label="Model motora" required defaultValue={g.model} />
                    <Field name="serialNumber" label="Serijski broj motora" required defaultValue={g.serialNumber} />
                    <Field name="manufacturingYear" label="God. proizvodnje" type="number" min="1900" max="2100" step="1" defaultValue={g.manufacturingYear ? String(g.manufacturingYear) : ""} />

                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium">Agregat ostavljen</span>
                      <select
                        name="operatingMode"
                        defaultValue={g.operatingMode ?? "auto"}
                        required
                        className="min-h-10 rounded-md border border-input bg-background px-3"
                      >
                        <option value="auto">Auto mod</option>
                        <option value="manual">Ručni mod</option>
                        <option value="stopped">Zastoj</option>
                      </select>
                    </label>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <h4 className="border-b border-border pb-2 text-sm font-semibold">
                        Podaci za servis
                      </h4>
                    </div>
                    <Field name="powerValue" label="Snaga" required type="number" step="0.01" defaultValue={String(g.powerValue)} />

                    <label className="grid gap-1.5 text-sm">
                      <span className="font-medium">Jedinica snage *</span>
                      <select
                        name="powerUnit"
                        required
                        defaultValue={g.powerUnit}
                        className="min-h-10 rounded-md border border-input bg-background px-3"
                      >
                        <option value="kVA">kVA</option>
                        <option value="kW">kW</option>
                      </select>
                    </label>
                    <Field name="commissionedAt" label="Pušten u rad" required type="date" defaultValue={g.commissionedAt} />
                    <Field name="intervalMonths" label="Servisni interval (meseci)" required type="number" step="1" defaultValue={String(g.intervalMonths ?? 6)} />

                    <div className="sm:col-span-2 lg:col-span-3">
                      <button
                        className="inline-flex min-h-10 items-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                        type="submit"
                      >
                        Sačuvaj izmene
                      </button>
                    </div>
                  </form>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Još nema agregata u registru.
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  name,
  label,
  required,
  type = "text",
  placeholder,
  step,
  min,
  max,
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  step?: string;
  min?: string;
  max?: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        className="min-h-10 rounded-md border border-input bg-background px-3"
        name={name}
        type={type}
        step={step}
        min={min}
        max={max}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
    </label>
  );
}
