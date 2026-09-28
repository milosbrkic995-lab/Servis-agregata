import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Plus, Wrench } from "lucide-react";

import { BrowserNotificationDispatcher } from "@/components/dashboard/browser-notification-dispatcher";
import { GeneratorCard } from "@/components/dashboard/generator-card";
import { Button } from "@/components/ui/button";
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
  const displayDate = new Intl.DateTimeFormat("sr-Latn-RS", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Belgrade",
  }).format(new Date());

  return (
    <>
      <BrowserNotificationDispatcher notifications={pendingNotifications} />
      <div className="flex flex-col gap-6">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{displayDate}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Pregled održavanja</h1>
            <p className="mt-1 text-sm text-muted-foreground">Stanje svih vaših agregata na jednom mestu.</p>
          </div>
          <Button nativeButton={false} render={<Link href="/dashboard/generators/new" />} className="min-h-12 gap-2 self-start px-5 sm:self-auto">
            <Plus size={18} /> Dodaj agregat
          </Button>
        </section>

        <section aria-label="Sažetak održavanja" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Ukupno agregata" value={data.generators.length} icon={<Wrench size={18} />} tone="neutral" />
          <SummaryCard label="Servis uskoro" value={dueSoon} icon={<CalendarDays size={18} />} tone="primary" />
          <SummaryCard label="Zakasneli servisi" value={overdue} icon={<AlertTriangle size={18} />} tone="danger" />
          <SummaryCard label="U redovnom roku" value={healthy} icon={<CheckCircle2 size={18} />} tone="neutral" />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Vaši agregati</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Izaberite agregat za servisni karton i istoriju.</p>
            </div>
            <span className="shrink-0 rounded-sm border border-border bg-card px-2.5 py-1 font-mono text-[11px] text-muted-foreground">{String(data.generators.length).padStart(2, "0")} KOM</span>
          </div>
          {data.generators.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.generators.map((generator) => <GeneratorCard key={generator.id} generator={generator} />)}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card px-5 py-12 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-md bg-primary/5 text-primary"><Wrench size={23} /></span>
              <h2 className="mt-4 text-base font-semibold">Još nema evidentiranih agregata</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Dodajte prvi agregat da biste pratili servisne rokove, radne sate i istoriju održavanja.</p>
              <Button nativeButton={false} render={<Link href="/dashboard/generators/new" />} className="mt-5 min-h-11 gap-2">
                <Plus size={17} /> Dodaj prvi agregat <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </section>

        {!data.settings.remindersEnabled ? (
          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-primary" />
            <p className="leading-6">Podsetnici su trenutno isključeni. Možete ih ponovo uključiti u <Link className="font-semibold text-primary underline underline-offset-4" href="/dashboard/settings">podešavanjima</Link>.</p>
          </div>
        ) : null}
      </div>
    </>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "neutral" | "primary" | "danger";
}) {
  const iconClass = tone === "danger" ? "text-destructive" : tone === "primary" ? "text-primary" : "text-muted-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <span className={iconClass}>{icon}</span>
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold tracking-tight">{String(value).padStart(2, "0")}</p>
    </div>
  );
}
