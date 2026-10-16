import { desc, eq } from "drizzle-orm";
import { ClipboardList } from "lucide-react";

import { db } from "@/db";
import { clients, generators, serviceRecords, user } from "@/db/schema";
import { dateOnly, formatShortDate, getServiceStatus } from "@/lib/generator-utils";

import { WorkOrderBoard } from "./work-order-board";

const statusMessages: Record<string, string> = {
  invalid: "Proveri izbor agregata, datum i unesene radne sate.",
  "generator-not-found": "Neki od izabranih agregata nisu pronađeni. Osveži stranicu i pokušaj ponovo.",
  "hours-required": "Za agregat koji prati servis po radnim satima obavezno je stanje sati.",
  "invalid-hours": "Proveri radne sate. Unesi broj nula ili veći.",
};

type SearchParams = Promise<{ status?: string; count?: string }>;

export default async function AdminWorkOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const { status, count: countParam } = await searchParams;
  const [rows, generatorRows] = await Promise.all([
    db.select({
      id: serviceRecords.id,
      completedAt: serviceRecords.completedAt,
      hoursAtService: serviceRecords.hoursAtService,
      workNotes: serviceRecords.workNotes,
      generatorName: generators.name,
      serialNumber: generators.serialNumber,
      clientName: clients.name,
      createdBy: user.name,
    })
      .from(serviceRecords)
      .innerJoin(generators, eq(serviceRecords.generatorId, generators.id))
      .leftJoin(clients, eq(generators.clientId, clients.id))
      .innerJoin(user, eq(serviceRecords.userId, user.id))
      .orderBy(desc(serviceRecords.completedAt)),
    db.select({
      id: generators.id,
      name: generators.name,
      manufacturer: generators.manufacturer,
      model: generators.model,
      serialNumber: generators.serialNumber,
      generatorSerialNumber: generators.generatorSerialNumber,
      powerValue: generators.powerValue,
      powerUnit: generators.powerUnit,
      location: generators.location,
      currentHours: generators.currentHours,
      intervalType: generators.intervalType,
      intervalHours: generators.intervalHours,
      lastServiceHours: generators.lastServiceHours,
      nextServiceDate: generators.nextServiceDate,
      reminderDays: generators.reminderDays,
      operatingMode: generators.operatingMode,
      clientId: generators.clientId,
      clientName: clients.name,
    })
      .from(generators)
      .leftJoin(clients, eq(generators.clientId, clients.id))
      .orderBy(generators.name),
  ]);

  const today = dateOnly();
  const boardRows = generatorRows.map((g) => ({
    ...g,
    serviceStatus: getServiceStatus({
      intervalType: g.intervalType === "hours" ? "hours" : "calendar",
      intervalHours: g.intervalHours,
      currentHours: g.currentHours,
      lastServiceHours: g.lastServiceHours,
      nextServiceDate: g.nextServiceDate,
      reminderDays: g.reminderDays,
    }, today),
  }));

  return <div className="space-y-6">
    <section><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Master panel</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Radni nalozi</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Jedan pregled svih agregata, svih komitenata i opreme bez dodele. Pretraži, filtriraj i označi agregate za koje si obavio servis.</p></section>
    {status === "created" ? <p role="status" className="rounded-md border border-border bg-muted/50 p-3 text-sm">Servisna istorija je ažurirana za {Math.max(1, Math.min(100, Number(countParam) || 1))} agregata.</p> : null}
    {status && statusMessages[status] ? <p role="status" className="rounded-md border border-border bg-muted/50 p-3 text-sm">{statusMessages[status]}</p> : null}
    {generatorRows.length ? <WorkOrderBoard generators={boardRows} today={today} /> : <section className="rounded-lg border border-dashed border-border bg-card p-10 text-center"><ClipboardList size={25} className="mx-auto text-muted-foreground"/><h3 className="mt-3 font-semibold">Još nema agregata</h3><p className="mt-1 text-sm text-muted-foreground">Prvo unesi agregate u registru. Onda će se svi pojaviti ovde.</p></section>}

    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">Servisna istorija</h3><p className="mt-1 text-sm text-muted-foreground">Pregled prethodno evidentiranih servisa.</p></div><span className="rounded-md border border-border px-3 py-1.5 text-sm">{rows.length} zapisa</span></div></div>
      {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Datum</th><th className="px-4 py-3">Agregat</th><th className="px-4 py-3">Komitent</th><th className="px-4 py-3">Radni sati</th><th className="px-4 py-3">Opis radova</th><th className="px-4 py-3">Evidentirao</th></tr></thead><tbody className="divide-y divide-border">{rows.map((row) => <tr key={row.id} className="align-top hover:bg-muted/30"><td className="whitespace-nowrap px-4 py-3 font-medium">{formatShortDate(row.completedAt)}</td><td className="px-4 py-3"><p className="font-semibold">{row.generatorName}</p><p className="mt-0.5 font-mono text-xs text-muted-foreground">SN {row.serialNumber}</p></td><td className="px-4 py-3">{row.clientName ?? "J&B POWER / bez dodele"}</td><td className="whitespace-nowrap px-4 py-3 tabular-nums">{row.hoursAtService === null ? "—" : `${row.hoursAtService.toLocaleString("sr-Latn-RS")} h`}</td><td className="max-w-sm px-4 py-3"><p className="whitespace-pre-wrap break-words text-muted-foreground">{row.workNotes || "Bez opisa"}</p></td><td className="px-4 py-3">{row.createdBy}</td></tr>)}</tbody></table></div> : <div className="p-8 text-center text-sm text-muted-foreground">Još nema evidentiranih servisnih zapisa.</div>}
    </section>
  </div>;
}
