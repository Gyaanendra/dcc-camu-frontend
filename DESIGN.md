---
name: Club DCC Camu — Attendance & Analytics Portal
description: A warmly-editorial product UI — cream canvas, warm ink, one scarce orange accent, hairline-only depth, Inter + JetBrains Mono — adapted from the Cursor brand register to a product register with a warm-dark counterpart.

colors:
  primary: "#f54e00"
  primary-active: "#d04200"
  on-primary: "#ffffff"
  ink: "#26251e"
  body: "#5a5852"
  muted: "#807d72"
  muted-soft: "#a09c92"
  canvas: "#f7f7f4"
  canvas-soft: "#fafaf7"
  surface-card: "#ffffff"
  surface-strong: "#e6e5e0"
  hairline: "#e6e5e0"
  hairline-soft: "#efeee8"
  hairline-strong: "#cfcdc4"
  semantic-success: "#1f8a65"
  semantic-error: "#cf2d56"
  semantic-warning: "#b45309"
  semantic-live: "#1f8a65"
  dark-canvas: "#191813"
  dark-card: "#201f19"
  dark-ink: "#f5f4ee"
  dark-body: "#c9c6bc"
  dark-muted: "#a8a49a"
  dark-secondary: "#28271f"
  dark-hairline: "#34332a"

typography:
  page-title:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  section-title:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-lg:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  kicker:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.08em
    textTransform: uppercase
  button:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  mono:
    fontFamily: "var(--font-mono), 'JetBrains Mono', monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  metric:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  pill: 9999px

spacing:
  xs: 8px
  sm: 12px
  base: 16px
  md: 20px
  lg: 24px
  xl: 32px
  section: 48px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 10px 18px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 9px 17px
  button-download:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 44px
    padding: 12px 20px
  text-input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 10px 14px
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
  badge-pill:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.ink}"
    typography: "{typography.kicker}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 56px
---

## Overview

Club DCC Camu adopts the Cursor editorial identity — **warm cream canvas, warm near-black ink, one scarce orange accent, hairline-only depth** — translated from a marketing register to a **product register**. What that means concretely:

- The page floor is cream `{colors.canvas}`, never pure white; cards are pure white `{colors.surface-card}` so content floats on the canvas by contrast, not shadow.
- Ink `{colors.ink}` is warm (#26251e), not pure black, and carries headings at weight 600 (product tables and dense UI need the hierarchy; the "display stays at 400" rule is a marketing luxury we consciously drop).
- **DCC Orange `{colors.primary}` is the single brand voltage**: primary CTAs, active/selected states, focus rings, and the interactive accent. Never decoration, never a second action color.
- **Hairline-only depth.** No drop shadows anywhere. Cards are 1px `{colors.hairline}` outlines.
- Every code-like surface — roll numbers, QR tokens, emails, timestamps — renders in JetBrains Mono (`--font-mono`).
- The app ships a **warm-dark counterpart** (`{colors.dark-canvas}` … `{colors.dark-hairline}`) instead of Cursor's light-only site, because members use it in dim lecture halls. Same ink/orange logic, warm-dark surfaces.

## Colors

### Brand
- **DCC Orange** `{colors.primary}` (#f54e00): primary CTAs, active nav, selected items, focus ring, links. Scarce — one orange element per view cluster.
- **Orange Active** `{colors.primary-active}` (#d04200): press/hover state.

### Surfaces
- **Canvas** `{colors.canvas}` (#f7f7f4): page floor (light). **Canvas Soft** `{colors.canvas-soft}`: subtle inset fills.
- **Card** `{colors.surface-card}` (#ffffff): all cards, inputs, modals.
- **Surface Strong** `{colors.surface-strong}` (#e6e5e0): badges, secondary buttons tint, table headers.
- Dark equivalents: canvas `{colors.dark-canvas}`, card `{colors.dark-card}`, secondary `{colors.dark-secondary}`.

### Hairlines
1px only: `{colors.hairline}` (default), `{colors.hairline-soft}` (subtle dividers), `{colors.hairline-strong}` (inputs, hovered card outlines). Dark: `{colors.dark-hairline}`.

### Text
- **Ink** `{colors.ink}`: headings, emphasized values.
- **Body** `{colors.body}`: running text.
- **Muted** `{colors.muted}`: metadata, captions. **Muted Soft** `{colors.muted-soft}`: disabled only.

### Semantic (state, never decoration)
Success/Live `{colors.semantic-success}`, Error/Destructive `{colors.semantic-error}`, Late/Warning `{colors.semantic-warning}`. Used at ~10% tint backgrounds with 20% borders and full-strength text.

## Typography

**Inter** (`--font-sans`) is the working family (CursorGothic's open substitute per the source spec). **JetBrains Mono** (`--font-mono`) on every code surface.

| Token | Size / Weight | Use |
|---|---|---|
| `{typography.page-title}` | 24px / 600 / -0.01em | Page h1 |
| `{typography.metric}` | 24px / 600 / tabular | KPI numbers |
| `{typography.section-title}` | 16px / 600 | Card & section titles, h2/h3 |
| `{typography.body-lg}` | 16px / 400 | Long reading text |
| `{typography.body-md}` | 14px / 400 | Working text: table cells, form labels, list rows, buttons |
| `{typography.caption}` | 12px / 400 | Metadata, helper text |
| `{typography.kicker}` | 11px / 600 / +0.08em / uppercase | One page-header label per page, no more |
| `{typography.mono}` | 13px JetBrains Mono | Roll numbers, tokens, emails, timestamps |

**Scaling rules:** fixed rem scale (no clamp — product UI). 14px is the working minimum for content; 12px only for metadata; nothing below 11px. Body base is 16px. `tabular-nums` on all metrics and counts. Line height 1.4–1.5 everywhere.

## Elevation

**None.** Hairlines + white-card-on-cream-canvas carry all depth. Modals use a scrim (`ink` at ~30%) with backdrop blur — the only "elevation" in the system. Hover raises a card's border to `{colors.hairline-strong}`, never a shadow.

## Components

- **Card** (`card`): white, 1px hairline, 12px radius (`{rounded.lg}`), 24px padding. Class: `dash-card`.
- **Buttons**: primary = orange (`{components.button-primary}`, 40px, 8px radius, 14px/500); secondary = white with `{colors.hairline-strong}` border; destructive = error token at 10% tint. All have hover, active, disabled (50% opacity), and a 2px orange focus ring.
- **Text inputs** (`{components.text-input}`): white, hairline-strong border, 8px radius, 40px height, 14px text, mono variant for roll numbers/tokens/emails.
- **Nav**: top bar 56px on cream; sidebar/drawer links 14px/500, active = orange text on 10% orange tint.
- **Tables**: header row `{colors.surface-strong}` at 60% with `{typography.kicker}` labels; rows 14px, hover = canvas-soft; 1px hairline row dividers.
- **Status pills**: `{components.badge-pill}` shape; semantic colors at 10% tint; LIVE uses a pulsing success dot.
- **Charts**: ink axis labels, hairline gridlines, team colors on bars only; tooltips = white card, hairline, 8px radius.

## Do's and Don'ts

**Do**
- Use DCC Orange for exactly one thing per cluster: the primary action or the current selection.
- Keep depth hairline-only; radius 8px on controls, 12px on cards.
- Render roll numbers, tokens, emails, and timestamps in JetBrains Mono.
- Bump density down (not type down) on mobile — same 14px minimum, wider gaps.

**Don't**
- Don't add a second brand action color or use orange decoratively.
- Don't use drop shadows, gradients, or glass effects.
- Don't ship content text below 14px (metadata 12px, kickers 11px are the floor).
- Don't uppercase anything except the single kicker and status pills.
- Don't tint neutrals cool — warmth lives in the neutrals (hue ~50) as much as in the orange.
