"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Gauge, Save } from "lucide-react";

import { updateGeneratorHours } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HoursReadingFormProps {
  generatorId: string;
  currentHours: number;
}

export function HoursReadingForm({ generatorId, currentHours }: HoursReadingFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(String(currentHours));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await updateGeneratorHours(generatorId, value);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded bg-muted text-primary"><Gauge size={18} /></span>
        <div><h2 className="text-sm font-semibold">Stanje radnih sati</h2><p className="text-xs text-muted-foreground">Ažurirajte očitavanje sa brojila.</p></div>
      </div>
      <div className="grid gap-2"><Label htmlFor="hours-reading">Trenutno stanje (h)</Label><Input id="hours-reading" type="number" min="0" step="0.1" value={value} onChange={(event) => setValue(event.target.value)} required className="h-11" /></div>
      {error ? <p role="alert" className="mt-2 text-xs text-destructive">{error}</p> : null}
      <Button type="submit" variant="outline" disabled={busy} className="mt-3 min-h-10 gap-2"><Save size={15} />{busy ? "Čuvanje…" : "Sačuvaj stanje"}</Button>
    </form>
  );
}
