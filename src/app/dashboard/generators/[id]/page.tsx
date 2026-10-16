import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Clock3, MapPin, Wrench, Zap } from "lucide-react";

import { getGeneratorDetails } from "@/lib/generator-data";
import { formatDate, formatShortDate, getServiceStatus, getStatusLabel, serviceCountdown } from "@/lib/generator-utils";
import { cn } from "@/lib/utils";

export default async function GeneratorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getGeneratorDetails(id);
  if (!result) notFound();
  const { generator, records } = result;
  const status = getServiceStatus(generator);
  const statusTone = {
    overdue: "border-destructive/30 bg-destructive/10 text-destructive",
    today: "border-primary/35 bg-primary/10 text-primary",
    upcoming: "border-primary/25 bg-primary/5 text-primary",
    current: "border-border bg-muted text-muted-foreground",
  }[status];
  const target = generator.intervalType === "hours" && generator.intervalHours !== null
    ? `${((generator.lastServiceHours ?? 0) + generator.intervalHours).toLocaleString("sr-Latn-RS")} radnih sati`
    : formatDate(generator.nextServiceDate);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard" className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted"><ArrowLeft size={16} /> Svi agregati</Link>
      <div className="flex items-start gap-3"><span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/5 text-primary"><Zap size={23}/></span><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">SERVISNI KARTON · {generator.serialNumber}</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{generator.name}</h1><p className="mt-1 text-sm text-muted-foreground">{generator.manufacturer} {generator.model}</p></div></div>
      <section className="mt-6 grid gap-3 sm:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-border bg-card p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Sledeći servis</p><p className="mt-2 text-xl font-bold">{target}</p></div><CalendarClock size={23} className="shrink-0 text-primary"/></div><div className="mt-4 flex flex-wrap items-center gap-2"><span className={cn("inline-flex min-h-7 items-center rounded-sm border px-2.5 text-[11px] font-semibold", statusTone)}>{getStatusLabel(status)}</span><span className="text-xs text-muted-foreground">{serviceCountdown(generator)}</span></div></div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border"><InfoTile icon={<Zap size={16}/>} label="Snaga" value={`${generator.powerValue} ${generator.powerUnit}`}/><InfoTile icon={<MapPin size={16}/>} label="Lokacija" value={generator.location}/><InfoTile icon={<CalendarClock size={16}/>} label="Pušten u rad" value={formatShortDate(generator.commissionedAt)}/><InfoTile icon={<Clock3 size={16}/>} label="Radni sati" value={`${generator.currentHours.toLocaleString("sr-Latn-RS")} h`}/></div>
      </section>
      <section className="mt-7"><div className="mb-3"><h2 className="text-lg font-semibold">Istorija servisa</h2><p className="mt-1 text-xs text-muted-foreground">Dostupni zapisi evidentirani za ovaj agregat.</p></div><div className="overflow-hidden rounded-lg border border-border bg-card">{records.length ? records.map((record) => <article key={record.id} className="flex gap-3 border-b border-border p-4 last:border-b-0 sm:gap-4 sm:p-5"><span className="flex size-9 shrink-0 items-center justify-center rounded bg-primary/10 text-primary"><Wrench size={17}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><h3 className="text-sm font-semibold">Servis obavljen</h3><time className="text-xs text-muted-foreground">{formatDate(record.completedAt)}</time></div>{record.workNotes ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{record.workNotes}</p> : <p className="mt-2 text-sm text-muted-foreground">Nema dodatnih napomena.</p>}{record.hoursAtService !== null ? <p className="mt-2 font-mono text-xs text-muted-foreground">Očitavanje: {record.hoursAtService.toLocaleString("sr-Latn-RS")} h</p> : null}</div></article>) : <div className="px-5 py-10 text-center"><Wrench className="mx-auto text-muted-foreground" size={22}/><p className="mt-3 text-sm font-medium">Još nema evidentiranih servisa</p></div>}</div></section>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="min-w-0 bg-card p-4 sm:p-5"><span className="text-primary">{icon}</span><p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-semibold">{value}</p></div>;
}
