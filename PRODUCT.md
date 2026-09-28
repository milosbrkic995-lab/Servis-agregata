<!-- Generated from .project/PROJECT.md by the engine — do not run `impeccable init`, which would interview a user who isn't here. Edit .project/PROJECT.md; this file is regenerated from it. -->
# Servisni dnevnik agregata

**Platform:** Responsive web — Next.js, React, Tailwind. shadcn/ui and lucide are installed and available; the direction decides whether they fit or whether this surface needs its own vocabulary.
**Task mode:** Operate (pass as `--mode operate` to any script)

## What this is

Mobilna veb-aplikacija na srpskom za evidenciju generatora, servisnih rokova i istorije održavanja.

## What it enables

Vlasnicima opreme i servisnim timovima olakšava da prate agregate, očitavaju radne sate i ne izgube pregled nad sledećim servisom.

## Primary user

Mali i srednji operateri objekata, upravnici i servisni tehničari koji vode evidenciju jednog ili više agregata.

## What exists today

Registracija, prijava, zapamti me, reset lozinke i odjava. - Privatna evidencija agregata sa podacima o modelu, snazi, lokaciji i datumu puštanja u rad. - Servisni interval po mesecima ili radnim satima, očitavanje brojila i servisna istorija. - Pregled stanja, in-app obaveštenja i opcionalna e-pošta koja se šalje kada aplikacija proveri rok. - PWA manifest, registracija service worker-a i kontrole za instaliranje i dozvolu obaveštenja. - Javno dostupan demonstracioni pregled sa jasno označenim ilustrativnim podacima.

## Brand commitments & durable constraints

Veb-aplikacija, mobilno prilagođena, sav interfejs i tekst na srpskom (latinica). - Demonstracioni podaci nisu podaci korisnika. - Rokovi se proveravaju kada je aplikacija otvorena; ne tvrditi da se obaveštenja šalju dok je aplikacija zatvorena. - Čelično-plava i siva industrijska paleta, veliki terenski tasteri i čitljiv tekst.

- **This project already HAS a committed visual world — do NOT offer a design picker.** `.project/DESIGN_SYSTEM.md` records a direction someone decided on, and the code, tokens and components are built around it. Read it, inherit it, and make the requested change inside it. Dealing six alternative worlds here offers to throw away a working design system nobody asked you to replace.
- **Tailoring is not redesigning.** "Make it about my business", new copy, a different logo, swapped imagery, a brand colour — all of that lands INSIDE the committed world. Change what was asked for and leave the direction alone.
- **The one exception is an explicit, whole-app redesign** — the user asking for a different look outright, not merely a change that happens to be large. Then the direction is open again and the picker applies. When they name the new direction themselves, that is the decision: pin it and build, still without a picker.
- The user's own words always outrank the roll. A direction, palette, face or reference they named is pinned; the roll only decides what they left open.
- Two review rounds is the budget, then ship and report open items honestly under the reviewer's own verdict — never announce a table with open findings as a pass.
- Web fonts load through Fontsource, never `next/font/google` — this sandbox has no Google egress, so the fetch hangs at compile and the preview renders blank.
- No AI-builder badge, watermark, or attribution anywhere in the product.
- Decisions recorded in `.project/` (ledger, DESIGN_SYSTEM.md) are commitments; contradict one only when the user asks.

## Positioning

Mobilna veb-aplikacija na srpskom za evidenciju generatora, servisnih rokova i istorije održavanja.

## Operating Context

Responsive web, built unattended in one pass. Task mode: Operate.

## Evidence on Hand

Registracija, prijava, zapamti me, reset lozinke i odjava. - Privatna evidencija agregata sa podacima o modelu, snazi, lokaciji i datumu puštanja u rad. - Servisni interval po mesecima ili radnim satima, očitavanje brojila i servisna istorija. - Pregled stanja, in-app obaveštenja i opcionalna e-pošta koja se šalje kada aplikacija proveri rok. - PWA manifest, registracija service worker-a i kontrole za instaliranje i dozvolu obaveštenja. - Javno dostupan demonstracioni pregled sa jasno označenim ilustrativnim podacima.

## Product Principles

- Clarity of the task beats decoration; the interface earns attention only where the product does.
- Say what is true: no invented prices, customers, benchmarks or capabilities the product does not have.
