"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bolt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

interface ResetPasswordScreenProps {
  token: string;
}

export function ResetPasswordScreen({ token }: ResetPasswordScreenProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setMessage("Link za promenu lozinke nije važeći. Zatražite novi link.");
      return;
    }
    setBusy(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) throw new Error(result.error.message);
      setMessage("Lozinka je promenjena. Sada možete da se prijavite.");
      window.setTimeout(() => router.replace("/"), 900);
    } catch {
      setMessage("Promena nije uspela. Zatražite novi link za promenu lozinke.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-8">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <span className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground"><Bolt size={20} /></span>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">SERVISNI DNEVNIK</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Postavite novu lozinku</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Izaberite lozinku od najmanje 8 karaktera.</p>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-password">Nova lozinka</Label>
            <Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12" />
          </div>
          {message ? <p role="status" className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-primary">{message}</p> : null}
          <Button type="submit" disabled={busy || !token} className="h-12 gap-2">{busy ? "Sačekajte…" : "Sačuvaj novu lozinku"}<ArrowRight size={17} /></Button>
        </form>
      </section>
    </main>
  );
}
