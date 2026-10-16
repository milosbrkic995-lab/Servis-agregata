import Link from "next/link";
import { count, desc, eq, isNull } from "drizzle-orm";
import { AlertTriangle, ArrowDownToLine, ArrowRight, BellRing, CalendarClock, ClipboardList, Package, Users, Wrench, Zap } from "lucide-react";

import { db } from "@/db";
import { clients, generators, serviceRequests } from "@/db/schema";
import { dateOnly, getServiceStatus } from "@/lib/generator-utils";

export default async function AdminHomePage() {
  const [clientCount, generatorRows, recentClients, openRequests] = await Promise.all([
    db.select({ value: count() }).from(clients),
    db.select({
      id: generators.id,
      clientId: generators.clientId,
      operatingMode: generators.operatingMode,
      intervalType: generators.intervalType,
      intervalHours: generators.intervalHours,
      currentHours: generators.currentHours,
      lastServiceHours: generators.lastServiceHours,
      nextServiceDate: generators.nextServiceDate,
      reminderDays: generators.reminderDays,
    }).from(generators),
    db.select().from(clients).orderBy(desc(clients.createdAt)).limit(5),
    db.select({ value: count() }).from(serviceRequests).where(eq(serviceRequests.status, "new")),
  ]);

  const today = dateOnly();
  const statuses = generatorRows.map((g) => getServiceStatus({
    intervalType: g.intervalType === "hours" ? "hours" : "calendar",
    intervalHours: g.intervalHours,
    currentHours: g.currentHours,
    lastServiceHours: g.lastServiceHours,
    nextServiceDate: g.nextServiceDate,
    reminderDays: g.reminderDays,
  }, today));
  const overdueCount = statuses.filter((s) => s === "overdue").length;
  const soonCount = statuses.filter((s) => s === "today" || s === "upcoming").length;
  const unassignedCount = generatorRows.filter((g) => !g.clientId).length;
  const stoppedCount = generatorRows.filter((g) => g.operatingMode === "stopped").length;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Centralna evidencija</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Dobro došli u master panel</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Pregled komitenata, celokupne opreme i servisnih obaveza na jednom mestu.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Operativni pregled">
        <Metric title="Komitenti" value={clientCount[0]?.value ?? 0} icon={<Users size={19} />} href="/admin/clients" />
        <Metric title="Ukupno agregata" value={generatorRows.length} icon={<Zap size={19} />} href="/admin/generators" />
        <Metric title="Servis kasni" value={overdueCount} icon={<AlertTriangle size={19} />} href="/admin/work-orders" tone={overdueCount ? "danger" : "normal"} />
        <Metric title="Servis danas / uskoro" value={soonCount} icon={<CalendarClock size={19} />} href="/admin/work-orders" />
        <Metric title="Agregati u zastoju" value={stoppedCount} icon={<Wrench size={19} />} href="/admin/generators" tone={stoppedCount ? "warning" : "normal"} />
        <Metric title="Bez komitenta" value={unassignedCount} icon={<Package size={19} />} href="/admin/generators" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/service-requests" className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/30">
          <div><div className="flex items-center gap-2"><BellRing size={19} className="text-primary"/><h3 className="font-semibold">Servisni zahtevi</h3></div><p className="mt-2 text-sm text-muted-foreground">Pregledaj prijave, odgovori komitentima i ažuriraj status.</p><p className="mt-3 text-xs font-semibold text-primary">Otvori prijemni sandučić →</p></div>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-2xl font-bold tabular-nums">{openRequests[0]?.value ?? 0}</span>
        </Link>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2"><ArrowDownToLine size={19} className="text-primary"/><h3 className="font-semibold">Izvoz evidencije</h3></div>
          <p className="mt-2 text-sm text-muted-foreground">Preuzmi CSV kopiju ključnih evidencija za Excel.</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
            <Link className="text-primary hover:underline" href="/admin/exports/clients">Komitenti CSV</Link>
            <Link className="text-primary hover:underline" href="/admin/exports/generators">Agregati CSV</Link>
            <Link className="text-primary hover:underline" href="/admin/exports/services">Servisi CSV</Link>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div><h3 className="font-semibold">Poslednji dodati komitenti</h3><p className="mt-1 text-xs text-muted-foreground">Najnoviji unosi u centralnoj evidenciji.</p></div>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" href="/admin/clients">Svi komitenti <ArrowRight size={16} /></Link>
        </div>
        {recentClients.length ? <div className="divide-y divide-border">{recentClients.map((client) => <div key={client.id} className="flex flex-wrap items-center justify-between gap-2 p-4"><div><p className="font-medium">{client.name}</p><p className="mt-1 text-sm text-muted-foreground">{client.email}{client.company ? ` · ${client.company}` : ""}</p></div><span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">{client.userId ? "Nalog povezan" : "Čeka povezivanje naloga"}</span></div>)}</div> : <div className="p-8 text-center text-sm text-muted-foreground">Još nema komitenata. Dodajte prvog komitenta u evidenciji.</div>}
      </section>
    </div>
  );
}

function Metric({ title, value, icon, href, tone = "normal" }: { title: string; value: number; icon: React.ReactNode; href: string; tone?: "normal" | "danger" | "warning" }) {
  const toneClass = tone === "danger" ? "border-destructive/40 bg-destructive/5" : tone === "warning" ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-card";
  return <Link href={href} className={`rounded-lg border p-5 transition-colors hover:bg-muted/40 ${toneClass}`}><span className="text-primary">{icon}</span><p className="mt-3 text-sm text-muted-foreground">{title}</p><p className="mt-1 font-mono text-3xl font-semibold">{value.toLocaleString("sr-Latn-RS")}</p><p className="mt-3 text-xs font-semibold text-primary">Otvori evidenciju →</p></Link>;
}
