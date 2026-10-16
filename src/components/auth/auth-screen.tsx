"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bolt, Check, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, getSession, signIn, signUp } from "@/lib/auth-client";
import { validateClientPibAccess, linkClientPibAccess } from "@/app/client-access-actions";
import { describeAuthError } from "@/lib/errors";

function translateAuthError(input: unknown): string {
  const code = describeAuthError(input).code.toUpperCase();
  if (code === "INVALID_EMAIL_OR_PASSWORD" || code === "INVALID_PASSWORD") {
    return "Email ili lozinka nisu ispravni. Proverite podatke i pokušajte ponovo.";
  }
  if (code === "INVALID_EMAIL") return "Proverite email adresu i pokušajte ponovo.";
  if (code === "PASSWORD_TOO_SHORT") return "PIB nije ispravan ili je kraći od potrebnog minimuma.";
  if (code === "INVALID_ORIGIN" || code === "MISSING_OR_NULL_ORIGIN") {
    return "Prijava trenutno ne radi sa ove adrese. Pokušajte ponovo malo kasnije.";
  }
  return "Prijava nije uspela. Proverite podatke i pokušajte ponovo.";
}

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "client" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pib, setPib] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [standaloneLink, setStandaloneLink] = useState(false);

  async function continueToDashboard() {
    const session = await getSession();
    if (session.error) throw session.error;
    if (!session.data?.user) {
      if (window.self !== window.top) {
        setStandaloneLink(true);
        setError("Prijava je prihvaćena, ali pregledač nije sačuvao sesiju. Otvorite aplikaciju u novom tabu i prijavite se tamo.");
      } else {
        setError("Prijava nije mogla da se dovrši. Pokušajte ponovo.");
      }
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    setStandaloneLink(false);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === "forgot") {
        const result = await authClient.requestPasswordReset({
          email: normalizedEmail,
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (result.error) throw result.error;
        setMessage("Ako administratorski nalog postoji, poslali smo uputstvo za promenu lozinke na tu adresu.");
      } else if (mode === "client") {
        const access = await validateClientPibAccess(normalizedEmail, pib);
        if (!access.ok) {
          setError("Email i PIB se ne poklapaju sa podacima koje je administracija unela. Proverite unos ili kontaktirajte J&B POWER.");
          return;
        }

        if (access.accountExists) {
          const result = await signIn.email({
            email: normalizedEmail,
            password: pib.trim().replace(/\s+/g, ""),
            rememberMe,
            callbackURL: "/dashboard",
          });
          if (result.error) {
            setError("Za ovu email adresu već postoji nalog sa ranijim načinom prijave. Obratite se J&B POWER da pripremi pristup emailom i PIB-om.");
            return;
          }
        } else {
          const result = await signUp.email({
            name: access.name,
            email: normalizedEmail,
            password: pib.trim().replace(/\s+/g, ""),
            callbackURL: "/dashboard",
          });
          if (result.error) throw result.error;
        }

        const linked = await linkClientPibAccess(pib);
        if (!linked.ok) {
          setError(linked.message || "Nije moguće povezati nalog sa kartonom komitenta.");
          return;
        }
        await continueToDashboard();
      } else {
        const result = await signIn.email({
          email: normalizedEmail,
          password,
          rememberMe,
          callbackURL: "/dashboard",
        });
        if (result.error) throw result.error;
        await continueToDashboard();
      }
    } catch (caught) {
      setError(translateAuthError(caught));
    } finally {
      setBusy(false);
    }
  }

  const isClient = mode === "client";
  const isForgot = mode === "forgot";

  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.78fr)]">
      <section className="relative hidden overflow-hidden bg-sidebar px-10 py-10 text-sidebar-foreground lg:flex lg:flex-col xl:px-16">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(var(--sidebar-border) 1px, transparent 1px), linear-gradient(90deg, var(--sidebar-border) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><Bolt size={22} /></span>
          <span><span className="block text-sm font-bold tracking-[0.12em]">SERVISNI DNEVNIK</span><span className="mt-1 block text-xs text-muted-foreground">Evidencija agregata</span></span>
        </div>
        <div className="relative my-auto max-w-xl py-16">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-primary">PREGLED ODRŽAVANJA · 01</p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.12] tracking-tight xl:text-5xl">Svaki servisni rok, pod kontrolom.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">Pratite agregate, radne sate i istoriju servisa na jednom mestu — spremno za upotrebu na terenu.</p>
          <div className="mt-9 grid max-w-lg gap-3">
            {["Evidencija opreme i lokacija", "Servisni rokovi po datumu ili satima", "Pregled zabeleženih intervencija"].map((item) => (
              <div key={item} className="flex min-h-12 items-center gap-3 rounded-md border border-sidebar-border bg-sidebar/75 px-4 py-3 text-sm"><span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-sidebar-primary/15 text-sidebar-primary"><Check size={14} /></span>{item}</div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-muted-foreground">RADNI PANEL <span className="px-2">·</span> SERVISNA EVIDENCIJA</p>
      </section>

      <section className="flex min-h-dvh items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground"><Bolt size={20} /></span><span><span className="block text-xs font-bold tracking-[0.12em]">SERVISNI DNEVNIK</span><span className="mt-0.5 block text-xs text-muted-foreground">Evidencija agregata</span></span></div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex size-11 items-center justify-center rounded-md border border-primary/15 bg-primary/5 text-primary"><ShieldCheck size={22} /></div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{isForgot ? "OPORAVAK ADMIN NALOGA" : isClient ? "PORTAL KOMITENTA" : "ADMINISTRATORSKI PRISTUP"}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{isForgot ? "Zaboravljena lozinka" : isClient ? "Prijava komitenta" : "Dobro došli"}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{isForgot ? "Poslaćemo uputstvo za promenu administratorske lozinke." : isClient ? "Unesite email i PIB firme koje je J&B POWER uneo u karton komitenta. Nalog se otvara automatski pri prvoj prijavi." : "Prijavite se administratorskim emailom i lozinkom."}</p>
            <form onSubmit={submit} className="mt-6 grid gap-4">
              <div className="grid gap-2"><Label htmlFor="account-email">Email adresa</Label><Input id="account-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-12" /></div>
              {!isForgot ? (
                isClient ? (
                  <div className="grid gap-2"><Label htmlFor="account-pib">PIB firme</Label><Input id="account-pib" type="password" autoComplete="off" inputMode="numeric" value={pib} onChange={(event) => setPib(event.target.value)} required className="h-12" /><p className="text-xs leading-5 text-muted-foreground">PIB se koristi kao pristupni podatak, pa ga čuvajte kao lozinku.</p></div>
                ) : (
                  <div className="grid gap-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="account-password">Lozinka</Label><Button type="button" variant="link" onClick={() => { setMode("forgot"); setError(""); setMessage(""); setStandaloneLink(false); }} className="h-auto p-0 text-xs font-medium">Zaboravljena lozinka?</Button></div><Input id="account-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="h-12" /></div>
                )
              ) : null}
              {!isForgot ? <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground"><Checkbox checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />Zapamti me na ovom uređaju</label> : null}
              {error ? <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{error}</p> : null}
              {standaloneLink ? <Link href="/" target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 text-sm font-semibold text-primary">Otvori aplikaciju u novom tabu <ArrowRight size={16} /></Link> : null}
              {message ? <p role="status" className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-primary">{message}</p> : null}
              <Button type="submit" disabled={busy} className="mt-1 h-12 w-full gap-2 text-sm font-semibold">{busy ? "Sačekajte…" : isForgot ? "Pošalji uputstvo" : isClient ? "Prijavi se kao komitent" : "Prijavi se kao administrator"}{!busy ? <ArrowRight size={17} /> : null}</Button>
            </form>
            <div className="mt-5 border-t border-border pt-4 text-center text-sm text-muted-foreground">
              {isForgot ? <Button type="button" variant="link" onClick={() => { setMode("signin"); setMessage(""); setError(""); setStandaloneLink(false); }} className="h-auto p-0 font-semibold">Vrati se na administratorsku prijavu</Button> : (
                <p>{isClient ? "Administrator ste?" : "Komitent ste?"}{" "}<Button type="button" variant="link" onClick={() => { setMode(isClient ? "signin" : "client"); setError(""); setMessage(""); setStandaloneLink(false); }} className="h-auto p-0 font-semibold">{isClient ? "Prijava administratora" : "Prijava emailom i PIB-om"}</Button></p>
              )}
            </div>
          </div>
          <Link href="/demo" className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted">Pogledajte demonstracioni primer <ArrowRight size={16} /></Link>
          <p className="mt-5 text-center text-[11px] leading-5 text-muted-foreground">Pristup komitenta važi samo za agregate dodeljene njegovom kartonu.</p>
        </div>
      </section>
    </main>
  );
}
