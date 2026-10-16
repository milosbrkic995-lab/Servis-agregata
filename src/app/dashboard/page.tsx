import { AlertTriangle, CalendarDays, CheckCircle2, Wrench } from "lucide-react";

import { GeneratorCard } from "@/components/dashboard/generator-card";
import { BrowserNotificationDispatcher } from "@/components/dashboard/browser-notification-dispatcher";
import { getDashboardData, getPendingBrowserNotifications } from "@/lib/generator-data";
import { getServiceStatus } from "@/lib/generator-utils";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const pendingNotifications = await getPendingBrowserNotifications();
  const overdue = data.generators.filter((generator) => getServiceStatus(generator) === "overdue").length;
  const dueSoon = data.generators.filter((generator) => {
    const status = getServiceStatus(generator);
    return status === "today" || status === "upcoming";
  }).length;
  const healthy = data.generators.length - overdue - dueSoon;

  return (
    <>
      <BrowserNotificationDispatcher notifications={pendingNotifications} />
      <div className="flex flex-col gap-6">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Portal komitenta</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Moji agregati</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pregled agregata i servisnih rokova povezanih sa vašim nalogom.</p>
        </section>
        <section aria-label="Sažetak održavanja" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Ukupno agregata" value={data.generators.length} icon={<Wrench size={18} />} />
          <SummaryCard label="Servis uskoro" value={dueSoon} icon={<CalendarDays size={18} />} />
          <SummaryCard label="Zakasneli servisi" value={overdue} icon={<AlertTriangle size={18} />} />
          <SummaryCard label="U redovnom roku" value={healthy} icon={<CheckCircle2 size={18} />} />
        </section>
        <section>
          <div className="mb-3"><h2 className="text-lg font-semibold tracking-tight">Vaši agregati</h2><p className="mt-0.5 text-xs text-muted-foreground">Izaberite agregat za tehnički karton i dostupnu servisnu istoriju.</p></div>
          {data.generators.length ? <div className="grid gap-3 lg:grid-cols-2">{data.generators.map((generator) => <GeneratorCard key={generator.id} generator={generator} />)}</div> : <div className="rounded-lg border border-dashed border-border bg-card px-5 py-12 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-md bg-primary/5 text-primary"><Wrench size={23} /></span><h2 className="mt-4 text-base font-semibold">Nema agregata povezanih sa nalogom</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Kada administrator poveže vaše podatke i agregate sa ovim nalogom, prikazaće se ovde.</p></div>}
        </section>
      </div>
    </>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="rounded-lg border border-border bg-card p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-medium text-muted-foreground">{label}</p><span className="text-muted-foreground">{icon}</span></div><p className="mt-3 font-mono text-3xl font-semibold tracking-tight">{String(value).padStart(2, "0")}</p></div>;
}
