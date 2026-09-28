---
name: "Servisni dnevnik agregata"
description: "Mobilna veb-aplikacija na srpskom za evidenciju generatora, servisnih rokova i istorije održavanja."
colors:
  background: "oklch(0.965 0.012 245)"
  foreground: "oklch(0.245 0.035 252)"
  card: "oklch(0.995 0.004 245)"
  card-foreground: "oklch(0.245 0.035 252)"
  popover: "oklch(0.995 0.004 245)"
  popover-foreground: "oklch(0.245 0.035 252)"
  primary: "oklch(0.43 0.105 245)"
  primary-foreground: "oklch(0.985 0.004 245)"
  secondary: "oklch(0.925 0.018 245)"
  secondary-foreground: "oklch(0.29 0.045 250)"
  muted: "oklch(0.935 0.016 245)"
  muted-foreground: "oklch(0.49 0.035 252)"
  accent: "oklch(0.89 0.035 235)"
  accent-foreground: "oklch(0.27 0.06 248)"
  destructive: "oklch(0.52 0.19 27)"
  border: "oklch(0.86 0.024 245)"
  input: "oklch(0.86 0.024 245)"
  ring: "oklch(0.48 0.09 245)"
  sidebar-ring: "oklch(0.65 0.09 230)"
  sidebar-border: "oklch(0.36 0.04 250)"
  sidebar-accent-foreground: "oklch(0.96 0.008 245)"
  sidebar-accent: "oklch(0.31 0.045 250)"
  sidebar-primary-foreground: "oklch(0.22 0.04 252)"
  sidebar-primary: "oklch(0.72 0.11 226)"
typography:
  display:
    fontFamily: "system sans, bold and compact."
  body:
    fontFamily: "system sans with generous line spacing."
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

Industrial service desk: a field-maintenance ledger on steel-blue surfaces, a navy instrument rail, status-stamped cards and oversized controls.

## Colors

| Token | Value |
| background | `oklch(0.965 0.012 245)` |
| surface | `oklch(0.995 0.004 245)` |
| text / muted | `oklch(0.245 0.035 252)` / `oklch(0.49 0.035 252)` |
| border | `oklch(0.86 0.024 245)` |
| primary | `oklch(0.43 0.105 245)` |
| accent | `oklch(0.89 0.035 235)` |
| success / warning / danger | `oklch(0.57 0.08 184)` / `oklch(0.69 0.11 76)` / `oklch(0.52 0.19 27)` |

Declared in `globals.css` as `--color-*` and mirrored in the frontmatter. Use the token, never a raw hex.

## Typography

- Headings: system sans, bold and compact.
- Body: system sans with generous line spacing.
- Technical readings: system monospace.

- Display: `system sans, bold and compact.`
- Body: `system sans with generous line spacing.`
- Mono: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`

## Layout

- Radius / shadow / spacing rhythm: 10px cards, fine steel borders, restrained shadow, 4px spacing rhythm.
- Shared components: themed shadcn controls, status badges, generator cards, mobile bottom navigation.

## Shapes

Radii: `sm` calc(var(--radius) * 0.6), `md` calc(var(--radius) * 0.8), `lg` 0.625rem, `xl` calc(var(--radius) * 1.4), `2xl` calc(var(--radius) * 1.8), `3xl` calc(var(--radius) * 2.2), `4xl` calc(var(--radius) * 2.6)

## Do's and Don'ts

- Voice: Serbian Latin, direct and operational. Use clear maintenance terms, short labels and truthful reminder descriptions.

- Do load faces through Fontsource, not `next/font/google`.
- Don't introduce a colour or radius that isn't a token above.
- Don't use gradient text, or a purple/violet gradient as the brand signal.
- Don't use bounce or elastic easing; real objects decelerate smoothly.
