"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bolt, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSession, signIn, signUp } from "@/lib/auth-client";
import { validateClientPibAccess, linkClientPibAccess } from "@/app/client-access-actions";

export function AuthScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pib, setPib] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPib = pib.replace(/\D/g, "");
    try {
      const access = await validateClientPibAccess(normalizedEmail, normalizedPib);
      if (!access.ok) { setError("Email i PIB se ne poklapaju sa podacima u kartonu komitenta. Proverite unos ili kontaktirajte J&B POWER."); return; }
      if (access.accountExists) {
        const result = await signIn.email({ email: normalizedEmail, password: normalizedPib, rememberMe, callbackURL: "/dashboard" });
        if (result.error) { setError("Prijava nije uspela. Proverite email i PIB ili sačekajte ako je aktivirana privremena blokada."); return; }
      } else {
        const result = await signUp.email({ name: access.name, email: normalizedEmail, password: normalizedPib, callbackURL: "/dashboard" });
        if (result.error) throw result.error;
      }
      const linked = await linkClientPibAccess(normalizedPib);
      if (!linked.ok) { setError(linked.message || "Nije moguće povezati nalog sa kartonom komitenta."); return; }
      const session = await getSession();
      if (session.error) throw session.error;
      if (!session.data?.user) { setError("Prijava je prihvaćena, ali sesija nije sačuvana. Otvorite aplikaciju u novom tabu i pokušajte ponovo."); return; }
      router.replace("/dashboard"); router.refresh();
    } catch { setError("Prijava nije uspela. Proverite podatke i pokušajte ponovo."); }
    finally { setBusy(false); }
  }

  return <main className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.78fr)]">
    <section className="relative hidden overflow-hidden bg-sidebar px-10 py-10 text-sidebar-foreground lg:flex lg:flex-col xl:px-16"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(var(--sidebar-border) 1px, transparent 1px), linear-gradient(90deg, var(--sidebar-border) 1px, transparent 1px)", backgroundSize: "32px 32px" }}/><div className="relative flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><Bolt size={22}/></span><span><span className="block text-sm font-bold tracking-[0.12em]">SERVISNI DNEVNIK</span><span className="mt-1 block text-xs text-muted-foreground">Evidencija agregata</span></span></div><div className="relative my-auto max-w-xl py-16"><p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-primary">PORTAL KOMITENTA</p><h1 className="mt-5 text-4xl font-bold leading-[1.12] tracking-tight xl:text-5xl">Vaši agregati i servisi na jednom mestu.</h1><p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">Pratite tehničke podatke, servisne rokove, istoriju intervencija i odgovore servisnog tima.</p><div className="mt-9 grid max-w-lg gap-3">{["Pregled vaših agregata", "Servisni rokovi i obaveštenja", "Prijava kvara i praćenje zahteva"].map((item)=><div key={item} className="flex min-h-12 items-center gap-3 rounded-md border border-sidebar-border bg-sidebar/75 px-4 py-3 text-sm"><span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-sidebar-primary/15 text-sidebar-primary"><Check size={14}/></span>{item}</div>)}</div></div><p className="relative text-xs text-muted-foreground">J&amp;B POWER <span className="px-2">·</span> SERVISNA EVIDENCIJA</p></section>
    <section className="flex min-h-dvh items-center justify-center px-5 py-8 sm:px-8"><div className="w-full max-w-md"><div className="mb-8 flex items-center gap-3 lg:hidden"><span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground"><Bolt size={20}/></span><span><span className="block text-xs font-bold tracking-[0.12em]">SERVISNI DNEVNIK</span><span className="mt-0.5 block text-xs text-muted-foreground">Evidencija agregata</span></span></div><div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8"><div className="mb-6 flex size-11 items-center justify-center rounded-md border border-primary/15 bg-primary/5 text-primary"><ShieldCheck size={22}/></div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">PORTAL KOMITENTA</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Prijava komitenta</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Unesite email i PIB firme koje je J&amp;B POWER uneo u vaš karton. Nalog se otvara automatski pri prvoj prijavi.</p><form onSubmit={submit} className="mt-6 grid gap-4"><div className="grid gap-2"><Label htmlFor="account-email">Email adresa</Label><Input id="account-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event)=>setEmail(event.target.value)} required className="h-12"/></div><div className="grid gap-2"><Label htmlFor="account-pib">PIB firme</Label><Input id="account-pib" type="password" autoComplete="off" inputMode="numeric" value={pib} onChange={(event)=>setPib(event.target.value)} required className="h-12"/><p className="text-xs leading-5 text-muted-foreground">PIB se koristi kao pristupni podatak, pa ga čuvajte kao lozinku.</p></div><label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground"><Checkbox checked={rememberMe} onCheckedChange={(checked)=>setRememberMe(checked===true)}/>Zapamti me na ovom uređaju</label>{error ? <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{error}</p> : null}<Button type="submit" disabled={busy} className="mt-1 h-12 w-full gap-2 text-sm font-semibold">{busy ? "Sačekajte…" : "Prijavi se"}{!busy ? <ArrowRight size={17}/> : null}</Button></form></div></div></section>
  </main>;
}
