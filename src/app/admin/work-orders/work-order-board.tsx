"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, CheckSquare, ClipboardList, Clock3, Search, SlidersHorizontal, Zap } from "lucide-react";

import { createBulkServiceRecordAction } from "./actions";

type ServiceStatus = "overdue" | "today" | "upcoming" | "current";

type GeneratorRow = {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  generatorSerialNumber: string | null;
  powerValue: number;
  powerUnit: string;
  location: string;
  currentHours: number;
  intervalType: string;
  intervalHours: number | null;
  lastServiceHours: number | null;
  nextServiceDate: string | null;
  reminderDays: number;
  operatingMode: string;
  clientId: string | null;
  clientName: string | null;
  serviceStatus: ServiceStatus;
};

type Props = { generators: GeneratorRow[]; today: string };

const statusText: Record<ServiceStatus, string> = {
  overdue: "Kasni servis",
  today: "Servis danas",
  upcoming: "Uskoro",
  current: "U roku",
};

const statusClass: Record<ServiceStatus, string> = {
  overdue: "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
  today: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  upcoming: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  current: "border-border bg-muted/50 text-muted-foreground",
};

function dateLabel(value: string | null) {
  if (!value) return "Nije određeno";
  return new Intl.DateTimeFormat("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function WorkOrderBoard({ generators, today }: Props) {
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const clients = useMemo(() => {
    const map = new Map<string, string>();
    for (const generator of generators) {
      if (generator.clientId && generator.clientName) map.set(generator.clientId, generator.clientName);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "sr"));
  }, [generators]);

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("sr-Latn-RS");
    return generators.filter((g) => {
      const haystack = [g.name, g.manufacturer, g.model, g.serialNumber, g.generatorSerialNumber ?? "", g.location, g.clientName ?? ""].join(" ").toLocaleLowerCase("sr-Latn-RS");
      if (q && !haystack.includes(q)) return false;
      if (clientFilter !== "all" && g.clientId !== clientFilter) return false;
      if (assignmentFilter === "assigned" && !g.clientId) return false;
      if (assignmentFilter === "unassigned" && g.clientId) return false;
      if (statusFilter === "overdue" && g.serviceStatus !== "overdue") return false;
      if (statusFilter === "soon" && !["today", "upcoming"].includes(g.serviceStatus)) return false;
      if (statusFilter === "current" && g.serviceStatus !== "current") return false;
      return true;
    });
  }, [generators, search, clientFilter, assignmentFilter, statusFilter]);

  const selected = useMemo(() => generators.filter((g) => selectedIds.includes(g.id)), [generators, selectedIds]);
  const overdueCount = generators.filter((g) => g.serviceStatus === "overdue").length;
  const soonCount = generators.filter((g) => g.serviceStatus === "today" || g.serviceStatus === "upcoming").length;
  const unassignedCount = generators.filter((g) => !g.clientId).length;
  const visibleAllSelected = visible.length > 0 && visible.every((g) => selectedIds.includes(g.id));

  function toggleGenerator(id: string, checked: boolean) {
    setSelectedIds((current) => checked ? (current.includes(id) ? current : [...current, id]) : current.filter((item) => item !== id));
  }

  function toggleVisible() {
    setSelectedIds((current) => visibleAllSelected
      ? current.filter((id) => !visible.some((g) => g.id === id))
      : [...new Set([...current, ...visible.map((g) => g.id)])]);
  }

  return (
    <form action={createBulkServiceRecordAction} className="space-y-5">
      {/* Keep checked items selected even when search or filters hide their rows. */}
      {selectedIds.map((id) => <input key={`selected-${id}`} type="hidden" name="generatorIds" value={id} />)}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Svi agregati" value={generators.length} icon={<Zap size={18} />} />
        <Metric label="Servis kasni" value={overdueCount} icon={<AlertTriangle size={18} />} />
        <Metric label="Servis uskoro" value={soonCount} icon={<Clock3 size={18} />} />
        <Metric label="Bez komitenta" value={unassignedCount} icon={<ClipboardList size={18} />} />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="font-semibold">Globalni pregled agregata</h3><p className="mt-1 text-sm text-muted-foreground">Označi jedan ili više agregata za servis. U tabeli su agregati svih komitenata i agregati bez dodele.</p></div>
            <span className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold">Izabrano: {selectedIds.length}</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="relative block"><span className="sr-only">Pretraži agregate</span><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pretraga: naziv, SN, lokacija..." className="min-h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"/></label>
            <label className="grid gap-1"><span className="sr-only">Filtriraj po komitentu</span><select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Svi komitenti</option>{clients.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
            <label className="grid gap-1"><span className="sr-only">Filtriraj po dodeli</span><select value={assignmentFilter} onChange={(e) => setAssignmentFilter(e.target.value)} className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Dodeljeni i nedodeljeni</option><option value="assigned">Samo dodeljeni</option><option value="unassigned">Samo bez komitenta</option></select></label>
            <label className="grid gap-1"><span className="sr-only">Filtriraj po servisnom statusu</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="all">Svi servisni statusi</option><option value="overdue">Servis kasni</option><option value="soon">Servis danas ili uskoro</option><option value="current">Servis u roku</option></select></label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>Prikazano {visible.length} od {generators.length} agregata</span><button type="button" onClick={toggleVisible} disabled={!visible.length} className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-border px-3 font-medium text-foreground hover:bg-muted disabled:opacity-40"><CheckSquare size={14}/>{visibleAllSelected ? "Poništi izbor prikazanih" : "Označi sve prikazane"}</button></div>
        </div>

        {visible.length ? <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="w-12 px-4 py-3"><span className="sr-only">Izbor</span></th><th className="px-4 py-3">Agregat</th><th className="px-4 py-3">Komitent</th><th className="px-4 py-3">Lokacija</th><th className="px-4 py-3">Sati</th><th className="px-4 py-3">Sledeći servis</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-border">{visible.map((g) => {
          const isSelected = selectedIds.includes(g.id);
          return <tr key={g.id} className={isSelected ? "bg-primary/5" : "hover:bg-muted/30"}>
            <td className="px-4 py-3"><input aria-label={`Izaberi agregat ${g.name}`} type="checkbox" name="generatorIds" value={g.id} checked={isSelected} onChange={(e) => toggleGenerator(g.id, e.target.checked)} className="size-4 accent-primary"/></td>
            <td className="px-4 py-3"><p className="font-semibold">{g.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{g.manufacturer} {g.model}</p><p className="mt-0.5 font-mono text-xs text-muted-foreground">SN {g.serialNumber}</p></td>
            <td className="px-4 py-3">{g.clientName ?? <span className="text-muted-foreground">Bez dodele / J&amp;B POWER</span>}</td>
            <td className="px-4 py-3">{g.location || "—"}</td>
            <td className="whitespace-nowrap px-4 py-3 tabular-nums">{g.currentHours.toLocaleString("sr-Latn-RS")} h</td>
            <td className="whitespace-nowrap px-4 py-3">{dateLabel(g.nextServiceDate)}</td>
            <td className="px-4 py-3"><span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass[g.serviceStatus]}`}>{statusText[g.serviceStatus]}</span></td>
          </tr>;
        })}</tbody></table></div> : <div className="px-5 py-12 text-center"><Search size={22} className="mx-auto text-muted-foreground"/><p className="mt-3 font-semibold">Nema agregata za izabrane filtere</p><p className="mt-1 text-sm text-muted-foreground">Promeni pretragu ili filtere.</p></div>}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Podaci radnog naloga</h3><p className="mt-1 text-sm text-muted-foreground">Datum i opis važe za sve označene agregate. Radne sate proveri posebno za svaki agregat.</p></div><span className="rounded-md bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">{selected.length} agregata izabrano</span></div>
        {selected.length ? <div className="mt-4 overflow-x-auto rounded-lg border border-border"><table className="w-full min-w-[580px] text-left text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-3 py-2.5">Izabrani agregat</th><th className="px-3 py-2.5">Komitent</th><th className="px-3 py-2.5">Radni sati pri servisu</th><th className="w-10 px-3 py-2.5"><span className="sr-only">Ukloni</span></th></tr></thead><tbody className="divide-y divide-border">{selected.map((g) => <tr key={g.id}><td className="px-3 py-3"><p className="font-semibold">{g.name}</p><p className="mt-0.5 text-xs text-muted-foreground">SN {g.serialNumber}</p></td><td className="px-3 py-3">{g.clientName ?? "Bez dodele"}</td><td className="px-3 py-3"><input aria-label={`Radni sati ${g.name}`} name={`hoursAtService_${g.id}`} type="number" min="0" step="0.1" defaultValue={String(g.currentHours)} required={g.intervalType === "hours"} className="min-h-9 w-40 rounded-md border border-input bg-background px-3 tabular-nums"/></td><td className="px-3 py-3"><button type="button" onClick={() => toggleGenerator(g.id, false)} aria-label={`Ukloni ${g.name}`} className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground">×</button></td></tr>)}</tbody></table></div> : <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-8 text-center"><Check size={22} className="mx-auto text-muted-foreground"/><p className="mt-2 text-sm font-medium">Prvo označi agregate u tabeli iznad</p><p className="mt-1 text-xs text-muted-foreground">Možeš izabrati nekoliko agregata odjednom, čak i ako pripadaju različitim komitentima.</p></div>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm"><span className="font-medium">Datum servisa *</span><input name="completedAt" type="date" required max={today} defaultValue={today} className="min-h-10 rounded-md border border-input bg-background px-3"/></label>
          <label className="grid gap-1.5 text-sm sm:col-span-2"><span className="font-medium">Opis izvršenih radova / zajednička napomena</span><textarea name="workNotes" rows={3} maxLength={2000} placeholder="Npr. redovan servis, zamena filtera, provera rashladnog sistema..." className="rounded-md border border-input bg-background px-3 py-2"/></label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className="max-w-xl text-xs leading-5 text-muted-foreground">Sačuvavanjem se za svaki izabrani agregat posebno dodaje zapis u servisnu istoriju. Jedna greška pri čuvanju poništi ceo grupni unos.</p><button type="submit" disabled={!selected.length} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"><ClipboardList size={17}/>Sačuvaj servis za {selected.length || "izabrane"} agregata</button></div>
      </section>
    </form>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="rounded-lg border border-border bg-card p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{label}</p><span className="text-primary">{icon}</span></div><p className="mt-2 font-mono text-3xl font-semibold tabular-nums">{value.toLocaleString("sr-Latn-RS")}</p></div>;
}
