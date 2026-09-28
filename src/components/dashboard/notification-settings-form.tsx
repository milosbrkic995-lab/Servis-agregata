"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Mail, Save } from "lucide-react";

import { updateNotificationSettings } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { UserSettings } from "@/lib/generator-types";

interface NotificationSettingsFormProps {
  settings: UserSettings;
}

export function NotificationSettingsForm({ settings }: NotificationSettingsFormProps) {
  const router = useRouter();
  const [remindersEnabled, setRemindersEnabled] = useState(settings.remindersEnabled);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(settings.emailNotificationsEnabled);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const result = await updateNotificationSettings({ remindersEnabled, emailNotificationsEnabled });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? "Podešavanja su sačuvana.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <div className="mb-5 flex items-center gap-3 border-b border-border pb-4"><span className="flex size-9 items-center justify-center rounded bg-primary/10 text-primary"><BellRing size={18} /></span><div><h2 className="font-semibold">Podsetnici za servis</h2><p className="text-xs text-muted-foreground">Birajte kako će se rokovi prikazivati.</p></div></div>
      <div className="divide-y divide-border">
        <SettingToggle title="Uključi podsetnike" description="Prikaži rokove u pregledu i evidenciji obaveštenja." checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
        <SettingToggle title="Pošalji i e-poštu" description="E-pošta se šalje kada aplikacija proveri dospeli rok pri otvaranju." checked={emailNotificationsEnabled} onCheckedChange={setEmailNotificationsEnabled} icon={<Mail size={16} />} disabled={!remindersEnabled} />
      </div>
      <div className="mt-4 rounded-md border border-border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
        Rokovi se proveravaju kada otvorite aplikaciju. Automatsko slanje podsetnika dok je aplikacija zatvorena nije uključeno.
      </div>
      {message ? <p role="status" className="mt-3 text-sm text-primary">{message}</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={busy} className="mt-4 min-h-11 gap-2"><Save size={16} />{busy ? "Čuvanje…" : "Sačuvaj podešavanja"}</Button>
    </form>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  onCheckedChange,
  icon,
  disabled = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-1 last:pb-1">
      <div className="min-w-0"><p className="flex items-center gap-2 text-sm font-medium">{icon ? <span className="text-muted-foreground">{icon}</span> : null}{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-label={title} />
    </div>
  );
}
