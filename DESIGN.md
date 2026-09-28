---
name: "workspace"
description: "Napravi kompletnu, funkcionalnu aplikaciju za praćenje servisnih intervala agregata (generatora). Aplikacija treba da radi na Androidu i iPhone-u (mobilni veb / PWA koju korisnik može da doda na početni ekran telefona, sa push obaveštenjima). Namena i tok rada: - Korisnik se registruje i prijavljuje na aplikaciju (nalog sa e-mailom i lozinkom, plus opcija \"zapamti me\" i \"zaboravljena lozinka\"). - Nakon prijave, korisnik unosi podatke o svom agregatu: naziv/model agregata, proizvođač, serijski broj, snaga (kVA/kW), lokacija, i datum prvog paljenja (datum puštanja u rad). - Korisnik takođe može da podesi interval servisa (npr. svakih 6 meseci, svakih 12 meseci, ili na osnovu broja radnih sati) i podsetnik koliko dana pre servisa želi obaveštenje (npr. 7 dana pre). - Aplikacija automatski prati vreme proteklo od datuma prvog paljenja i kada dođe vreme za servis, korisniku stiže obaveštenje (push notifikacija i/ili e-mail) sa porukom da je vreme za servis tog agregata. - Korisnik vidi listu svih svojih agregata sa statusom: \"Servis uskoro\", \"Servis danas\", \"Servis zakasnio\" i datumom sledećeg servisa. - Kada se servis obavi, korisnik klikne \"Servis obavljen\" i datum sledećeg servisa se automatski pomera za izabrani interval. Vodi se istorija servisa (šta je urađeno i kada). Glavni ekrani: 1. Prijava / Registracija 2. Početna (dashboard) — lista agregata sa statusom i sledećim servisom 3. Dodavanje / izmena agregata — forma sa podacima i datumom prvog paljenja 4. Detalji agregata — istorija servisa, sledeći servis, dugme \"Servis obavljen\" 5. Notifikacije — spisak poslatih obaveštenja 6. Podešavanja — profil, interval servisa, podsetnik (X dana pre), uključivanje/isključivanje obaveštenja Tehnički zahtevi: - Korisnici i svi podaci moraju da se čuvaju (registracija i podaci o agregatima se pamte između poseta), tako da je potreban backend ili lokalno čuvanje podataka koji traje. - Zakazano/automatsko slanje obaveštenja kada servis dospe (pozadinski zadatak koji proverava datume). - Mobilno prilagođen dizajn (responsive), jednostavan i čist interfejs na srpskom jeziku, jer se koristi na telefonu. - Prijatna, profesionalna industrijska tema (plava/siva paleta), krupna i čitljiva slova, velika dugmad pogodna za upotrebu na terenu. Aplikacija treba da bude spremna za korišćenje, sa demo nalogom da se odmah vidi kako izgleda jedan agregat i obaveštenje o servisu."
typography:
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, \"SF Mono\", Menlo, Consolas, \"Liberation Mono\", monospace"
rounded:
  sm: "calc(var(--radius) * 0.6)"
  md: "calc(var(--radius) * 0.8)"
  lg: "0.625rem"
  xl: "calc(var(--radius) * 1.4)"
  2xl: "calc(var(--radius) * 1.8)"
  3xl: "calc(var(--radius) * 2.2)"
  4xl: "calc(var(--radius) * 2.6)"
---

<!-- Generated from .project/DESIGN_SYSTEM.md + app/globals.css by the engine. Tokens above are normative and mirror the CSS; edit the CSS and DESIGN_SYSTEM.md, not this file. -->

## Overview

**No visual direction has been committed for workspace yet.** The project is still on the starter's placeholder palette — shadcn's default neutral, every colour zero-chroma — so it is deliberately NOT listed above as a token set to respect. Treat this project as greenfield: decide the world, then write the palette into `globals.css`, and this file will state it from the next turn onward.

## Colors

| Token | Value |

## Typography

- Headings:
- Body:

- Mono: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`

## Layout

- Radius / shadow / spacing rhythm:
- Shared components:

## Shapes

Radii: `sm` calc(var(--radius) * 0.6), `md` calc(var(--radius) * 0.8), `lg` 0.625rem, `xl` calc(var(--radius) * 1.4), `2xl` calc(var(--radius) * 1.8), `3xl` calc(var(--radius) * 2.2), `4xl` calc(var(--radius) * 2.6)

## Do's and Don'ts

- Do load faces through Fontsource, not `next/font/google`.
- Do write the direction's palette into `globals.css` as the token block; keep the token NAMES, replace the values.
- Don't use gradient text, or a purple/violet gradient as the brand signal.
- Don't use bounce or elastic easing; real objects decelerate smoothly.
