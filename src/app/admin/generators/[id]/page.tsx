import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft, CalendarClock, Clock3, FileText, MapPin, UserRound, Wrench, Zap } from "lucide-react";

import { db } from "@/db";
import { clients, generators, serviceRecords } from "@/db/schema";

export default async function AdminGeneratorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select({
    id: generators.id,
    clientId: generators.clientId,
    name: generators.name,
    manufacturer: generators.manufacturer,
    model: generators.model,
    serialNumber: generators.serialNumber,
    powerValue: generators.powerValue,
    powerUnit: generators.powerUnit,
    location: generators.location,
    commissionedAt: generators.commissionedAt,
    intervalType: generators.intervalType,
    intervalMonths: generators.intervalMonths,
    intervalHours: generators.intervalHours,
    currentHours: generators.currentHours,
    lastServiceHours: generators.lastServiceHours,
    nextServiceDate: generators.nextServiceDate,
    reminderDays: generators.reminderDays,
    notificationsEnabled: generators.notificationsEnabled,
    clientName: clients.name,
    clientEmail: clients.email,
  }).from(generators).leftJoin(clients, eq(generators.clientId, clients.id)).where(eq(generators.id, id)).limit(1);

  const generator = rows[0];
  if (!generator) notFound();

  const records = await db.select({
    id: serviceRecords.id,
    completedAt: serviceRecords.completedAt,
    hoursAtService: serviceRecords.hoursAtService,
    workNotes: serviceRecords.workNotes,
    createdAt: serviceRecords.createdAt,
  }).from(serviceRecords).where(eq(serviceRecords.generatorId, generator.id)).orderBy(desc(serviceRecords.completedAt));

  const backHref = generator.clientId ? `/admin/clients/${generator.clientId}` : "/admin/generators";
  const backLabel = generator.clientId ? "Nazad na karton komitenta" : "Nazad na registar agregata";
  const interval = generator.intervalType === "hours"
    ? `${generator.intervalHours ?? "Nije podešeno"} radnih sati`
    : `${generator.intervalMonths ?? "Nije podešeno"} meseci`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href={backHref} className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted"><ArrowLeft size={16} /> {backLabel}</Link>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Master panel · servisni karton agregata</p>
        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3"><span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/5 text-primary"><Zap size={23}/></span><div className="min-w-0"><h2 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">{generator.name}</h2><p className="mt-1 text-sm text-muted-foreground">{generator.manufacturer} · {generator.model}</p><p className="mt-2 text-xs text-muted-foreground">Serijski broj: <span className="font-semibold text-foreground">{generator.serialNumber}</span></p></div></div>
          <div className="rounded-lg border border-border bg-background px-4 py-3"><p className="text-xs text-muted-foreground">Snaga</p><p className="mt-1 text-2xl font-bold">{generator.powerValue} {generator.powerUnit}</p></div>
        </div>
        <div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <Info icon={<UserRound size={16}/>} label="Komitent / vlasnik" value={generator.clientName ?? "J&B POWER — sopstveni agregat"} />
          {generator.clientEmail ? <Info icon={<FileText size={16}/>} label="Email komitenta" value={generator.clientEmail}/> : null}
          <Info icon={<MapPin size={16}/>} label="Lokacija" value={generator.location}/>
          <Info icon={<CalendarClock size={16}/>} label="Pušten u rad" value={fmtDate(generator.commissionedAt)}/>
          <Info icon={<Clock3 size={16}/>} label="Trenutni radni sati" value={`${generator.currentHours.toLocaleString("sr-Latn-RS")} h`}/>
          <Info icon={<Wrench size={16}/>} label="Interval servisa" value={interval}/>
          <Info icon={<CalendarClock size={16}/>} label="Sledeći servis" value={generator.nextServiceDate ? fmtDate(generator.nextServiceDate) : "Nije određen"}/>
          <Info icon={<Clock3 size={16}/>} label="Radni sati pri poslednjem servisu" value={generator.lastServiceHours === null ? "Nije evidentirano" : `${generator.lastServiceHours.toLocaleString("sr-Latn-RS")} h`}/>
          <Info icon={<CalendarClock size={16}/>} label="Podsetnik pre servisa" value={`${generator.reminderDays} dana`}/>
          <Info icon={<Wrench size={16}/>} label="Podsetnici" value={generator.notificationsEnabled ? "Uključeni" : "Isključeni"}/>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-xl font-semibold">Istorija servisa</h3><p className="mt-1 text-sm text-muted-foreground">Svi postojeći servisni zapisi za ovaj agregat.</p></div><span className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">{records.length} zapisa</span></div>
        {records.length ? <div className="overflow-hidden rounded-xl border border-border bg-card">{records.map((record) => <article key={record.id} className="flex gap-3 border-b border-border p-4 last:border-b-0 sm:p-5"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary"><Wrench size={18}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-2"><h4 className="font-semibold">Servis obavljen</h4><time className="text-sm text-muted-foreground">{fmtDate(record.completedAt)}</time></div>{record.workNotes ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{record.workNotes}</p> : <p className="mt-2 text-sm text-muted-foreground">Nema dodatnih napomena.</p>}{record.hoursAtService !== null ? <p className="mt-2 text-xs text-muted-foreground">Radni sati pri servisu: {record.hoursAtService.toLocaleString("sr-Latn-RS")} h</p> : null}</div></article>)}</div> : <div className="rounded-lg border border-dashed border-border bg-card px-5 py-10 text-center"><Wrench size={23} className="mx-auto text-muted-foreground"/><h4 className="mt-3 font-semibold">Još nema servisnih zapisa</h4><p className="mt-1 text-sm text-muted-foreground">Kada se servis evidentira, pojaviće se ovde.</p></div>}
      </section>
    </div>
  );
}

function fmtDate(value: string) {
  return new Intl.DateTimeFormat("sr-Latn-RS").format(new Date(`${value}T12:00:00`));
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex min-w-0 items-start gap-2.5"><span className="mt-0.5 text-primary">{icon}</span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium">{value}</p></div></div>;
}
