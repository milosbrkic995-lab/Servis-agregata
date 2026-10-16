import { desc, eq } from "drizzle-orm";
import { ClipboardList } from "lucide-react";

import { db } from "@/db";
import { clients, generators, serviceRecords, user } from "@/db/schema";
import { dateOnly } from "@/lib/generator-utils";
import { createServiceRecordAction } from "../actions";

const statusMessages: Record<string, string> = {
  created: "Servisni zapis je upisan u istoriju.",
  invalid: "Proveri agregat, datum i radne sate.",
  "generator-not-found": "Izabrani agregat nije pronađen.",
  "hours-required": "Za agregat koji prati servis po radnim satima potrebno je stanje sati.",
};

export default async function AdminWorkOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
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
    db.select({ id: generators.id, name: generators.name, serialNumber: generators.serialNumber }).from(generators).orderBy(generators.name),
  ]);

  return <div className="space-y-6">
    <section><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Master panel</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Radni nalozi i servisna istorija</h2><p className="mt-2 text-sm text-muted-foreground">Evidentiraj intervenciju za izabrani agregat. Postojeći servisni zapisi ostaju sačuvani.</p></section>
    {status && statusMessages[status] ? <p role="status" className="rounded-md border border-border bg-muted/50 p-3 text-sm">{statusMessages[status]}</p> : null}
    <section className="rounded-lg border border-border bg-card p-4 sm:p-6"><div className="mb-4"><h3 className="font-semibold">Novi servisni zapis</h3><p className="mt-1 text-xs text-muted-foreground">Ovo je osnovna forma prema postojećoj tabeli servisne istorije. Detaljna kontrolna lista sa papirnog naloga biće naredna faza.</p></div>
      {generatorRows.length ? <form action={createServiceRecordAction} className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm sm:col-span-2"><span className="font-medium">Agregat *</span><select name="generatorId" required className="min-h-10 rounded-md border border-input bg-background px-3"><option value="">Izaberi agregat</option>{generatorRows.map((g) => <option key={g.id} value={g.id}>{g.name} — SN {g.serialNumber}</option>)}</select></label><label className="grid gap-1.5 text-sm"><span className="font-medium">Datum servisa *</span><input className="min-h-10 rounded-md border border-input bg-background px-3" name="completedAt" required type="date" max={dateOnly()} defaultValue={dateOnly()}/></label><label className="grid gap-1.5 text-sm"><span className="font-medium">Radni sati pri servisu</span><input className="min-h-10 rounded-md border border-input bg-background px-3" name="hoursAtService" type="number" step="0.1" min="0" placeholder="Očitavanje (opciono)"/></label><label className="grid gap-1.5 text-sm sm:col-span-2"><span className="font-medium">Opis izvršenih radova</span><textarea className="rounded-md border border-input bg-background px-3 py-2" name="workNotes" rows={4} maxLength={2000} placeholder="Opis servisa, provera, zamenjeni delovi i napomene..."/></label><div className="sm:col-span-2"><button type="submit" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Sačuvaj servisni zapis</button></div></form> : <p className="text-sm text-muted-foreground">Prvo dodaj agregat u registru.</p>}
    </section>
    <section className="overflow-hidden rounded-lg border border-border bg-card"><div className="border-b border-border p-4"><h3 className="font-semibold">Servisni zapisi ({rows.length})</h3></div>
      {rows.length ? <div className="divide-y divide-border">{rows.map((row) => <article key={row.id} className="p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><ClipboardList size={18}/></span><div><h4 className="font-semibold">{row.generatorName}</h4><p className="mt-1 text-sm text-muted-foreground">SN: {row.serialNumber} · {row.clientName ?? "J&B POWER / nedodeljen komitent"}</p></div></div><div className="text-sm font-medium">{row.completedAt}</div></div>{row.workNotes ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{row.workNotes}</p> : <p className="mt-3 text-sm text-muted-foreground">Nema opisa radova.</p>}<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">{row.hoursAtService !== null ? <span>Radni sati: {row.hoursAtService}</span> : null}<span>Evidentirao: {row.createdBy}</span></div></article>)}</div> : <div className="p-8 text-center text-sm text-muted-foreground">Nema upisanih servisnih zapisa.</div>}
    </section>
  </div>;
}
