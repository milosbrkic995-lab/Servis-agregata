"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BrowserNotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setBusy(true);
    const result = await Notification.requestPermission();
    setPermission(result);
    setBusy(false);
  }

  const enabled = permission === "granted";
  const disabled = permission === "denied";

  return (
    <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">{enabled ? <Bell size={18} /> : <BellOff size={18} />}</span>
        <div className="min-w-0"><h2 className="text-sm font-semibold">Obaveštenja na uređaju</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{enabled ? "Dozvoljena su u ovom pregledaču." : disabled ? "Blokirana su u podešavanjima pregledača." : permission === "unsupported" ? "Ovaj pregledač ne podržava sistemska obaveštenja." : "Dozvolite prikaz servisnih obaveštenja na telefonu."}</p></div>
      </div>
      {!enabled && !disabled && permission !== "unsupported" ? <Button variant="outline" disabled={busy} onClick={enableNotifications} className="min-h-11 shrink-0">{busy ? "Sačekajte…" : "Uključi obaveštenja"}</Button> : null}
    </div>
  );
}
