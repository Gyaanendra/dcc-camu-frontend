---
name: Club DCC Camu — Attendance & Analytics Portal
description: A Notion-style professional product UI — neutral canvas, one scarce orange accent, hairline-only depth, Inter + JetBrains Mono — extended with bento grids, KPI hierarchies, financial-grade data widgets, and subtle interaction patterns from modern dashboard designs.

colors:
  primary: "#f54e00"
  primary-active: "#d04200"
  primary-subtle: "rgba(245,78,0,0.08)"
  primary-border: "rgba(245,78,0,0.20)"
  primary-highlight: "#f54e00"
  on-primary: "#ffffff"
  ink: "#37352F"
  body: "#37352F"
  muted: "#787774"
  muted-soft: "#9B9A97"
  canvas: "#FFFFFF"
  canvas-soft: "#F7F7F5"
  surface-card: "#ffffff"
  surface-strong: "#EFEFEF"
  hairline: "#ededed"
  hairline-soft: "#f1f1ef"
  hairline-strong: "#dcdcdc"
  semantic-success: "#1f8a65"
  semantic-success-subtle: "rgba(31,138,101,0.08)"
  semantic-error: "#cf2d56"
  semantic-error-subtle: "rgba(207,45,86,0.08)"
  semantic-warning: "#b45309"
  semantic-warning-subtle: "rgba(180,83,9,0.08)"
  semantic-live: "#1f8a65"
  chart-orange-fill: "rgba(245,78,0,0.12)"
  chart-orange-line: "#f54e00"
  chart-dark-line: "#191919"
  dark-canvas: "#191919"
  dark-card: "#191919"
  dark-sidebar: "#202020"
  dark-ink: "#D4D4D4"
  dark-body: "#D4D4D4"
  dark-muted: "#9B9B9B"
  dark-secondary: "#2F2F2F"
  dark-hairline: "#2e2e2e"

typography:
  page-title:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  hero-greeting:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
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
  sidebar-group-label:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0.06em
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
  metric-lg:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  metric-sm:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  delta-badge:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0
  card-inline-action:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  2xl: 20px
  pill: 9999px

spacing:
  xs: 8px
  sm: 12px
  base: 16px
  md: 20px
  lg: 24px
  xl: 32px
  section: 48px
  card-gap: 16px
  bento-gap: 12px
  sidebar-gap: 8px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: 40px
    padding: 10px 18px
  button-primary-pill:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: 38px
    padding: 8px 18px
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
  button-secondary-pill:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: 38px
    padding: 8px 16px
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
  card-highlight:
    backgroundColor: "{colors.primary-highlight}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.lg}"
    padding: 20px
  badge-pill:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.ink}"
    typography: "{typography.kicker}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  badge-delta-up:
    backgroundColor: "{colors.semantic-success-subtle}"
    textColor: "{colors.semantic-success}"
    typography: "{typography.delta-badge}"
    rounded: "{rounded.pill}"
    padding: 3px 8px
  badge-delta-down:
    backgroundColor: "{colors.semantic-error-subtle}"
    textColor: "{colors.semantic-error}"
    typography: "{typography.delta-badge}"
    rounded: "{rounded.pill}"
    padding: 3px 8px
  badge-filter-chip:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
    border: "1px solid {colors.hairline}"
  badge-nav-count:
    backgroundColor: "{colors.primary-subtle}"
    textColor: "{colors.primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 2px 7px
  badge-new-update:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    fontWeight: 600
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 56px
  top-nav-tab-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.pill}"
    padding: 6px 16px
  sidebar-nav-item-active:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.primary}"
    borderLeft: "2px solid {colors.primary}"
    typography: "{typography.nav-link}"
    rounded: "0 {rounded.md} {rounded.md} 0"
    padding: 8px 12px
  kpi-card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.lg}"
    padding: 20px
    border: "1px solid {colors.hairline}"
  period-selector:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    padding: 4px 8px
    border: "1px solid {colors.hairline}"
  filter-bar:
    backgroundColor: "{colors.canvas}"
    height: 44px
    borderBottom: "1px solid {colors.hairline}"
  avatar-strip:
    itemSize: 32px
    spacing: 12px
  progress-bar:
    height: 6px
    backgroundColor: "{colors.hairline}"
    fillColor: "{colors.primary}"
    rounded: "{rounded.pill}"
  progress-bar-target:
    height: 4px
    backgroundColor: "{colors.hairline}"
    fillColor: "{colors.primary}"
    rounded: "{rounded.pill}"
  donut-chart:
    strokeWidth: 10px
    trackColor: "{colors.hairline-soft}"
    fillColor: "{colors.primary}"
  gauge-chart:
    strokeWidth: 14px
    trackColor: "{colors.hairline-soft}"
    fillColor: "{colors.primary}"
  line-chart:
    strokeWidth: 2px
    strokeColor: "{colors.primary}"
    fillColor: "{colors.chart-orange-fill}"
    tooltipColor: "{colors.ink}"
  bar-chart:
    barWidth: 12px
    primaryBarColor: "{colors.primary}"
    secondaryBarColor: "{colors.ink}"
    borderRadius: "4px 4px 0 0"
  card-date-widget:
    backgroundColor: "{colors.canvas-soft}"
    rounded: "{rounded.pill}"
    padding: 6px 14px
    border: "1px solid {colors.hairline}"
  card-inline-action:
    textColor: "{colors.primary}"
    typography: "{typography.card-inline-action}"
  quick-link-grid:
    itemSize: 64px
    rounded: "{rounded.lg}"
    border: "1px solid {colors.hairline}"
    activeBorder: "1px solid {colors.primary}"
    activeBackground: "{colors.primary-subtle}"
  wallet-row:
    backgroundColor: "{colors.canvas-soft}"
    rounded: "{rounded.md}"
    padding: 10px 14px
    border: "1px solid {colors.hairline-soft}"
  credit-card-widget:
    backgroundColor: "{colors.dark-canvas}"
    textColor: "{colors.dark-ink}"
    rounded: "{rounded.xl}"
    padding: 20px
    border: "1px solid {colors.dark-hairline}"
  stat-pair:
    labelTypography: "{typography.kicker}"
    valueTypography: "{typography.metric-sm}"
---

## Overview

Club DCC Camu adopts a Notion-neutral identity — **neutral canvas, neutral text ramp, one scarce orange accent, hairline-only depth** — translated into a **product register**. What that means concretely:

- The page floor is white `{colors.canvas}`; the sidebar is `{colors.canvas-soft}` and hover fills are `{colors.surface-strong}`. Cards share the page white so separation comes from 1px hairlines, not tints or shadows.
- Text is the Notion ramp: primary `{colors.ink}`, secondary `{colors.muted}`, faint `{colors.muted-soft}` — never tinted warm or cool.
- **DCC Orange `{colors.primary}` is the single brand voltage**: primary CTAs, active/selected states, focus rings, and the interactive accent. Never decoration, never a second action color.
- **Hairline-only depth.** No drop shadows anywhere. Cards are 1px `{colors.hairline}` outlines.
- Every code-like surface — roll numbers, QR tokens, emails, timestamps — renders in JetBrains Mono (`--font-mono`).
- The app ships a **neutral-dark counterpart** (`{colors.dark-canvas}` page, `{colors.dark-sidebar}` sidebar, `{colors.dark-secondary}` hover) instead of a tinted dark theme, because members use it in dim lecture halls. Same text/accent logic, neutral-dark surfaces.

---

## Visual Study & Architecture from Reference Dashboards

Analysis of modern orange-accented financial and operations dashboards (**Financial Dashboard**, **Finexy**, and **Swiftpay**) reveals key structural and interaction patterns integrated into the DCC Camu design language:

### 1. Header & Greeting Register
- **Conversational Hero Header**: Dashboards open with a friendly, high-contrast greeting (`{typography.hero-greeting}`: 28px/700) such as *"Good Morning, Member"* or *"Hey, Need help?"* paired with a muted subhead (`{typography.body-md}`) describing active tasks and portal status.
- **Utility Action Ribbon**: Top bar integrates a compact date widget (e.g. `19 Tue, December`), a prominent primary pill CTA (`Show my Tasks →` or `+ Add New`), quick search with shortcut trigger, and user profile pill with status/role indicator.
- **Top Navigation Pill Menu**: Alternative header variant featuring pill-shaped navigation tabs (`Overview`, `Activity`, `Attendance`, `Reports`) where active item is high-contrast dark filled (`{components.top-nav-tab-active}`) and remaining items are ghost text.

### 2. Bento Grid & Multi-Column Information Hierarchy
- **3-Zone Layout Structure**:
  1. **Left Column (Hero Account / Identity)**: Balance cards, active ID / NFC badge representation, quick action buttons (`Transfer` / `Request` or `Check-in` / `Excuse`), and wallet/category status rows.
  2. **Center Column (Performance & Core Metrics)**: 2×2 KPI metric card grid with exactly **one high-voltage highlight card** (orange fill, white text) surrounded by neutral hairline cards, followed by recent activity tables or dynamic timelines.
  3. **Right Column (Analytics & Visual Breakdown)**: Smooth area charts with gradient under-fills, segmented radial gauge breakdown, quick member avatar strips, and target progress bars.
- **Bento Gap Discipline**: Tight, harmonious `12px` or `16px` grid gaps (`{spacing.bento-gap}` and `{spacing.card-gap}`) keep cards visually unified without clutter.

### 3. KPI Card Anatomy & The "Highlight Card" Rule
- Standard KPI cards feature:
  - Top row: kicker label (`{typography.kicker}`) on left, secondary category icon or action dots on right.
  - Middle: bold numerical metric (`{typography.metric}` or `{typography.metric-lg}`).
  - Bottom: delta trend badge (`+22.41%` in green subtle pill `{components.badge-delta-up}` or `-5%` in red subtle pill `{components.badge-delta-down}`) followed by comparison timeframe text.
- **The Highlight Card Pattern**: Exactly **one** card per cluster may use a solid `{colors.primary-highlight}` background with inverted white typography to establish instant visual hierarchy (e.g., Total Attendance / Total Credits). Secondary cards remain crisp white with 1px hairline borders.

### 4. Interactive Data Widgets & Micro-Surfaces
- **Quick Links Ribbon**: Horizontal row of square-rounded icons (`64px`, `{rounded.lg}`) representing high-frequency operations. Selected state has a 1px orange border and subtle 8% orange tint.
- **Inline Card Actions**: Low-key ghost text links inside cards (e.g. `Edit cards limitation`, `View on chart mode`) using `{typography.card-inline-action}` and primary orange color with trailing micro-icons.
- **Target Progress Bars**: Dual-layer track (`4px` or `6px`) showing percentage completed toward goals with tabular percentages (`36% achieved`) below.
- **Avatar Action Strips**: Horizontal cluster of 32px circular member avatars with first names below for rapid 1-click interactions.

---

## Colors

### Brand
- **DCC Orange** `{colors.primary}` (#f54e00): primary CTAs, active nav, selected items, focus ring, links. Scarce — one orange element per view cluster.
- **Orange Active** `{colors.primary-active}` (#d04200): press/hover state.
- **Orange Subtle** `{colors.primary-subtle}` (rgba(245,78,0,0.08)): background for active tabs, selected quick-links, and notification counts.
- **Orange Border** `{colors.primary-border}` (rgba(245,78,0,0.20)): border for selected items and focus indicators.
- **Orange Highlight** `{colors.primary-highlight}` (#f54e00): full fill for the single hero KPI card in a grid cluster.

### Surfaces
- **Canvas** `{colors.canvas}` (#FFFFFF): page floor (light). **Canvas Soft** `{colors.canvas-soft}`: sidebar bg, filter pills, and subtle inset fills.
- **Card** `{colors.surface-card}` (#ffffff): all cards, inputs, modals.
- **Surface Strong** `{colors.surface-strong}` (#EFEFEF): badges, secondary button tint, table headers.
- Dark equivalents: canvas `{colors.dark-canvas}`, card `{colors.dark-card}`, secondary `{colors.dark-secondary}`, sidebar `{colors.dark-sidebar}`.

### Hairlines
1px only:
- `{colors.hairline}` (#ededed): default card outlines, table borders, dividers.
- `{colors.hairline-soft}` (#f1f1ef): subtle internal dividers and sub-card borders.
- `{colors.hairline-strong}` (#dcdcdc): inputs, hovered card outlines.
- Dark: `{colors.dark-hairline}` (#2e2e2e): dark mode boundary lines.

### Text
- **Ink** `{colors.ink}`: headings, emphasized values, primary navigation.
- **Body** `{colors.body}`: running text, form values.
- **Muted** `{colors.muted}`: metadata, captions, secondary stats, axis labels.
- **Muted Soft** `{colors.muted-soft}`: disabled only, subtle icons.

### Semantic (state, never decoration)
- **Success / Live** `{colors.semantic-success}` (#1f8a65), Subtle: `{colors.semantic-success-subtle}`.
- **Error / Destructive** `{colors.semantic-error}` (#cf2d56), Subtle: `{colors.semantic-error-subtle}`.
- **Warning / Pending** `{colors.semantic-warning}` (#b45309), Subtle: `{colors.semantic-warning-subtle}`.
- All semantic badges use 8% subtle backgrounds with full-strength text and optional 1px hairline border.

---

## Typography

**Satoshi** (`--font-sans`) is the primary interface family (designed by Deni Anggara / Indian Type Foundry). **JetBrains Mono** (`--font-mono`) on every code surface.

| Token | Size / Weight / Spacing | Use Case |
|---|---|---|
| `{typography.hero-greeting}` | 28px / 700 / -0.02em | Top-level dashboard greeting |
| `{typography.metric-lg}` | 32px / 700 / -0.02em / tabular | Primary hero account balance / attendance stat |
| `{typography.page-title}` | 24px / 600 / -0.01em | Standard page h1 |
| `{typography.metric}` | 24px / 600 / tabular | Standard KPI card numbers |
| `{typography.metric-sm}` | 18px / 600 / tabular | Secondary card metrics, sub-card values |
| `{typography.section-title}` | 16px / 600 | Card & section titles, h2/h3 |
| `{typography.body-lg}` | 16px / 400 | Long reading text |
| `{typography.body-md}` | 14px / 400 | Working text: table cells, form labels, list rows, buttons |
| `{typography.delta-badge}` | 12px / 500 / tabular | Trend indicators (+22.4%, ↑ 5%) |
| `{typography.card-inline-action}` | 12px / 500 | Ghost links inside cards (`Edit cards limitation`) |
| `{typography.caption}` | 12px / 400 | Metadata, helper text, timestamps |
| `{typography.sidebar-group-label}`| 11px / 500 / +0.06em / uppercase | Sidebar category headings (GENERAL, OTHER) |
| `{typography.kicker}` | 11px / 600 / +0.08em / uppercase | KPI card kicker, table header labels |
| `{typography.mono}` | 13px JetBrains Mono | Roll numbers, tokens, emails, session IDs |

**Scaling rules:** fixed rem scale (no clamp — dense enterprise UI). `14px` is the working minimum for interactive content; `12px` for metadata; `11px` for uppercase category kickers only. `tabular-nums` on all metrics, timestamps, and currency/credit counts.

---

## Layout Patterns

### 1. Bento Dashboard Layout
The primary dashboard layout uses a responsive CSS Grid with `16px` outer gap and `12px` internal sub-grid gap:
```
+---------------------------------------------------------------------------------------+
|  Top Bar: Greeting / Date Widget / Search / Primary Pill CTA / User Profile Dropdown  |
+---------------------------------------------------------------------------------------+
|  Column 1 (Span 4)       |  Column 2 (Span 5)             |  Column 3 (Span 3)        |
|  - Main Account / ID     |  - 2x2 KPI Grid (1 Highlight)  |  - Chart: Line / Trend    |
|  - Sub-wallets / Tracks  |  - Activity Table with filters |  - Radial / Gauge Chart   |
|  - Action Buttons        |  - Quick Action Links Ribbon   |  - Target Progress Bars   |
+---------------------------------------------------------------------------------------+
```

### 2. Sidebar Navigation Anatomy
- **Header**: Brand logo + portal name + membership badge (e.g. `Pro Account` or `Club Member`).
- **Grouped Navigation**:
  - `sidebar-group-label` (`GENERAL`, `OTHER`, `INFORMATION`) with 8px vertical padding.
  - Nav items with 16px left icon, label, and optional right-aligned pill counter (`badge-nav-count`) or feature chip (`New Update`).
  - Active item indicator: `2px solid {colors.primary}` left rail, `{colors.canvas-soft}` background, orange text and icon.
- **Footer**: Logout button with orange hover accent, dark/light theme toggle.

### 3. Data Table Anatomy (Activity Manager)
- **Toolbar**: Left search input (`Search in activities...`), right segmented filter chips (`Team`, `Insights ×`, `Today ×`, `Filter`).
- **Header**: Hairline border bottom, 60% opacity `{typography.kicker}` labels.
- **Rows**: 48px height, checkbox, mono identifier (`INV_000076`), entity icon + title, numeric value (tabular), status pill with 6px semantic dot, timestamp, and row overflow menu (`···`).
- **Hover**: Subtle `{colors.canvas-soft}` fill, no elevation change.

---

## Components Specification

- **Card (`card`)**: White canvas, 1px hairline border, `12px` border-radius (`{rounded.lg}`), `20px` to `24px` padding.
- **Highlight Card (`card-highlight`)**: Full `{colors.primary}` background, white text ramp, white 20% opacity pill badges, used strictly once per view cluster for the primary KPI.
- **KPI Card (`kpi-card`)**:
  - Kicker label top left in `{typography.kicker}` (`muted`).
  - Optional category icon or timeframe dropdown top right.
  - Large tabular numeral in `{typography.metric}` or `{typography.metric-lg}`.
  - Trend badge `{components.badge-delta-up}` / `{components.badge-delta-down}` below with comparison label (`than last month`, `this week`).
- **Button Variants**:
  - `button-primary`: 40px height, 8px radius, DCC Orange fill, white text.
  - `button-primary-pill`: 38px height, full pill radius (`{rounded.pill}`), DCC Orange fill, white text. Used for hero cluster actions.
  - `button-secondary`: 40px height, 8px radius, white fill, 1px hairline border, ink text.
  - `button-secondary-pill`: 38px height, full pill radius, soft canvas fill (`#F7F7F5`), ink text.
- **Quick Links Ribbon (`quick-link-grid`)**: Horizontal cluster of 5 to 7 rounded cards (`64px` height). Unselected: white with hairline border; Selected: 1px orange border, 8% orange tint, orange icon.
- **Progress Bar (`progress-bar` / `progress-bar-target`)**:
  - Track: 4px to 6px height, `{colors.hairline}` or `{colors.canvas-soft}` with `{rounded.pill}`.
  - Fill: `{colors.primary}` or semantic color.
  - Caption: Tabular percentage and goal title directly below in `{typography.caption}`.
- **Chart Widgets**:
  - Area Line Chart: 2px spline curve (`{colors.primary}`), subtle gradient fill from `rgba(245,78,0,0.15)` to `transparent`, dark hairline gridlines, black floating tooltip pin (`$245.00` in dark pill).
  - Semi-Donut / Gauge: Segmented arc tracks (`10px` to `14px` stroke), colored progress segment, center percentage numeral (`29%`), legend below.
  - Grouped Bar Chart: 12px bar width, 4px top radius, contrasting brand orange vs dark ink bars.

---

## Spacing Reference

| Token | Value | Context |
|---|---|---|
| `{spacing.xs}` | 8px | Internal button padding, icon gap, badge padding |
| `{spacing.sm}` | 12px | Grid gap between nested bento widgets, input internal padding |
| `{spacing.base}` | 16px | Primary grid gap, card internal padding (compact) |
| `{spacing.md}` | 20px | Standard card internal padding, section item spacing |
| `{spacing.lg}` | 24px | Large card padding, container outer margins |
| `{spacing.xl}` | 32px | Major section breaks, modal margins |
| `{spacing.section}` | 48px | Page floor vertical separation |
| `{spacing.bento-gap}` | 12px | Internal spacing between adjacent bento tiles |
| `{spacing.card-gap}` | 16px | External spacing between major card clusters |

---

## Motion & Interaction

1. **Duration**: Fast and decisive. Micro-interactions run at `150ms–200ms`; layout transitions run at `250ms–300ms`.
2. **Easing**: Standard product curve `cubic-bezier(0.16, 1, 0.3, 1)` (snappy entry, smooth deceleration). Never bouncy or whimsical.
3. **Card Hover**: Cards never gain drop shadows on hover. State change is strictly border brightening from `{colors.hairline}` to `{colors.hairline-strong}`.
4. **Button Press**: Active state scales subtly to `scale(0.985)` with background darkening to `{colors.primary-active}`.
5. **Chart Tooltip Pin**: Smooth horizontal glide along spline curve with instant opacity snap (`100ms`).
6. **Tabs & Filter Chips**: Instant color/border swap (`120ms ease-out`); active pill backgrounds slide smoothly with layout projection.
7. **Pulsing Dot**: `semantic-live` dot uses a subtle scale + opacity pulse (`2s infinite ease-in-out`) to signal active sync/session without distraction.
8. **Reduced Motion**: Respect `prefers-reduced-motion: reduce` by replacing spatial transitions with instant opacity fades.

---

## Do's and Don'ts

**Do**
- Use DCC Orange for exactly one thing per cluster: the primary action, the active navigation tab, or the single highlight KPI card.
- Keep depth hairline-only (1px borders). Let white-on-neutral surface contrast define structure.
- Render roll numbers, QR tokens, session IDs, emails, and timestamps in JetBrains Mono.
- Use tabular numbers (`font-variant-numeric: tabular-nums`) across all metrics, countdowns, and tables.
- Group sidebar navigation logically under uppercase category kickers (`GENERAL`, `OTHER`, `INFORMATION`).
- Provide instant visual status using small semantic dots (`6px`) beside status labels in data tables.
- Pair KPI cards with concise timeframe selectors (e.g. `Weekly ▾`, `Day / Week / Month`).
- Keep chart fills subtle: use translucent gradients (0.12 opacity) fading to transparent.
- Maintain a strict 14px floor for all interactive text and table content.
- Support dark mode using clean, neutral grays (`#191919`, `#202020`) rather than tinted dark colors.

**Don't**
- Don't add drop shadows, colored glows, or blurry glassmorphism backgrounds.
- Don't use orange decoratively or as a generic background for multiple cards in the same view.
- Don't introduce secondary accent colors (e.g., purple, blue) for brand actions.
- Don't uppercase entire titles or sentences; uppercase is strictly reserved for single kickers and sidebar section headers.
- Don't use font sizes below 11px under any circumstance.
- Don't use thick borders (>1px) except for active left-rail navigation indicators (2px).
- Don't allow text lines in cards to wrap arbitrarily; use tight layouts and truncation with tooltips where needed.
- Don't commit or push any changes without user verification when the local dev server is active.
