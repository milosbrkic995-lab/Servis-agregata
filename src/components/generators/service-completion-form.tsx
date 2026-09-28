"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Wrench } from "lucide-react";

import { recordService } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { IntervalType } from "@/lib/generator-types";

interface ServiceCompletionFormProps {
  generatorId: string;
  today: string;
  currentHours: number;
  intervalType: IntervalType;
}

export function ServiceCompletionForm({ generatorId, today, currentHours, intervalType }: ServiceCompletionFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [completedAt, setCompletedAt] = useState(today);
  const [hoursAtService, setHoursAtService] = useState(String(currentHours));
  const [workNotes, setWorkNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await recordService({ generatorId, completedAt, hoursAtService, workNotes });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setWorkNotes("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return <Button className="min-h-12 w-full gap-2 text-sm font-semibold" onClick={() => setOpen(true)}><Wrench size={17} /> Servis obavljen</Button>;
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg border border-primary/25 bg-primary/5 p-4">
      <div><h3 className="font-semibold">Evidentirajte servis</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Upis se dodaje u istoriju i pomera sledeći rok.</p></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor="service-date">Datum servisa</Label><Input id="service-date" type="date" value={completedAt} onChange={(event) => setCompletedAt(event.target.value)} required className="h-11 bg-card" /></div>
        {intervalType === "hours" ? <div className="grid gap-2"><Label htmlFor="service-hours">Radni sati pri servisu</Label><Input id="service-hours" type="number" min="0" step="0.1" value={hoursAtService} onChange={(event) => setHoursAtService(event.target.value)} required className="h-11 bg-card" /></div> : null}
      </div>
      <div className="grid gap-2"><Label htmlFor="service-notes">Radovi i napomene</Label><Textarea id="service-notes" value={workNotes} onChange={(event) => setWorkNotes(event.target.value)} placeholder="npr. Zamena filtera ulja, kontrola rashladne tečnosti…" rows={3} maxLength={2000} className="resize-y bg-card" /></div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="min-h-11">Otkaži</Button>
        <Button type="submit" disabled={busy} className="min-h-11 gap-2"><Check size={16} />{busy ? "Čuvanje…" : "Sačuvaj servis"}</Button>
      </div>
    </form>
  );
}
