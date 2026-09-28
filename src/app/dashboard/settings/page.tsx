import { Settings2, UserRound } from "lucide-react";

import { InstallAppButton } from "@/components/app/install-app-button";
import { BrowserNotificationSettings } from "@/components/dashboard/browser-notification-settings";
import { NotificationSettingsForm } from "@/components/dashboard/notification-settings-form";
import { getSettingsForCurrentUser } from "@/lib/generator-data";
import { getUser } from "@/lib/auth";

export default async function SettingsPage() {
  const [settings, user] = await Promise.all([getSettingsForCurrentUser(), getUser()]);
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><Settings2 size={19} /></span>
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">NALOG I UREĐAJ</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Podešavanja</h1><p className="mt-1 text-sm text-muted-foreground">Upravljajte nalogom i servisnim obaveštenjima.</p></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded bg-muted text-primary"><UserRound size={18} /></span><div><h2 className="font-semibold">Profil</h2><p className="text-xs text-muted-foreground">Podaci povezani sa vašim nalogom.</p></div></div>
          <dl className="grid gap-3 border-t border-border pt-4 text-sm"><div><dt className="text-xs text-muted-foreground">Ime i prezime</dt><dd className="mt-1 font-medium">{user?.name || "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Adresa e-pošte</dt><dd className="mt-1 break-all font-medium">{user?.email || "—"}</dd></div></dl>
        </section>
        <InstallAppButton />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <NotificationSettingsForm settings={settings} />
        <BrowserNotificationSettings />
      </div>
      <div className="mt-5 rounded-lg border border-border bg-muted/50 p-4 text-xs leading-5 text-muted-foreground">
        Servisni intervali i broj dana za najavu podešavaju se posebno za svaki agregat u njegovom servisnom kartonu.
      </div>
    </div>
  );
}
