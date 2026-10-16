import Link from "next/link";
import { count, desc, isNull } from "drizzle-orm";
import { ArrowRight, Users, Wrench, Zap } from "lucide-react";

import { db } from "@/db";
import { clients, generators } from "@/db/schema";

export default async function AdminHomePage() {
  const [clientCount, generatorCount, unassignedCount, recentClients] = await Promise.all([
    db.select({ value: count() }).from(clients),
    db.select({ value: count() }).from(generators),
    db.select({ value: count() }).from(generators).where(isNull(generators.clientId)),
    db.select().from(clients).orderBy(desc(clients.createdAt)).limit(5),
  ]);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Centralna evidencija</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Dobro došli u master panel</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Odavde upravljate komitentima i agregatima. Komitenti se povezuju sa svojim nalogom tek kada je email nalog verifikovan i administrator ga poveže.</p>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric title="Komitenti" value={clientCount[0]?.value ?? 0} icon={<Users size={19} />} href="/admin/clients" />
        <Metric title="Ukupno agregata" value={generatorCount[0]?.value ?? 0} icon={<Zap size={19} />} href="/admin/generators" />
        <div className="rounded-lg border border-border bg-card p-5"><Wrench size={19} className="text-primary" /><p className="mt-3 text-sm text-muted-foreground">Agregati bez komitenta</p><p className="mt-1 font-mono text-3xl font-semibold">{unassignedCount[0]?.value ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">Agregati firme ili još nedodeljeni.</p></div>
        <div className="rounded-lg border border-border bg-card p-5">
          <Wrench size={19} className="text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Radni nalozi</p>
          <p className="mt-1 text-2xl font-semibold">Postojeća evidencija</p>
          <p className="mt-1 text-xs text-muted-foreground">Trenutna servisna istorija ostaje sačuvana.</p>
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

function Metric({ title, value, icon, href }: { title: string; value: number; icon: React.ReactNode; href: string }) {
  return <Link href={href} className="rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/40"><span className="text-primary">{icon}</span><p className="mt-3 text-sm text-muted-foreground">{title}</p><p className="mt-1 font-mono text-3xl font-semibold">{value.toLocaleString("sr-Latn-RS")}</p><p className="mt-3 text-xs font-semibold text-primary">Otvori evidenciju →</p></Link>;
}
