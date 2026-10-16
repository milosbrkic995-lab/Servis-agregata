import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, count, eq } from "drizzle-orm";
import { ArrowLeft, Building2, Mail, MapPin, Phone, Zap } from "lucide-react";

import { db } from "@/db";
import { clients, generators } from "@/db/schema";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clientRows = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  const client = clientRows[0];
  if (!client) notFound();

  // Deliberately filter by this client's ID: never show the entire generator registry here.
  const [clientGenerators, totalRows] = await Promise.all([
    db.select({
      id: generators.id,
      name: generators.name,
      manufacturer: generators.manufacturer,
      model: generators.model,
      serialNumber: generators.serialNumber,
      powerValue: generators.powerValue,
      powerUnit: generators.powerUnit,
      location: generators.location,
      commissionedAt: generators.commissionedAt,
      currentHours: generators.currentHours,
      nextServiceDate: generators.nextServiceDate,
    })
      .from(generators)
      .where(eq(generators.clientId, client.id))
      .orderBy(asc(generators.name)),
    db.select({ value: count() }).from(generators).where(eq(generators.clientId, client.id)),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/admin/clients" className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted">
        <ArrowLeft size={16} /> Svi komitenti
      </Link>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Master panel · karton komitenta</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{client.name}</h2>
            {client.company ? <p className="mt-1 text-sm text-muted-foreground">{client.company}</p> : null}
          </div>
          <div className="rounded-lg border border-border bg-background px-4 py-3">
            <p className="text-xs text-muted-foreground">Dodeljeni agregati</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{totalRows[0]?.value ?? clientGenerators.length}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
          <Info icon={<Mail size={16} />} label="Email" value={client.email} />
          {client.phone ? <Info icon={<Phone size={16} />} label="Telefon" value={client.phone} /> : null}
          {client.address ? <Info icon={<MapPin size={16} />} label="Adresa / lokacija" value={client.address} /> : null}
          {client.pib ? <Info icon={<Building2 size={16} />} label="PIB" value={client.pib} /> : null}
        </div>
        {client.notes ? <div className="mt-4 rounded-md bg-muted/50 p-3"><p className="text-xs font-semibold text-muted-foreground">Interna napomena</p><p className="mt-1 whitespace-pre-wrap text-sm">{client.notes}</p></div> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/admin/generators" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Zap size={16} /> Upravljaj agregatima
          </Link>
          <Link href="/admin/work-orders" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted">
            Pregled radnih naloga
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-xl font-semibold">Agregati komitenta</h3>
          <p className="mt-1 text-sm text-muted-foreground">Prikazani su samo agregati koji su dodeljeni komitentu {client.name}.</p>
        </div>
        {clientGenerators.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {clientGenerators.map((generator) => (
              <article key={generator.id} className="rounded-lg border border-border bg-card p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/5 text-primary"><Zap size={21} /></span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold">{generator.name}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{generator.manufacturer} · {generator.model}</p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                  <div><dt className="text-xs text-muted-foreground">Serijski broj</dt><dd className="mt-1 break-all font-medium">{generator.serialNumber}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Snaga</dt><dd className="mt-1 font-medium">{generator.powerValue} {generator.powerUnit}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Lokacija</dt><dd className="mt-1">{generator.location}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Radni sati</dt><dd className="mt-1">{generator.currentHours.toLocaleString("sr-Latn-RS")} h</dd></div>
                  <div className="col-span-2"><dt className="text-xs text-muted-foreground">Sledeći servis</dt><dd className="mt-1">{generator.nextServiceDate ? new Intl.DateTimeFormat("sr-Latn-RS").format(new Date(`${generator.nextServiceDate}T12:00:00`)) : "Nije određen"}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card px-5 py-12 text-center">
            <Zap size={24} className="mx-auto text-muted-foreground" />
            <h4 className="mt-3 font-semibold">Nema dodeljenih agregata</h4>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">Dodaj agregat u registru ili otvori postojeći agregat i izaberi ovog komitenta u polju „Dodeli komitentu”.</p>
            <Link href="/admin/generators" className="mt-4 inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-muted">Otvori registar agregata</Link>
          </div>
        )}
      </section>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex min-w-0 items-start gap-2.5"><span className="mt-0.5 text-primary">{icon}</span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium">{value}</p></div></div>;
}
