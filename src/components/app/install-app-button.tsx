"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

import { Button } from "@/components/ui/button";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installEvent) {
      setShowInstructions((visible) => !visible);
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setIsInstalled(true);
    setInstallEvent(null);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">{isIOS ? <Share size={18} /> : <Download size={18} />}</span>
        <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">Dodaj na početni ekran</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Aplikacija se otvara kao cel ekran na telefonu.</p></div>
        {!isInstalled ? <Button variant="outline" onClick={install} className="min-h-10 shrink-0">{installEvent ? "Instaliraj" : "Uputstvo"}</Button> : <span className="shrink-0 text-xs font-semibold text-primary">Dodato</span>}
      </div>
      {showInstructions ? (
        <p className="mt-3 rounded-md bg-muted p-3 text-xs leading-5 text-muted-foreground">
          {isIOS ? "U Safariju dodirnite Deli, zatim izaberite Dodaj na početni ekran." : "U meniju pregledača izaberite Instaliraj aplikaciju ili Dodaj na početni ekran."}
        </p>
      ) : null}
    </div>
  );
}
