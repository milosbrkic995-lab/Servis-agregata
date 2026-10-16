import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft, MessageSquareText, Send } from "lucide-react";
import { notFound } from "next/navigation";

import { db } from "@/db";
import { clients, serviceRequestMessages, serviceRequests } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { sendClientServiceRequestMessageAction } from "../actions";

const statusLabels: Record<string,string> = { new:"Primljen", in_progress:"U obradi", scheduled:"Servis zakazan", resolved:"Rešen", closed:"Zatvoren" };
const fmt = (date: Date) => new Intl.DateTimeFormat("sr-Latn-RS", { dateStyle:"medium", timeStyle:"short" }).format(date);
type Props = { params: Promise<{ id:string }>; searchParams: Promise<{ status?:string }> };
export default async function ClientServiceRequestDetailPage({ params, searchParams }: Props) {
  const { id } = await params; const { status } = await searchParams; const currentUser = await requireUser();
  const clientRows = await db.select({ id:clients.id }).from(clients).where(eq(clients.userId,currentUser.id)).limit(1); const client=clientRows[0];
  if (!client) notFound();
  const requestRows = await db.select().from(serviceRequests).where(and(eq(serviceRequests.id,id),eq(serviceRequests.clientId,client.id))).limit(1);
  const request=requestRows[0]; if (!request) notFound();
  const messages = await db.select().from(serviceRequestMessages).where(eq(serviceRequestMessages.requestId,id)).orderBy(asc(serviceRequestMessages.createdAt));
  return <div className="mx-auto max-w-4xl space-y-6">
    <Link href="/dashboard/requests" className="inline-flex min-h-9 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Moji zahtevi</Link>
    <section className="rounded-xl border border-border bg-card p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Servisni zahtev · {fmt(request.createdAt)}</p><h1 className="mt-2 text-2xl font-bold tracking-tight">{request.subject}</h1><p className="mt-2 text-sm text-muted-foreground">{request.generatorNameSnapshot} · SN {request.generatorSerialSnapshot}</p></div><span className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold">{statusLabels[request.status] ?? request.status}</span></div><p className="mt-5 whitespace-pre-wrap text-sm leading-7">{request.description}</p><p className={`mt-4 text-xs font-semibold ${request.urgency === "urgent" ? "text-destructive" : "text-muted-foreground"}`}>{request.urgency === "urgent" ? "HITAN ZAHTEV" : "Redovan zahtev"}</p></section>
    {status === "created" ? <p role="status" className="rounded-md border border-border bg-muted/50 p-3 text-sm">Zahtev je poslat.</p> : null}{status === "reply-sent" ? <p role="status" className="rounded-md border border-border bg-muted/50 p-3 text-sm">Poruka je poslata servisnom timu.</p> : null}{status === "message-invalid" ? <p role="alert" className="rounded-md border border-destructive/30 p-3 text-sm text-destructive">Unesi poruku od najmanje dva znaka.</p> : null}
    <section><div className="mb-3 flex items-center gap-2"><MessageSquareText size={19} className="text-primary"/><h2 className="text-lg font-semibold">Razgovor sa servisom</h2></div><div className="space-y-3">{messages.length ? messages.map((message) => <article key={message.id} className={`rounded-xl border p-4 ${message.authorRole === "admin" ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-semibold text-sm">{message.authorName} <span className="font-normal text-muted-foreground">· {message.authorRole === "admin" ? "J&B POWER" : "Komitent"}</span></p><time className="text-xs text-muted-foreground">{fmt(message.createdAt)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.message}</p></article>) : <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">Servisni tim još nije poslao odgovor.</div>}</div></section>
    {request.status !== "closed" ? <form action={sendClientServiceRequestMessageAction} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:p-5"><input type="hidden" name="requestId" value={request.id}/><label className="grid gap-1.5 text-sm"><span className="font-medium">Odgovor / dodatne informacije</span><textarea name="message" required minLength={2} maxLength={3000} rows={3} className="rounded-md border border-input bg-background px-3 py-2" placeholder="Dodaj odgovor ili dopunu opisa problema..."/></label><div className="flex justify-end"><button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"><Send size={15}/> Pošalji poruku</button></div></form> : <p className="rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">Ovaj zahtev je zatvoren. Kontaktiraj servis ako želiš da nastaviš razgovor.</p>}
  </div>;
}
