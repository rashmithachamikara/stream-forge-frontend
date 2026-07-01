# Stream Forge - Design Migration Prompt

Use this document as the single source of truth to redesign the existing Next.js Media Portal so it matches the Stream Forge design language. Keep all existing functionality, routes, data fetching, and backend wiring intact - change only presentation: tokens, components, layout, typography, spacing, and micro-interactions.

---

## 1. Mission

> Reskin the entire Next.js app to the Stream Forge "compact operator" enterprise design system described below. Do not modify business logic, API calls, server actions, route handlers, auth, or data models. Replace styling, class names, and presentational components only. The result should feel like a premium enterprise video platform: dense, technical, calm, trustworthy - not a generic SaaS template.

Hard rules:
- No purple/indigo gradients on white. No generic AI aesthetics.
- No hardcoded colors in components (`text-white`, `bg-[#...]`, `text-gray-500`). Everything goes through semantic tokens.
- One H1 per page. Semantic HTML. Accessible contrast in both light and dark mode.
- Inter for UI/body, JetBrains Mono for any numeric/technical metadata (bitrate, duration, IDs, timestamps, durations, percentages).

---

## 2. Design Philosophy

Stream Forge is for organizations that need secure, reliable, scalable video delivery. The UI must balance:
- **Enterprise trustworthiness** - restrained color, clear hierarchy, predictable layout
- **Modern SaaS simplicity** - generous breathing room around dense data, minimal chrome
- **Operator density** - technical metadata is first-class; viewers see clean cards, admins see dashboards

Tone keywords: *compact, technical, calm, sharp, neutral with one decisive accent.*

---

## 3. Design Tokens (drop into `globals.css` / Tailwind v4 `@theme`)

All colors are OKLCH. Define once at `:root` and `.dark`. Never hardcode.

```css
:root {
  --radius: 0.625rem;

  --background: oklch(0.985 0 0);
  --foreground: oklch(0.18 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0 0);

  --primary: oklch(0.52 0.22 262);          /* decisive blue accent */
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.96 0.005 260);
  --secondary-foreground: oklch(0.22 0 0);
  --muted: oklch(0.96 0.005 260);
  --muted-foreground: oklch(0.5 0.01 260);
  --accent: oklch(0.96 0.005 260);
  --accent-foreground: oklch(0.22 0 0);

  --destructive: oklch(0.58 0.22 27);
  --destructive-foreground: oklch(0.99 0 0);
  --success: oklch(0.62 0.16 152);
  --success-foreground: oklch(0.99 0 0);
  --warning: oklch(0.74 0.16 70);
  --warning-foreground: oklch(0.2 0 0);

  --border: oklch(0.91 0.005 260);
  --input: oklch(0.91 0.005 260);
  --ring: oklch(0.52 0.22 262);
}

.dark {
  --background: oklch(0.14 0.01 260);
  --foreground: oklch(0.97 0 0);
  --card: oklch(0.18 0.01 260);
  --card-foreground: oklch(0.97 0 0);
  --popover: oklch(0.18 0.01 260);
  --popover-foreground: oklch(0.97 0 0);

  --primary: oklch(0.7 0.18 262);
  --primary-foreground: oklch(0.14 0.01 260);
  --secondary: oklch(0.24 0.01 260);
  --secondary-foreground: oklch(0.97 0 0);
  --muted: oklch(0.24 0.01 260);
  --muted-foreground: oklch(0.66 0.01 260);
  --accent: oklch(0.24 0.01 260);
  --accent-foreground: oklch(0.97 0 0);

  --destructive: oklch(0.68 0.2 25);
  --destructive-foreground: oklch(0.97 0 0);
  --success: oklch(0.7 0.16 152);
  --success-foreground: oklch(0.14 0.01 260);
  --warning: oklch(0.78 0.16 70);
  --warning-foreground: oklch(0.14 0.01 260);

  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 12%);
  --ring: oklch(0.7 0.18 262);
}
```

Tailwind v4 theme extension:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

Base layer:

```css
@layer base {
  * { border-color: var(--color-border); }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    font-feature-settings: "cv11", "ss01";
  }
  .font-mono { font-family: var(--font-mono); }
}
```

Load fonts (Next.js: `next/font/google`):
- Inter - weights 400, 500, 600, 700
- JetBrains Mono - weights 400, 500, 600

---

## 4. Typography Scale

- Display / page hero: `text-3xl font-bold tracking-tight` (sparingly)
- Page H1: `text-2xl font-bold tracking-tight`
- Section H2: `text-base font-semibold uppercase tracking-wider text-muted-foreground` (operator-style section labels)
- Card title: `text-sm font-semibold leading-snug`
- Body: `text-sm` (14px default - denser than typical SaaS)
- Meta / secondary: `text-xs text-muted-foreground`
- Micro / chips / badges: `text-[11px]` or `text-[10px] uppercase tracking-tight font-bold`
- Numbers, bitrates, durations, IDs, timestamps, percentages, table row counts: **always** `font-mono`

---

## 5. Layout System

- Max content width: `max-w-[1600px] mx-auto px-6`
- Sticky top header height: `h-14`, with secondary nav tabs row directly below at `h-10`
- Page padding: `py-8`
- Grid gutters: `gap-4` for dense tables/lists, `gap-6` for card grids
- Video card grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8`
- Admin/dashboard pages: 12-col grid, KPI strip on top (`grid grid-cols-2 md:grid-cols-4 gap-4`), then panels

Radii:
- Inputs, buttons, chips, cards: `rounded-md` (approx 8px)
- Thumbnails, large surfaces: `rounded-lg`
- Avatar, pill, search input: `rounded-full`

Borders:
- Default 1px `border-border`. Use `ring-1 ring-border` on thumbnails and avatars instead of a border to keep edges crisp.

Shadows:
- Dropdowns/popovers only: `shadow-lg`
- Cards are flat (border + bg), never shadowed in resting state

---

## 6. Component Patterns

### App Shell (header)
- Sticky, translucent: `sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border`
- Left: small geometric logo (6x6 square with rotated inner diamond) + wordmark in `font-bold tracking-tight text-sm uppercase`
- Center-left: pill search input `bg-muted rounded-full py-1.5 pl-9 pr-4 text-xs w-72`
- Right cluster (gap-3): primary CTA (`Upload`) as `bg-foreground text-background px-3 py-1.5 rounded-md text-xs font-semibold`, role switcher pill, theme toggle, notification bell with dot, account avatar
- Secondary tab row uses underline-active style: active tab `text-foreground border-b-2 border-primary`, idle `text-muted-foreground border-transparent`

### Buttons
- Primary: `bg-foreground text-background hover:opacity-90` - black-on-light / light-on-dark, NOT primary blue. Blue is reserved for active states, links, focus rings, and the brand accent on charts.
- Secondary: `bg-muted text-foreground hover:bg-accent`
- Destructive: `text-destructive hover:bg-destructive/10`
- Ghost icon button: `p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted`
- Sizes are compact: `text-xs` default, `py-1.5 px-3`

### Inputs
- `bg-muted border-0 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring`
- Labels above, `text-xs font-medium text-muted-foreground mb-1.5`

### Cards
- `bg-card border border-border rounded-lg p-5` (or `p-6` for spacious admin panels)
- No shadow at rest. Hover state on interactive cards: subtle `hover:border-foreground/20`.

### Video Card (canonical)
- 16:9 thumbnail: `aspect-video rounded-lg overflow-hidden ring-1 ring-border bg-muted`
- Hover: image `scale-[1.02]`, dark overlay `bg-black/30`, centered circular play button
- Duration chip bottom-right: `bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded`
- Status chip top-left when processing/failed: `bg-background/90 text-[9px] font-bold uppercase tracking-wider border border-border`
- Progress bar (resume position): 1px high, `bg-primary` fill
- Body row: 32px avatar + title (2-line clamp) + meta line `uploader - views - relative time`
- Visibility chip uses semantic color: public->success, unlisted->warning, private->muted, with `bg-*/10 text-* border-*/20` pattern

### Tables (manage, users, taxonomy, audit log)
- Header row: `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border`
- Rows: `border-b border-border last:border-0 hover:bg-muted/50`
- Cell padding: `px-3 py-2.5`, dense
- Numeric and ID columns use `font-mono text-xs`
- Row actions: icon-only ghost buttons aligned right

### Badges / Chips
- `inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-tight`
- Variants by semantic token (success/warning/destructive/muted) with the `bg-*/10 text-* border-*/20` formula

### KPI Tiles (analytics, admin home)
- `bg-card border border-border rounded-lg p-4`
- Label: `text-[11px] uppercase tracking-wider text-muted-foreground`
- Value: `text-2xl font-bold font-mono mt-1`
- Delta: `text-[11px] font-mono` colored success/destructive with arrow glyph

### Dropdowns / Popovers
- `bg-popover border border-border rounded-md shadow-lg py-1`
- Items: `px-3 py-1.5 text-xs hover:bg-accent`

### Notifications & Toasts
- Unread indicator: 6px `bg-primary rounded-full` dot to the left of content
- Bell shows a 6px primary dot when unread count > 0 (no number badge)
- **Toast Notifications (Sonner)**: Use Sonner for transient success/error/warning alerts instead of static, layout-shifting error panels or brief button label transitions.
  - Toasts must map success, error, and warning states to the platform's color formulas (`bg-*/10`, `text-*`, `border-*/20`) and target icon colors.

### Player (watch page)
- Full-width 16:9 video frame with `bg-black rounded-lg overflow-hidden`
- Below: title (`text-xl font-bold`), then dense meta row with chips and mono numerics
- Right rail: related videos as compact (horizontal) video cards
- Tabs for Description / Comments / Bookmarks under the player, using the same underline-active pattern as the header

### Empty States
- Centered, `py-16`, small monochrome icon, `text-sm text-muted-foreground`, single primary action

---

## 7. Iconography & Imagery

- Icons: `lucide-react` only, default stroke, sizes `size-3.5` (inline), `size-4` (header), `size-5` (hero affordances)
- Avatars: initials in `bg-muted ring-1 ring-border`, `text-[10px]-text-[11px] font-semibold`
- Thumbnails: real video stills; never gradient placeholders. Use `bg-muted` while loading.

---

## 8. Motion

- Transitions: `transition-colors duration-150` on interactive chrome, `transition-transform duration-500` on thumbnail hover zoom
- Never animate layout shift. No bouncy springs. No parallax. No purple glow.
- Page transitions: none - instant. Skeleton loaders for data, not spinners, except inside buttons.

---

## 9. Dark Mode

- Toggle via `class="dark"` on `<html>`. Persist in `localStorage`.
- Verify every screen in both modes. Borders in dark mode use translucent white (`oklch(1 0 0 / 10%)`) - do not switch to a solid gray.

---

## 10. Accessibility

- Focus: `focus:outline-none focus:ring-1 focus:ring-ring` on every interactive element
- Contrast: body text >= 4.5:1, large text >= 3:1 in both modes (the tokens above already satisfy this)
- All icon-only buttons need `aria-label`
- Tables use `<th scope="col">`, dropdowns use proper `role="menu"` semantics (prefer Radix primitives via shadcn)

---

## 11. Migration Checklist (per file)

For every page/component in the Next.js app:

1. Strip hardcoded color classes (`text-white`, `bg-gray-*`, `bg-black`, `text-blue-*`, arbitrary hex). Replace with semantic tokens.
2. Replace ad-hoc font sizes with the scale in Section 4. Apply `font-mono` to every numeric/technical value.
3. Wrap pages in the new App Shell. Move primary nav into the header tab row.
4. Convert ad-hoc cards to the canonical Card / VideoCard / KPI patterns.
5. Convert any list/grid of videos to the canonical Video Card grid.
6. Convert any table to the dense table pattern in Section 6.
7. Replace generic buttons with the primary/secondary/ghost variants. Primary CTA is `bg-foreground text-background`, not blue.
8. Replace status pills with the semantic badge formula.
9. Add empty states, loading skeletons, and focus rings where missing.
10. Verify the page in light AND dark mode at 1280px, 1024px, and 768px widths.

Do not introduce new dependencies beyond: `tailwindcss@4`, `tw-animate-css`, `lucide-react`, `clsx` + `tailwind-merge` (or `cn` util), and shadcn/ui primitives if not already present. Keep all existing Next.js data fetching (server components, route handlers, server actions, fetch caching) exactly as-is.

---

## 12. Definition of Done

- Zero hardcoded colors in component files (grep for `#`, `text-white`, `bg-black`, `text-gray-`, `bg-gray-` -> must return only design-token CSS).
- Every screen passes a side-by-side comparison: header chrome, tabs, video cards, tables, KPIs, badges, dropdowns, and forms all match the patterns in Section 6.
- Light and dark mode both ship; toggle is in the header.
- All numbers, durations, IDs, bitrates, timestamps render in JetBrains Mono.
- No regression in functionality, routes, auth, or API behavior.
