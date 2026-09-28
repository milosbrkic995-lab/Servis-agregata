"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bolt, Check, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, signIn, signUp } from "@/lib/auth-client";

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already") || lower.includes("exists")) return "Nalog sa ovom adresom već postoji.";
  if (lower.includes("password") || lower.includes("credential")) return "Adresa e-pošte ili lozinka nisu ispravni.";
  if (lower.includes("email")) return "Proverite adresu e-pošte i pokušajte ponovo.";
  return "Prijava nije uspela. Proverite podatke i pokušajte ponovo.";
}

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "forgot") {
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (result.error) throw new Error(result.error.message);
        setMessage("Ako nalog postoji, poslali smo uputstvo za promenu lozinke na vašu adresu.");
      } else if (mode === "signup") {
        const result = await signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
          callbackURL: "/dashboard",
        });
        if (result.error) throw new Error(result.error.message);
        router.replace("/dashboard");
        router.refresh();
      } else {
        const result = await signIn.email({
          email: email.trim(),
          password,
          rememberMe,
          callbackURL: "/dashboard",
        });
        if (result.error) throw new Error(result.error.message);
        router.replace("/dashboard");
        router.refresh();
      }
    } catch (caught) {
      setError(translateAuthError(caught instanceof Error ? caught.message : ""));
    } finally {
      setBusy(false);
    }
  }

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.78fr)]">
      <section className="relative hidden overflow-hidden bg-sidebar px-10 py-10 text-sidebar-foreground lg:flex lg:flex-col xl:px-16">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(var(--sidebar-border) 1px, transparent 1px), linear-gradient(90deg, var(--sidebar-border) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><Bolt size={22} /></span>
          <span>
            <span className="block text-sm font-bold tracking-[0.12em]">SERVISNI DNEVNIK</span>
            <span className="mt-1 block text-xs text-muted-foreground">Evidencija agregata</span>
          </span>
        </div>
        <div className="relative my-auto max-w-xl py-16">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-primary">PREGLED ODRŽAVANJA · 01</p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.12] tracking-tight xl:text-5xl">Svaki servisni rok, pod kontrolom.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">Pratite agregate, radne sate i istoriju servisa na jednom mestu — spremno za upotrebu na terenu.</p>
          <div className="mt-9 grid max-w-lg gap-3">
            {["Evidencija opreme i lokacija", "Servisni rokovi po datumu ili satima", "Pregled zabeleženih intervencija"].map((item) => (
              <div key={item} className="flex min-h-12 items-center gap-3 rounded-md border border-sidebar-border bg-sidebar/75 px-4 py-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-sidebar-primary/15 text-sidebar-primary"><Check size={14} /></span>
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-muted-foreground">RADNI PANEL <span className="px-2">·</span> SERVISNA EVIDENCIJA</p>
      </section>

      <section className="flex min-h-dvh items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground"><Bolt size={20} /></span>
            <span>
              <span className="block text-xs font-bold tracking-[0.12em]">SERVISNI DNEVNIK</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Evidencija agregata</span>
            </span>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex size-11 items-center justify-center rounded-md border border-primary/15 bg-primary/5 text-primary"><ShieldCheck size={22} /></div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{isForgot ? "OPORAVAK NALOGA" : isSignup ? "NOVI NALOG" : "PRISTUP EVIDENCIJI"}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{isForgot ? "Zaboravljena lozinka" : isSignup ? "Napravite nalog" : "Dobro došli"}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{isForgot ? "Poslaćemo vam link za postavljanje nove lozinke." : isSignup ? "Unesite podatke da biste započeli evidenciju opreme." : "Prijavite se da biste nastavili do svojih agregata."}</p>
            <form onSubmit={submit} className="mt-6 grid gap-4">
              {isSignup ? <div className="grid gap-2"><Label htmlFor="account-name">Ime i prezime</Label><Input id="account-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required className="h-12" /></div> : null}
              <div className="grid gap-2"><Label htmlFor="account-email">Adresa e-pošte</Label><Input id="account-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-12" /></div>
              {!isForgot ? (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3"><Label htmlFor="account-password">Lozinka</Label>{!isSignup ? <Button type="button" variant="link" onClick={() => { setMode("forgot"); setError(""); setMessage(""); }} className="h-auto p-0 text-xs font-medium">Zaboravili ste lozinku?</Button> : null}</div>
                  <Input id="account-password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required className="h-12" />
                  {isSignup ? <p className="text-xs text-muted-foreground">Najmanje 8 karaktera.</p> : null}
                </div>
              ) : null}
              {!isSignup && !isForgot ? <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground"><Checkbox checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />Zapamti me na ovom uređaju</label> : null}
              {error ? <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">{error}</p> : null}
              {message ? <p role="status" className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-primary">{message}</p> : null}
              <Button type="submit" disabled={busy} className="mt-1 h-12 w-full gap-2 text-sm font-semibold">{busy ? "Sačekajte…" : isForgot ? "Pošalji link za promenu" : isSignup ? "Napravi nalog" : "Prijavi se"}{!busy ? <ArrowRight size={17} /> : null}</Button>
            </form>
            <div className="mt-5 border-t border-border pt-4 text-center text-sm text-muted-foreground">
              {isForgot ? <Button type="button" variant="link" onClick={() => { setMode("signin"); setMessage(""); setError(""); }} className="h-auto p-0 font-semibold">Vrati se na prijavu</Button> : (
                <p>{isSignup ? "Već imate nalog?" : "Nemate nalog?"}{" "}<Button type="button" variant="link" onClick={() => { setMode(isSignup ? "signin" : "signup"); setError(""); setMessage(""); }} className="h-auto p-0 font-semibold">{isSignup ? "Prijavite se" : "Napravite nalog"}</Button></p>
              )}
            </div>
          </div>
          {!isForgot ? <Link href="/demo" className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted">Pogledajte demonstracioni primer <ArrowRight size={16} /></Link> : null}
          <p className="mt-5 text-center text-[11px] leading-5 text-muted-foreground">Vaši podaci o opremi vidljivi su samo sa vašeg naloga.</p>
        </div>
      </section>
    </main>
  );
}
