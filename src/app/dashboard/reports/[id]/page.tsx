import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Clock3, Printer, Wrench, Zap } from "lucide-react";

import { getGeneratorDetails } from "@/lib/generator-data";
import { formatShortDate, getServiceStatus, getStatusLabel } from "@/lib/generator-utils";
import { PrintReportButton } from "@/components/reports/print-report-button";

type Props = { params: Promise<{ id:string }> };
export default async function GeneratorReportPage({ params }: Props) {
  const { id } = await params;
  const result = await getGeneratorDetails(id);
  if (!result) notFound();
  const { generator, records } = result;
  const status = getServiceStatus(generator);
  return <div className="mx-auto max-w-4xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden"><Link href={`/dashboard/generators/${generator.id}`} className="inline-flex min-h-9 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Nazad na agregat</Link><PrintReportButton/></div>
    <header className="border-b-2 border-foreground pb-5"><p className="text-xs font-bold uppercase tracking-[0.18em]">J&amp;B POWER · SERVISNI DNEVNIK</p><h1 className="mt-3 text-3xl font-bold">Servisni izveštaj agregata</h1><p className="mt-2 text-sm text-muted-foreground">Izveštaj generisan {new Intl.DateTimeFormat("sr-Latn-RS", { dateStyle:"long" }).format(new Date())}</p></header>
    <section className="rounded-lg border border-border p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold"><Zap size={18}/> Identifikacija opreme</h2><dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2"><Info label="Naziv agregata" value={generator.name}/><Info label="Proizvođač" value={generator.manufacturer}/><Info label="Model motora" value={generator.model}/><Info label="Serijski broj motora" value={generator.serialNumber}/><Info label="Serijski broj agregata" value={generator.generatorSerialNumber || "Nije unet"}/><Info label="Kontroler" value={generator.controller || "Nije unet"}/><Info label="Godina proizvodnje" value={generator.manufacturingYear ? String(generator.manufacturingYear) : "Nije uneta"}/><Info label="Snaga" value={`${generator.powerValue} ${generator.powerUnit}`}/><Info label="Lokacija" value={generator.location}/><Info label="Radni sati" value={`${generator.currentHours.toLocaleString("sr-Latn-RS")} h`}/><Info label="Režim rada" value={generator.operatingMode === "auto" ? "Auto mod" : generator.operatingMode === "manual" ? "Ručni mod" : "Zastoj"}/><Info label="Pušten u rad" value={formatShortDate(generator.commissionedAt)}/></dl></section>
    <section className="rounded-lg border border-border p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold"><CalendarClock size={18}/> Servisni status</h2><dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2"><Info label="Trenutni status" value={getStatusLabel(status)}/><Info label="Sledeći servis" value={formatShortDate(generator.nextServiceDate)}/><Info label="Servisni interval" value={generator.intervalType === "hours" ? `${generator.intervalHours ?? "Nije podešeno"} radnih sati` : `${generator.intervalMonths ?? "Nije podešeno"} meseci`}/><Info label="Radni sati pri poslednjem servisu" value={generator.lastServiceHours === null ? "Nije evidentirano" : `${generator.lastServiceHours.toLocaleString("sr-Latn-RS")} h`}/></dl></section>
    <section className="rounded-lg border border-border p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold"><Wrench size={18}/> Istorija servisa ({records.length})</h2>{records.length ? <div className="divide-y divide-border">{records.map((record)=><article key={record.id} className="py-4 first:pt-0 last:pb-0"><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-semibold">Servis obavljen</p><time className="text-sm text-muted-foreground">{formatShortDate(record.completedAt)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{record.workNotes || "Bez dodatnih napomena."}</p>{record.hoursAtService !== null ? <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 size={14}/> Radni sati: {record.hoursAtService.toLocaleString("sr-Latn-RS")} h</p> : null}</article>)}</div> : <p className="text-sm text-muted-foreground">Za ovaj agregat još nema evidentirane servisne istorije.</p>}</section>
    <footer className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">Izveštaj prikazuje podatke i servisne zapise koji su trenutno sačuvani u portalu. Za štampu izaberite „Sačuvaj kao PDF“ u dijalogu pregledača.<span className="hidden print:block"> · J&amp;B POWER</span></footer>
  </div>;
}
function Info({label,value}:{label:string;value:string}) { return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>; }
