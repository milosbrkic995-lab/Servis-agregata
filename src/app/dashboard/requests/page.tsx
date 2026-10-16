import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArrowRight, MessageSquareText, Plus, Wrench } from "lucide-react";

import { db } from "@/db";
import { clients, serviceRequests } from "@/db/schema";
import { requireUser } from "@/lib/auth";

const statusLabels: Record<string, string> = {
  new: "Primljen",
  in_progress: "U obradi",
  scheduled: "Servis zakazan",
  resolved: "Rešen",
  closed: "Zatvoren",
};
const statusTone: Record<string, string> = {
  new: "border-blue-300 bg-blue-50 text-blue-800",
  in_progress: "border-amber-300 bg-amber-50 text-amber-800",
  scheduled: "border-violet-300 bg-violet-50 text-violet-800",
  resolved: "border-emerald-300 bg-emerald-50 text-emerald-800",
  closed: "border-border bg-muted text-muted-foreground",
};
const fmt = (date: Date) => new Intl.DateTimeFormat("sr-Latn-RS", { dateStyle: "medium", timeStyle: "short" }).format(date);

type Props = { searchParams: Promise<{ status?: string }> };
export default async function ClientServiceRequestsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const currentUser = await requireUser();
  const clientRows = await db.select({ id: clients.id }).from(clients).where(eq(clients.userId, currentUser.id)).limit(1);
  const client = clientRows[0];
  const requests = client
    ? await db.select().from(serviceRequests).where(eq(serviceRequests.clientId, client.id)).orderBy(desc(serviceRequests.updatedAt))
    : [];

  return <div className="mx-auto max-w-5xl space-y-6">
    <section className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Portal komitenta</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Moji servisni zahtevi</h1><p className="mt-2 text-sm text-muted-foreground">Prijavi kvar, prati status i razmenjuj poruke sa servisom.</p></div><Link href="/dashboard/requests/new" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"><Plus size={17}/> Zatraži servis</Link></section>
    {status === "created" ? <Notice>Servisni zahtev je poslat. J&amp;B POWER ga sada može pregledati.</Notice> : null}
    {status === "no-client" || !client ? <Notice>Ovaj nalog još nije povezan sa kartonom komitenta. Obratite se J&amp;B POWER.</Notice> : null}
    {status === "message-invalid" ? <Notice>Poruka nije poslata. Unesi bar dva znaka.</Notice> : null}
    {status === "not-found" ? <Notice>Zahtev nije pronađen ili nije povezan sa ovim nalogom.</Notice> : null}

    {requests.length ? <div className="space-y-3">{requests.map((request) => <Link key={request.id} href={`/dashboard/requests/${request.id}`} className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-muted-foreground">Prijavljeno {fmt(request.createdAt)}</p><h2 className="mt-1 break-words font-semibold">{request.subject}</h2><p className="mt-1 text-sm text-muted-foreground">{request.generatorNameSnapshot} · SN {request.generatorSerialSnapshot}</p></div><span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[request.status] ?? statusTone.new}`}>{statusLabels[request.status] ?? request.status}</span></div>
      <p className="mt-3 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{request.description}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"><span className={`text-xs font-semibold ${request.urgency === "urgent" ? "text-destructive" : "text-muted-foreground"}`}>{request.urgency === "urgent" ? "HITNO" : "Redovan zahtev"}</span><span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">Detalji i poruke <ArrowRight size={15}/></span></div>
    </Link>)}</div> : <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-primary/5 text-primary"><MessageSquareText size={23}/></span><h2 className="mt-4 font-semibold">Još nema servisnih zahteva</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Kada prijaviš kvar ili zatražiš servis za neki od svojih agregata, ovde ćeš videti status i odgovor servisnog tima.</p><Link href="/dashboard/requests/new" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"><Wrench size={16}/> Zatraži prvi servis</Link></div>}
  </div>;
}
function Notice({ children }: { children: React.ReactNode }) { return <p role="status" className="rounded-md border border-border bg-muted/50 p-3 text-sm">{children}</p>; }
