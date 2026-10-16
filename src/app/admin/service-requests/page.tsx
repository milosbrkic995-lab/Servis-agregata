import Link from "next/link";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { ArrowRight, MessageSquareText } from "lucide-react";

import { db } from "@/db";
import { clients, generators, serviceRequests } from "@/db/schema";

const statusLabels: Record<string,string> = { new:"Primljen", in_progress:"U obradi", scheduled:"Servis zakazan", resolved:"Rešen", closed:"Zatvoren" };
const statusTone: Record<string,string> = { new:"border-blue-300 bg-blue-50 text-blue-800", in_progress:"border-amber-300 bg-amber-50 text-amber-800", scheduled:"border-violet-300 bg-violet-50 text-violet-800", resolved:"border-emerald-300 bg-emerald-50 text-emerald-800", closed:"border-border bg-muted text-muted-foreground" };
const fmt = (date: Date) => new Intl.DateTimeFormat("sr-Latn-RS", { dateStyle:"medium", timeStyle:"short" }).format(date);
type Props = { searchParams: Promise<{ status?:string; q?:string }> };
export default async function AdminServiceRequestsPage({ searchParams }: Props) {
  const { status, q = "" } = await searchParams;
  const search = q.trim().slice(0,120);
  const validValues = ["new","in_progress","scheduled","resolved","closed"] as const;
  const validStatus = validValues.includes(status as (typeof validValues)[number]) ? status as (typeof validValues)[number] : undefined;
  const query = db.select({ id:serviceRequests.id, subject:serviceRequests.subject, description:serviceRequests.description, urgency:serviceRequests.urgency, status:serviceRequests.status, createdAt:serviceRequests.createdAt, updatedAt:serviceRequests.updatedAt, clientName:serviceRequests.clientNameSnapshot, clientEmail:serviceRequests.clientEmailSnapshot, generatorName:serviceRequests.generatorNameSnapshot, generatorSerial:serviceRequests.generatorSerialSnapshot, liveClientName:clients.name, liveGeneratorId:generators.id })
    .from(serviceRequests).leftJoin(clients,eq(serviceRequests.clientId,clients.id)).leftJoin(generators,eq(serviceRequests.generatorId,generators.id));
  const searchFilter = search ? or(
    ilike(serviceRequests.subject, `%${search}%`),
    ilike(serviceRequests.description, `%${search}%`),
    ilike(serviceRequests.clientNameSnapshot, `%${search}%`),
    ilike(serviceRequests.clientEmailSnapshot, `%${search}%`),
    ilike(serviceRequests.generatorNameSnapshot, `%${search}%`),
    ilike(serviceRequests.generatorSerialSnapshot, `%${search}%`),
  ) : undefined;
  const rows = await (validStatus && searchFilter
    ? query.where(and(eq(serviceRequests.status,validStatus),searchFilter)).orderBy(desc(serviceRequests.updatedAt))
    : validStatus
      ? query.where(eq(serviceRequests.status,validStatus)).orderBy(desc(serviceRequests.updatedAt))
      : searchFilter
        ? query.where(searchFilter).orderBy(desc(serviceRequests.updatedAt))
        : query.orderBy(desc(serviceRequests.updatedAt)));
  const newCount = rows.filter((r) => r.status === "new").length;
  return <div className="space-y-6">
    <section><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Master panel</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Servisni zahtevi</h1><p className="mt-2 text-sm text-muted-foreground">Ovde se prikazuju zahtevi koje su komitenti poslali iz svog portala. Otvori zahtev da odgovoriš i promeniš status.</p></section>
    <section className="grid gap-3 sm:grid-cols-3"><Metric label="Prikazano" value={rows.length}/><Metric label="Novi zahtevi u prikazu" value={newCount}/><Metric label="Hitni u prikazu" value={rows.filter((r)=>r.urgency === "urgent" && !["resolved","closed"].includes(r.status)).length}/></section>
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"><label className="grid flex-1 gap-1.5 text-sm"><span className="font-medium">Pretraga zahteva</span><input name="q" value={search} placeholder="Komitent, email, agregat, serijski broj, opis..." className="min-h-10 rounded-md border border-input bg-background px-3"/></label><label className="grid gap-1.5 text-sm"><span className="font-medium">Status</span><select name="status" defaultValue={validStatus ?? "all"} className="min-h-10 rounded-md border border-input bg-background px-3"><option value="all">Svi zahtevi</option><option value="new">Primljen</option><option value="in_progress">U obradi</option><option value="scheduled">Servis zakazan</option><option value="resolved">Rešen</option><option value="closed">Zatvoren</option></select></label><button type="submit" className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted">Filtriraj</button><Link href="/admin/service-requests" className="inline-flex min-h-10 items-center text-sm text-muted-foreground hover:text-foreground">Poništi filter</Link></form>
    {rows.length ? <div className="space-y-3">{rows.map((r)=><Link key={r.id} href={`/admin/service-requests/${r.id}`} className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-muted-foreground">Primljeno {fmt(r.createdAt)} · poslednja aktivnost {fmt(r.updatedAt)}</p><h2 className="mt-1 break-words font-semibold">{r.subject}</h2><p className="mt-1 text-sm text-muted-foreground">{r.clientName} · {r.clientEmail}</p><p className="mt-1 text-sm">{r.generatorName} · SN {r.generatorSerial}</p></div><div className="flex shrink-0 flex-col items-end gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[r.status] ?? statusTone.new}`}>{statusLabels[r.status] ?? r.status}</span>{r.urgency === "urgent" ? <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive">HITNO</span> : null}</div></div><div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3"><p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p><span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">Otvori <ArrowRight size={15}/></span></div></Link>)}</div> : <div className="rounded-xl border border-dashed border-border p-10 text-center"><MessageSquareText size={24} className="mx-auto text-muted-foreground"/><h2 className="mt-3 font-semibold">Nema servisnih zahteva</h2><p className="mt-1 text-sm text-muted-foreground">Kada komitent pošalje zahtev, pojaviće se ovde.</p></div>}
  </div>;
}
function Metric({label,value}:{label:string;value:number}) { return <div className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-mono text-3xl font-semibold">{value}</p></div>; }
