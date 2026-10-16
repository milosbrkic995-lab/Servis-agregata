"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Bolt, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, getSession, signIn } from "@/lib/auth-client";

export function AdminAuthScreen() {
  const router=useRouter();
  const [mode,setMode]=useState<"signin"|"forgot">("signin");
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [message,setMessage]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const normalizedEmail=email.trim().toLowerCase();
    try {
      if(mode === "forgot") {
        const result=await authClient.requestPasswordReset({email:normalizedEmail,redirectTo:`${window.location.origin}/reset-password`});
        if(result.error) throw result.error;
        setMessage("Ako administratorski nalog postoji, poslali smo uputstvo za promenu lozinke na tu adresu.");
      } else {
        const result=await signIn.email({email:normalizedEmail,password,callbackURL:"/admin"});
        if(result.error) { setError("Prijava nije uspela. Proverite email i lozinku administratorskog naloga."); return; }
        const session=await getSession();
        if(session.error) throw session.error;
        if(!session.data?.user) { setError("Prijava nije mogla da se dovrši. Otvorite stranicu u novom tabu i pokušajte ponovo."); return; }
        router.replace("/admin"); router.refresh();
      }
    } catch { setError("Radnja nije uspela. Proverite podatke i pokušajte ponovo."); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-8"><div className="w-full max-w-md"><Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowRight className="rotate-180" size={15}/> Portal komitenta</Link><div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8"><div className="mb-6 flex size-11 items-center justify-center rounded-md border border-primary/15 bg-primary/5 text-primary"><ShieldCheck size={22}/></div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary"><Bolt size={15}/> J&amp;B POWER</div><h1 className="mt-3 text-2xl font-bold tracking-tight">{mode === "forgot" ? "Oporavak lozinke" : "Prijava administratora"}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Ova stranica je namenjena isključivo administratorskom nalogu.</p><form onSubmit={submit} className="mt-6 grid gap-4"><div className="grid gap-2"><Label htmlFor="admin-email">Administratorski email</Label><Input id="admin-email" type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} required className="h-12"/></div>{mode === "signin" ? <div className="grid gap-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="admin-password">Lozinka</Label><Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={()=>{setMode("forgot");setError("");setMessage("");}}>Zaboravljena lozinka?</Button></div><Input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} required className="h-12"/></div> : null}{error ? <p role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}{message ? <p role="status" className="rounded-md border border-border bg-muted/50 p-3 text-sm">{message}</p> : null}<Button type="submit" disabled={busy} className="h-12 w-full">{busy ? "Sačekajte…" : mode === "forgot" ? "Pošalji uputstvo" : "Prijavi se kao administrator"}</Button></form>{mode === "forgot" ? <Button type="button" variant="link" className="mt-4 h-auto w-full" onClick={()=>{setMode("signin");setError("");setMessage("");}}>Vrati se na prijavu</Button> : null}</div><p className="mt-4 text-center text-xs text-muted-foreground">Ne pokušavajte prijavu komitenta na ovoj stranici.</p></div></main>;
}
