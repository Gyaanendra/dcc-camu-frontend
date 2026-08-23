# DESIGN.md — dcc-camu-frontend

> **Source of Truth** for visual design decisions.  
> Derived from the Shadcn UI **Maia / Inter** preset (reference screenshots) and the Impeccable `distill` + `typeset` disciplines.  
> Every token, pattern, and rule here must be respected when writing or reviewing UI code.

---

## 0. Philosophy

| Principle | Rule |
|-----------|------|
| **Minimalist** | Only what informs. Remove decoration that does not carry data. |
| **Data-dense** | Cards carry real numbers, labels, and status — not illustrations. |
| **One accent** | A single blue (`--accent`) is the only interactive color. Everything else is neutral. |
| **No gradients on surfaces** | Surfaces are flat. Gradients belong only to chart fills or hero illustrations. |
| **System-level consistency** | Light and dark are equal citizens — every component must look correct in both. |

---

## 1. Color Tokens (CSS Variables — HSL)

All values are defined as CSS custom properties in `src/app/globals.css` and consumed via Tailwind `hsl(var(--*))` mapping.

### 1.1 Light Mode (`:root`)

```css
:root {
  /* Surfaces */
  --background:        210 20% 98%;   /* #f8fafc  — page canvas */
  --foreground:        222 47% 11%;   /* #181d26  — primary text */

  /* Cards / Panels */
  --card:              0 0% 100%;     /* #ffffff  — card surface */
  --card-foreground:   222 47% 11%;

  /* Popovers / Dropdowns */
  --popover:           0 0% 100%;
  --popover-foreground: 222 47% 11%;

  /* Primary (non-accent actions, e.g. dark pill buttons) */
  --primary:           222 47% 11%;   /* near-black */
  --primary-foreground: 210 20% 98%;

  /* Secondary (ghost-like fills) */
  --secondary:         210 20% 96%;   /* #f0f4f8 */
  --secondary-foreground: 222 47% 11%;

  /* Muted (disabled, placeholder, helper text) */
  --muted:             210 20% 96%;
  --muted-foreground:  215 16% 47%;   /* #6b7280-ish */

  /* THE accent — interactive blue */
  --accent:            217 91% 60%;   /* #3b7ff0 */
  --accent-foreground: 0 0% 100%;

  /* Semantic */
  --destructive:       0 84% 60%;
  --destructive-foreground: 0 0% 100%;

  /* Chrome */
  --border:            214 32% 91%;   /* #e2e8f0 */
  --input:             214 32% 91%;
  --ring:              217 91% 60%;   /* matches accent */

  /* Shape */
  --radius:            0.75rem;       /* 12px — used for all cards/inputs/buttons */
}
```

### 1.2 Dark Mode (`.dark`)

```css
.dark {
  /* Surfaces */
  --background:        240 10% 3.9%;  /* #09090b  — deepest layer */
  --foreground:        0 0% 98%;      /* #fafafa  */

  /* Cards — one step lighter than canvas */
  --card:              240 8% 7%;     /* #111114  */
  --card-foreground:   0 0% 98%;

  /* Popovers — match card */
  --popover:           240 8% 7%;
  --popover-foreground: 0 0% 98%;

  /* Primary (white pill buttons in dark mode) */
  --primary:           0 0% 98%;
  --primary-foreground: 240 6% 10%;

  /* Secondary fills */
  --secondary:         240 4% 16%;    /* #27272a */
  --secondary-foreground: 0 0% 98%;

  /* Muted */
  --muted:             240 4% 16%;
  --muted-foreground:  240 5% 65%;    /* #9ca3af-ish */

  /* Accent — same blue, unchanged across modes */
  --accent:            217 91% 60%;   /* #3b7ff0 */
  --accent-foreground: 0 0% 100%;

  /* Semantic */
  --destructive:       0 63% 31%;
  --destructive-foreground: 0 0% 98%;

  /* Chrome */
  --border:            240 4% 16%;    /* #27272a */
  --input:             240 4% 16%;
  --ring:              240 5% 84%;

  /* Shape unchanged */
  --radius:            0.75rem;
}
```

### 1.3 Named Semantic Palette (Quick Reference)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `#f8fafc` | `#09090b` | Page body bg |
| `--card` | `#ffffff` | `#111114` | All card/panel surfaces |
| `--border` | `#e2e8f0` | `#27272a` | Dividers, outlines, input rings |
| `--muted-foreground` | `#6b7280` | `#9ca3af` | Labels, helper text, secondary metadata |
| `--accent` | `#3b7ff0` | `#3b7ff0` | CTA buttons, links, toggles, progress fills |
| `--foreground` | `#181d26` | `#fafafa` | Body copy, headings |
| `--destructive` | `#ef4444` | `#7f1d1d` | Error states, danger alerts |

---

## 2. Typography

### 2.1 Font Stack

| Role | Family | Weight | Size |
|------|--------|--------|------|
| **UI / Body** | `Inter`, system-ui, sans-serif | 400 | `14px` / `text-sm` |
| **Headings** | `Inter` | 600–700 | Scale below |
| **Monospace** | `JetBrains Mono`, `Fira Code`, monospace | 400 | `text-xs` |
| **Data / Figures** | `Inter` | 600–700 | Oversize (`text-2xl`–`text-4xl`) |

> Load via `next/font/google`: `Inter({ subsets: ['latin'], variable: '--font-inter' })`

### 2.2 Type Scale

```
text-xs    → 12px / leading-4   — badge labels, table meta, timestamps
text-sm    → 14px / leading-5   — body copy, form labels, card body
text-base  → 16px / leading-6   — section intros, modal body
text-lg    → 18px / leading-7   — card titles, sidebar section headers
text-xl    → 20px / leading-7   — page sub-headings
text-2xl   → 24px / leading-8   — metric values (KPI numbers)
text-3xl   → 30px / leading-9   — hero metric (e.g. $420,000)
text-4xl+  → 36px+              — reserved for landing / onboarding
```

### 2.3 Rules

- **Never** use `font-bold` on muted/secondary text.
- **Number emphasis**: large metric figures use `font-semibold` or `font-bold`, `tabular-nums`, `tracking-tight`.
- **Label pattern**: `text-xs text-muted-foreground uppercase tracking-wide font-medium` — for card section labels.
- **Line-height**: Always use Tailwind's paired leading class (`leading-5` for `text-sm`, etc.).

---

## 3. Spacing & Layout

### 3.1 Base Grid

| Context | Value |
|---------|-------|
| Page padding (mobile) | `px-4 py-4` |
| Page padding (desktop) | `px-6 py-6` |
| Card inner padding | `p-5` or `p-6` |
| Between card grid rows/cols | `gap-4` |
| Sidebar width | `240px` (collapsible to `56px`) |
| Top navbar height | `56px` |

### 3.2 Dashboard Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

Full-width widgets span: `className="col-span-full"` or `className="md:col-span-2"`

### 3.3 Vertical Rhythm

- Card header → card body gap: `mt-3` or `space-y-3`
- Between label and value: `mt-0.5`
- Between sections inside a card: `mt-4 border-t border-border pt-4`

---

## 4. Shape & Elevation

### 4.1 Border Radius

| Element | Class | Value |
|---------|-------|-------|
| Card / Panel | `rounded-xl` | `0.75rem` |
| Input / Select | `rounded-lg` | ~`0.625rem` |
| Button (default) | `rounded-lg` | `0.625rem` |
| Button (pill) | `rounded-full` | |
| Badge | `rounded-full` | |
| Avatar | `rounded-full` | |
| Chart bars | `rounded-sm` | `2px` |

### 4.2 Shadows (Elevation Layers)

```
Layer 0 — Page canvas      : no shadow
Layer 1 — Card (resting)   : shadow-sm   → 0 1px 3px rgba(0,0,0,0.05)
Layer 2 — Card (hover)     : shadow-md   → 0 4px 6px rgba(0,0,0,0.07)
Layer 3 — Dropdown/Popover : shadow-lg   → 0 10px 24px rgba(0,0,0,0.10)
Layer 4 — Modal/Dialog     : shadow-xl
```

Dark mode: multiply alpha × 3–4× for same perceived depth.

---

## 5. Component Patterns

### 5.1 Card (`.dash-card`)

The primary building block. Every dashboard widget lives inside one.

```tsx
<div className="dash-card p-5">
  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
    Section Label
  </p>
  <h2 className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
    $420,000
  </h2>
  <p className="text-xs text-muted-foreground mt-0.5">85% achieved</p>
</div>
```

```css
/* globals.css */
.dash-card {
  background-color: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  box-shadow: 0 1px 3px 0 rgba(0,0,0,0.04);
}
.dark .dash-card { box-shadow: 0 1px 3px 0 rgba(0,0,0,0.40); }
```

### 5.2 Stat / KPI Card

```
┌──────────────────────────────┐
│ CARD BALANCE          label  │
│ US$12.94             value   │
│ US$11,337.06 Available  sub  │
└──────────────────────────────┘
```
- Label: `text-xs text-muted-foreground`
- Value: `text-2xl font-bold tabular-nums`
- Sub: `text-xs text-muted-foreground`

### 5.3 Button Hierarchy

| Variant | Usage | Appearance |
|---------|-------|------------|
| **Primary** | Single main CTA per card | `bg-accent text-white rounded-lg` |
| **Secondary** | Secondary action | `bg-secondary text-foreground` |
| **Outline** | Tertiary / toggleable | `border border-border bg-transparent` |
| **Ghost** | Nav items, icon buttons | `hover:bg-secondary` |
| **Destructive** | Delete / archive | `bg-destructive text-white` |

> Primary buttons: solid `--accent` blue, `text-white`, `rounded-lg`, `h-9 px-4`, `text-sm font-medium`.

### 5.4 Input / Form Fields

```tsx
<div className="space-y-1.5">
  <label className="text-sm font-medium text-foreground">Email Address</label>
  <input
    className="w-full h-9 rounded-lg border border-input bg-transparent
               px-3 text-sm text-foreground placeholder:text-muted-foreground
               focus:outline-none focus:ring-1 focus:ring-ring transition"
  />
</div>
```

- Background: **transparent** (not double-layered white-on-white).
- Focus ring: `ring-1 ring-ring` using `--ring`.

### 5.5 Badge

```tsx
{/* Accent / info */}
<span className="inline-flex items-center rounded-full px-2.5 py-0.5
                 text-xs font-medium bg-accent/10 text-accent">+10%</span>

{/* Positive delta */}
<span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 
                 rounded-full px-2.5 py-0.5">+$4,200</span>

{/* Negative delta */}
<span className="text-xs font-medium text-red-500 bg-red-500/10 
                 rounded-full px-2.5 py-0.5">-$6.50</span>
```

### 5.6 Progress Bar

```tsx
<div className="w-full h-1.5 rounded-full bg-secondary">
  <div className="h-1.5 rounded-full bg-accent transition-all" style={{ width: '85%' }} />
</div>
```
- Track: `bg-secondary` · Fill: `bg-accent` · Height: `h-1.5` standard / `h-2` prominent

### 5.7 Bar Chart (Muted Histogram)

Visual rules (from images — contribution history, power usage, sleep report):
- Bar fill: `hsl(var(--muted))` in both modes — neutral grey, NOT accent blue.
- Hover/active bar: `hsl(var(--accent))` or slightly brighter muted.
- Bar width: ~70% of column; gap ~30%.
- Labels below: `text-xs text-muted-foreground`
- No axis lines, no gridlines — bars only.
- X-axis: 3-letter month or hour (`Dec`, `Jan`, `6a`, `8a`).

### 5.8 Donut / Ring Chart

- Stroke: accent blue for active segment. Track: `hsl(var(--border))`.
- Center text: `text-2xl font-bold`
- Legend: `text-xs text-muted-foreground` with colored dot

### 5.9 Transaction / List Row

```tsx
<div className="flex items-center justify-between py-3 border-b border-border last:border-0">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <div>
      <p className="text-sm font-medium">Blue Bottle Coffee</p>
      <p className="text-xs text-muted-foreground">Food & Drink · Today, 10:24 AM</p>
    </div>
  </div>
  <span className="text-sm font-medium tabular-nums text-red-500">-$6.50</span>
</div>
```

### 5.10 Toggle / Switch

- Use Shadcn `<Switch />`. Thumb: white. Track off: `bg-muted`. Track on: `bg-accent`.

### 5.11 Select / Dropdown

```tsx
<Select>
  <SelectTrigger className="w-full h-9 rounded-lg border-input text-sm" />
  <SelectContent className="rounded-xl border-border bg-card shadow-lg" />
</Select>
```

### 5.12 Radio Group (Pill Selector)

Observed in "Receiving Method" — bank transfer / PayPal:

```tsx
<label className={cn(
  "flex-1 flex flex-col gap-0.5 rounded-lg border p-3 cursor-pointer transition",
  selected === opt.value
    ? "border-accent bg-accent/5"
    : "border-border bg-transparent hover:bg-secondary"
)}>
  <span className="text-sm font-medium">{opt.label}</span>
  <span className="text-xs text-muted-foreground">{opt.sublabel}</span>
</label>
```

### 5.13 Slider

- Track: `bg-secondary h-1 rounded-full` · Range fill: `bg-accent` · Thumb: `white ring-2 ring-accent`

### 5.14 Danger Zone

```tsx
<div className="flex items-center justify-between rounded-lg border border-destructive/30
                bg-destructive/5 px-4 py-3">
  <div className="flex items-center gap-2">
    <AlertCircle className="w-4 h-4 text-destructive" />
    <div>
      <p className="text-sm font-medium text-destructive">Danger Zone</p>
      <p className="text-xs text-muted-foreground">Archive account and remove...</p>
    </div>
  </div>
  <ChevronRight className="w-4 h-4 text-muted-foreground" />
</div>
```

### 5.15 Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <Icon className="w-10 h-10 text-muted-foreground mb-3" />
  <p className="text-sm font-medium">No items found</p>
  <p className="text-xs text-muted-foreground mt-1">Description of the empty state</p>
  <Button size="sm" className="mt-4">Create</Button>
</div>
```

---

## 6. Navigation & Layout Shell

### 6.1 Sidebar

| Property | Value |
|----------|-------|
| Width | `240px` (collapsed: `56px` icon-only) |
| Background | `hsl(var(--card))` |
| Border-right | `1px solid hsl(var(--border))` |
| Active item bg | `hsl(var(--accent)/0.10)` |
| Active item text | `text-accent` |
| Inactive item | `text-muted-foreground hover:text-foreground hover:bg-secondary` |
| Section label | `text-xs uppercase tracking-wide text-muted-foreground px-3 mb-1` |

### 6.2 Top Navbar

| Property | Value |
|----------|-------|
| Height | `56px` |
| Background | `hsl(var(--background))` + `border-b border-border` |
| Search | Full-width, `rounded-full`, `bg-secondary` |
| Theme toggle | Icon-only ghost button |
| Actions | Avatar + notification bell |

---

## 7. Icons

- **Library**: `lucide-react` (declared in `components.json`)
- **Size**: `w-4 h-4` inline · `w-5 h-5` nav · `w-8 h-8` empty state
- **Color**: Inherit from text context; `text-muted-foreground` for decorative
- **Never** use filled/colored icon sets — keep to lucide's stroke style

---

## 8. Motion & Interaction

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Card hover shadow/border | `150ms` | `ease-out` |
| Button press | `100ms` | `ease-in` |
| Sidebar expand/collapse | `200ms` | `ease-in-out` |
| Progress bar fill (mount) | `600ms` | `ease-out` |
| Chart bar mount | `400ms` staggered `20ms` | `ease-out` |
| Skeleton shimmer | `1500ms` | `ease-in-out` loop |
| Toast / alert enter | `200ms` slide-up + fade | |
| Modal open | `150ms` scale `0.96→1` + fade | |

> **Reduced motion**: Wrap animations in `@media (prefers-reduced-motion: reduce)` and remove them.

---

## 9. Dark / Light Mode Implementation

### 9.1 Switching Strategy

- Mode stored in `localStorage` + `<html class="dark">`.
- Use `next-themes` (`ThemeProvider` wrapping root layout).
- **Never hard-code `#hex` in JSX** — always use Tailwind token classes.

### 9.2 Token Substitution Rules

| ❌ Wrong | ✅ Correct |
|---------|----------|
| `bg-white dark:bg-zinc-900` | `bg-card` |
| `text-gray-500` | `text-muted-foreground` |
| `border-gray-200 dark:border-gray-700` | `border-border` |
| `style={{ color: '#6b7280' }}` | `className="text-muted-foreground"` |
| `bg-blue-500` for interactive | `bg-accent` |

### 9.3 Assets in Dark Mode

- Black logos that need to be white: `invert dark:invert-0`
- Chart SVGs: stroke/fill must reference CSS variables, not hard-coded hex.

---

## 10. Accessibility Checklist

- [ ] All interactive elements have `aria-label` or visible label
- [ ] Focus rings visible in both modes (`focus-visible:ring-2 ring-ring`)
- [ ] Color is never the only differentiator (icon + color for status)
- [ ] WCAG AA contrast for all text/background pairs
- [ ] Form inputs have associated `<label>` (`htmlFor` + `id`)
- [ ] Charts have `aria-label` on SVG; data available as table for screen readers
- [ ] Keyboard navigation works for dropdowns, modals, and sidebar

---

## 11. Shadcn Component Checklist

Install via `npx shadcn-ui@latest add <component>`:

| Component | Notes |
|-----------|-------|
| `Button` | 5 variants per §5.3 |
| `Card`, `CardHeader`, `CardContent`, `CardFooter` | Use `.dash-card` CSS for dashboard panels |
| `Input`, `Textarea` | Transparent bg, `border-input` |
| `Select`, `SelectTrigger`, `SelectContent` | `rounded-xl` content |
| `Switch` | `bg-accent` when on |
| `Slider` | Accent range + thumb ring |
| `Badge` | Semantic color system |
| `Progress` | Accent fill |
| `Avatar`, `AvatarFallback` | `bg-secondary` fallback |
| `Separator` | `bg-border` |
| `Dialog`, `Sheet` | `rounded-xl`, `shadow-xl` |
| `DropdownMenu` | `rounded-xl`, `shadow-lg` |
| `Tooltip` | `bg-foreground text-background text-xs` |
| `Skeleton` | `bg-muted animate-pulse` |
| `Tabs`, `TabsList`, `TabsTrigger` | Active: `bg-background shadow-sm` |
| `Table` | Row dividers via `border-b border-border` |

---

## 12. File Map

```
src/
├── app/
│   └── globals.css          ← CSS variables (design tokens)
├── components/
│   ├── ui/                  ← Shadcn primitives (do not edit directly)
│   └── layout/
│       ├── Sidebar.tsx      ← Navigation shell
│       └── Navbar.tsx       ← Top bar with search + theme toggle
└── lib/
    └── utils.ts             ← cn() helper
```

---

## 13. Do / Don't Summary

| ✅ Do | ❌ Don't |
|------|---------|
| Use `hsl(var(--accent))` for all interactive blue | Use `blue-500`, `blue-600`, `indigo-*` ad-hoc |
| Keep card padding at `p-5` or `p-6` | Mix `p-3`, `p-4`, `p-8` inconsistently |
| Use `text-muted-foreground` for all secondary copy | Use `opacity-50` to dim text |
| Use `rounded-xl` on all cards | Mix `rounded-md`, `rounded-2xl` on cards |
| Keep chart bars in `hsl(var(--muted))` (grey) | Colorize chart bars in random hues |
| One primary CTA per card | Two solid primary buttons in the same card |
| Use Inter for all text | Mix multiple font families |
| Always test both light and dark mode | Assume dark mode works because light works |

---

*Last updated: 2026-08-23 · Derived from Shadcn UI Maia preset reference images*
