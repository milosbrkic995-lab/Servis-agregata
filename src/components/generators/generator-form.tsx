"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Clock3, Save, Zap } from "lucide-react";

import { saveGenerator } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import type { GeneratorFormValues, IntervalType, PowerUnit } from "@/lib/generator-types";

interface GeneratorFormProps {
  initialValues: GeneratorFormValues;
  isEditing?: boolean;
}

export function GeneratorForm({ initialValues, isEditing = false }: GeneratorFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof GeneratorFormValues>(key: K, value: GeneratorFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await saveGenerator(values);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(values.id ? `/dashboard/generators/${values.id}` : "/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Button variant="ghost" nativeButton={false} render={<Link href={isEditing && values.id ? `/dashboard/generators/${values.id}` : "/dashboard"} />} className="-ml-3 mb-4 min-h-10 gap-2 text-muted-foreground">
        <ArrowLeft size={17} /> Nazad
      </Button>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">KARTON OPREME · {isEditing ? "IZMENA" : "NOVI UNOS"}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{isEditing ? "Izmena agregata" : "Dodavanje agregata"}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Unesite podatke sa pločice i podesite način obračuna servisa.</p>
      </div>

      <form onSubmit={submit} className="grid gap-5">
        <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
            <span className="flex size-9 items-center justify-center rounded bg-primary/10 text-primary"><Zap size={18} /></span>
            <div><h2 className="font-semibold">Identifikacija agregata</h2><p className="text-xs text-muted-foreground">Podaci za prepoznavanje opreme.</p></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Naziv agregata" htmlFor="generator-name" required>
              <Input id="generator-name" value={values.name} onChange={(event) => update("name", event.target.value)} placeholder="npr. Rezervni agregat 1" required className="h-12" />
            </FormField>
            <FormField label="Proizvođač" htmlFor="manufacturer" required>
              <Input id="manufacturer" value={values.manufacturer} onChange={(event) => update("manufacturer", event.target.value)} placeholder="npr. Perkins" required className="h-12" />
            </FormField>
            <FormField label="Model" htmlFor="model" required>
              <Input id="model" value={values.model} onChange={(event) => update("model", event.target.value)} placeholder="Oznaka modela" required className="h-12" />
            </FormField>
            <FormField label="Serijski broj" htmlFor="serial" required>
              <Input id="serial" value={values.serialNumber} onChange={(event) => update("serialNumber", event.target.value)} placeholder="Sa fabričke pločice" required className="h-12 font-mono" />
            </FormField>
            <FormField label="Snaga" htmlFor="power" required>
              <Input id="power" type="number" inputMode="decimal" min="0.01" step="0.01" value={values.powerValue} onChange={(event) => update("powerValue", event.target.value)} required className="h-12" />
            </FormField>
            <div className="grid gap-2">
              <Label>Jedinica snage</Label>
              <RadioGroup value={values.powerUnit} onValueChange={(value) => update("powerUnit", value === "kW" ? "kW" : "kVA" as PowerUnit)} className="grid grid-cols-2 gap-2">
                <Choice value="kVA" label="kVA" selected={values.powerUnit === "kVA"} />
                <Choice value="kW" label="kW" selected={values.powerUnit === "kW"} />
              </RadioGroup>
            </div>
            <FormField label="Lokacija" htmlFor="location" required>
              <Input id="location" value={values.location} onChange={(event) => update("location", event.target.value)} placeholder="Objekat ili adresa" required className="h-12" />
            </FormField>
            <FormField label="Datum puštanja u rad" htmlFor="commissioned" required>
              <Input id="commissioned" type="date" value={values.commissionedAt} onChange={(event) => update("commissionedAt", event.target.value)} required className="h-12" />
            </FormField>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-border pb-4">
            <span className="flex size-9 items-center justify-center rounded bg-primary/10 text-primary"><Clock3 size={18} /></span>
            <div><h2 className="font-semibold">Plan održavanja</h2><p className="text-xs text-muted-foreground">Rok po kalendaru ili radnim satima.</p></div>
          </div>
          <RadioGroup value={values.intervalType} onValueChange={(value) => update("intervalType", value === "hours" ? "hours" : "calendar" as IntervalType)} className="mb-5 grid gap-2 sm:grid-cols-2">
            <Choice value="calendar" label="Po vremenu" description="Rok se računa u mesecima." selected={values.intervalType === "calendar"} />
            <Choice value="hours" label="Po radnim satima" description="Rok se računa po satu rada." selected={values.intervalType === "hours"} />
          </RadioGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            {values.intervalType === "calendar" ? (
              <FormField label="Servisni interval (meseci)" htmlFor="months" required>
                <Input id="months" type="number" min="1" max="120" step="1" value={values.intervalMonths} onChange={(event) => update("intervalMonths", event.target.value)} required className="h-12" />
              </FormField>
            ) : (
              <FormField label="Servisni interval (radni sati)" htmlFor="hours-interval" required>
                <Input id="hours-interval" type="number" min="1" step="1" value={values.intervalHours} onChange={(event) => update("intervalHours", event.target.value)} required className="h-12" />
              </FormField>
            )}
            <FormField label="Trenutno stanje (radni sati)" htmlFor="current-hours">
              <Input id="current-hours" type="number" min="0" step="0.1" value={values.currentHours} onChange={(event) => update("currentHours", event.target.value)} className="h-12" />
            </FormField>
            <FormField label="Podsetnik unapred (dana)" htmlFor="reminder-days">
              <Input id="reminder-days" type="number" min="0" max="365" step="1" value={values.reminderDays} onChange={(event) => update("reminderDays", event.target.value)} className="h-12" />
            </FormField>
          </div>
          <div className="mt-5 flex items-center justify-between gap-4 rounded-md border border-border bg-muted/50 p-4">
            <div className="min-w-0"><p className="text-sm font-medium">Podsetnici za ovaj agregat</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Prikaži servisne rokove u obaveštenjima.</p></div>
            <Switch checked={values.notificationsEnabled} onCheckedChange={(checked) => update("notificationsEnabled", checked)} aria-label="Uključi podsetnike za agregat" />
          </div>
        </section>

        {error ? <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p> : null}
        <div className="flex flex-col-reverse gap-3 pb-3 sm:flex-row sm:justify-end">
          <Button variant="outline" nativeButton={false} render={<Link href={isEditing && values.id ? `/dashboard/generators/${values.id}` : "/dashboard"} />} className="min-h-12 px-6">Odustani</Button>
          <Button type="submit" disabled={busy} className="min-h-12 gap-2 px-6"><Save size={17} />{busy ? "Čuvanje…" : isEditing ? "Sačuvaj izmene" : "Dodaj agregat"}</Button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  children,
  required = false,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return <div className="grid gap-2"><Label htmlFor={htmlFor}>{label}{required ? <span className="ml-1 text-primary">*</span> : null}</Label>{children}</div>;
}

function Choice({
  value,
  label,
  description,
  selected,
}: {
  value: string;
  label: string;
  description?: string;
  selected: boolean;
}) {
  return (
    <Label htmlFor={`choice-${value}`} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${selected ? "border-primary/50 bg-primary/5" : "border-border bg-background hover:bg-muted/60"}`}>
      <RadioGroupItem id={`choice-${value}`} value={value} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span> : null}
      </span>
      {selected ? <Check size={16} className="mt-0.5 shrink-0 text-primary" /> : null}
    </Label>
  );
}
