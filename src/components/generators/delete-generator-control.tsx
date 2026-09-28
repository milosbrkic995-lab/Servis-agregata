"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteGenerator } from "@/app/actions";
import { Button } from "@/components/ui/button";

interface DeleteGeneratorControlProps {
  generatorId: string;
}

export function DeleteGeneratorControl({ generatorId }: DeleteGeneratorControlProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirmDelete() {
    setBusy(true);
    const result = await deleteGenerator(generatorId);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="grid justify-items-end gap-2">
      {confirming ? (
        <div role="alert" className="grid gap-2 rounded-md border border-destructive/25 bg-destructive/5 p-3 text-right">
          <p className="max-w-xs text-xs leading-5 text-muted-foreground">Brisanjem se uklanja i servisna istorija ovog agregata.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>Zadrži</Button>
            <Button variant="destructive" size="sm" disabled={busy} onClick={confirmDelete}>{busy ? "Uklanjanje…" : "Ukloni"}</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={() => setConfirming(true)}><Trash2 size={15} /> Ukloni agregat</Button>
      )}
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
