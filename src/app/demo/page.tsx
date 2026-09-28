import Link from "next/link";
import { ArrowLeft, Bell, Bolt, CalendarDays, MapPin, Plus, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dateOnly, formatDate, getServiceStatus, getStatusLabel, serviceCountdown } from "@/lib/generator-utils";
import type { GeneratorRecord } from "@/lib/generator-types";
import { cn } from "@/lib/utils";

function shiftDate(dateValue: string, days: number): string {
  const date = new Date(`${dateValue}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function demoGenerator(id: string, name: string, manufacturer: string, model: string, serialNumber: string, location: string, dueDate: string): GeneratorRecord {
  return {
    id,
    name,
    manufacturer,
    model,
    serialNumber,
    powerValue: id === "demo-1" ? 150 : 80,
    powerUnit: "kVA",
    location,
    commissionedAt: "2022-04-12",
    intervalType: "calendar",
    intervalMonths: 6,
    intervalHours: null,
    currentHours: 1248,
    lastServiceHours: null,
    nextServiceDate: dueDate,
    reminderDays: 7,
    notificationsEnabled: true,
    updatedAt: new Date().toISOString(),
  };
}

function DemoGeneratorCard({ generator, today }: { generator: GeneratorRecord; today: string }) {
  const status = getServiceStatus(generator, today);
  const tone = status === "overdue" ? "border-destructive/30 bg-destructive/10 text-destructive" : status === "upcoming" || status === "today" ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-muted text-muted-foreground";
  return (
    <article className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary"><Zap size={20} /></span><div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{generator.name}</h2><p className="mt-1 truncate text-sm text-muted-foreground">{generator.manufacturer} · {generator.model}</p></div></div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><MapPin size={13} />{generator.location}</span><span className="inline-flex items-center gap-1.5"><Zap size={13} />{generator.powerValue} {generator.powerUnit}</span><span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{formatDate(generator.nextServiceDate)}</span></div>
      <div className="mt-4 flex items-center justify-between gap-3"><Badge variant="outline" className={cn("min-h-7 rounded-sm px-2.5 text-[11px] font-semibold", tone)}>{getStatusLabel(status)}</Badge><span className="truncate text-xs text-muted-foreground">{serviceCountdown(generator, today)}</span></div>
    </article>
  );
}

export default function DemoPage() {
  const today = dateOnly();
  const generators = [
    demoGenerator("demo-1", "Rezervni agregat — hala A", "Perkins", "1106A-70TAG3", "PRK-4482-21", "Proizvodna hala A", shiftDate(today, 5)),
    demoGenerator("demo-2", "Agregat — pumpna stanica", "FG Wilson", "P88-3", "FGW-0906-18", "Pumpna stanica 2", shiftDate(today, -9)),
  ];

  return (
    <main className="min-h-dvh bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5"><span className="flex size-8 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground"><Bolt size={17} /></span><span className="truncate text-xs font-bold tracking-[0.1em]">SERVISNI DNEVNIK</span></Link>
        <Button nativeButton={false} render={<Link href="/" />} className="min-h-10">Napravi nalog</Button>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
        <Button variant="ghost" nativeButton={false} render={<Link href="/" />} className="-ml-3 mb-4 min-h-10 gap-2 text-muted-foreground"><ArrowLeft size={16} /> Nazad na prijavu</Button>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">DEMONSTRACIONI PREGLED</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Primer servisne evidencije</h1><p className="mt-2 text-sm text-muted-foreground">Ilustrativni podaci prikazuju kako izgledaju rokovi i obaveštenja.</p></div><span className="self-start rounded-sm border border-border bg-card px-2.5 py-1 font-mono text-[11px] text-muted-foreground">PREGLED · BEZ IZMENA</span></div>
        <section className="mt-6 grid gap-3 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="grid gap-3">{generators.map((generator) => <DemoGeneratorCard key={generator.id} generator={generator} today={today} />)}</div>
          <div className="h-fit rounded-lg border border-border bg-card p-4 sm:p-5"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded bg-primary/10 text-primary"><Bell size={17} /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">OBAVEŠTENJE</p><h2 className="mt-0.5 text-sm font-semibold">Servis se približava</h2></div></div><p className="mt-3 text-sm leading-6 text-muted-foreground">Rezervni agregat — hala A · Servis je planiran za {formatDate(generators[0].nextServiceDate)}.</p><div className="mt-4 rounded-md bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">Rokovi i servisna istorija biće sačuvani uz vaš nalog.</div><Button nativeButton={false} render={<Link href="/" />} className="mt-4 min-h-11 w-full gap-2"><Plus size={16} /> Napravi moj nalog</Button></div>
        </section>
        <p className="mt-6 text-center text-xs text-muted-foreground">Ovi podaci su primer i nisu povezani sa stvarnom opremom.</p>
      </div>
    </main>
  );
}
