<!-- OWNER: Build (with the user) · READERS: every agent · READ THIS FIRST -->
# Servisni dnevnik agregata

**One-liner:** Mobilna veb-aplikacija na srpskom za evidenciju generatora, servisnih rokova i istorije održavanja.

## Goal
Vlasnicima opreme i servisnim timovima olakšava da prate agregate, očitavaju radne sate i ne izgube pregled nad sledećim servisom.

## Target users
Mali i srednji operateri objekata, upravnici i servisni tehničari koji vode evidenciju jednog ili više agregata.

## Status
- Stage: building
- Live URL: —
- Repo: —

## What exists today
- Registracija, prijava, zapamti me, reset lozinke i odjava.
- Privatna evidencija agregata sa podacima o modelu, snazi, lokaciji i datumu puštanja u rad.
- Servisni interval po mesecima ili radnim satima, očitavanje brojila i servisna istorija.
- Pregled stanja, in-app obaveštenja i opcionalna e-pošta koja se šalje kada aplikacija proveri rok.
- PWA manifest, registracija service worker-a i kontrole za instaliranje i dozvolu obaveštenja.
- Javno dostupan demonstracioni pregled sa jasno označenim ilustrativnim podacima.

## Constraints / must-nots
- Veb-aplikacija, mobilno prilagođena, sav interfejs i tekst na srpskom (latinica).
- Demonstracioni podaci nisu podaci korisnika.
- Rokovi se proveravaju kada je aplikacija otvorena; ne tvrditi da se obaveštenja šalju dok je aplikacija zatvorena.
- Čelično-plava i siva industrijska paleta, veliki terenski tasteri i čitljiv tekst.
