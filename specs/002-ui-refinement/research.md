# Research: UI Refinement & Visual Polish

**Feature**: 002-ui-refinement  
**Date**: 2026-02-11  
**Status**: Complete

## 1. Spacing Scale

**Decision**: 4px base unit with named tokens mapping to multiples of 4.

| Token | Value | Use case |
|-------|-------|----------|
| `--space-xs` | 4px (1×) | Tight inner gaps, icon padding |
| `--space-sm` | 8px (2×) | Inner component padding, small gaps |
| `--space-md` | 12px (3×) | Default padding, form element gaps |
| `--space-lg` | 16px (4×) | Section padding, card content |
| `--space-xl` | 24px (6×) | Panel gaps, major section separation |
| `--space-2xl` | 32px (8×) | Page-level gutters |

**Rationale**: A 4px base gives finer control than 8px for dense desktop UIs like
the scrcpy settings app. Desktop apps need tighter spacing than mobile — an 8px
base leads to gaps that feel too loose for form-heavy panels. The 12px step (3×)
is critical for desktop, filling the gap between "tight" and "comfortable" that a
strict power-of-2 scale misses.

**Alternatives considered**: 8px base (Tailwind default) — rejected because it's
too coarse for the dense settings panels. Rem-based arbitrary values — rejected
for lack of systematic consistency.

---

## 2. Typography Scale

**Decision**: 4 levels using `calc()` off the existing `--font-size` variable.

| Token | Size | Weight | Line height |
|-------|------|--------|-------------|
| `--text-heading` | `calc(var(--font-size) * 1.5)` | 600 (SemiBold) | 1.3 |
| `--text-subheading` | `calc(var(--font-size) * 1.125)` | 500 (Medium) | 1.4 |
| `--text-body` | `var(--font-size)` | 400 (Regular) | 1.5 |
| `--text-caption` | `calc(var(--font-size) * 0.875)` | 400 (Regular) | 1.4 |

**Rationale**: Jost is a geometric sans-serif; the sweet spot is 400/500/600 weights.
Avoid 300 at small sizes — geometric fonts lose legibility when light. SemiBold
(600) for headings provides clear hierarchy without Bold (700), which feels heavy
in geometric typefaces. The `calc()` approach means the user's font-size setting
rescales everything proportionally (aligns with existing settings).

**Alternatives considered**: Fixed px values — rejected because the app already has
a user-configurable `--font-size` CSS variable. Modular scale (1.25 ratio) —
rejected for producing too-large headings in desktop utility UIs.

---

## 3. Shadow Elevation System

**Decision**: 4-step shadow scale with theme-adaptive opacity.

| Token | Light theme | Dark theme | Use case |
|-------|-------------|------------|----------|
| `--shadow-subtle` | `0 1px 2px rgba(0,0,0,0.06)` | `0 1px 2px rgba(0,0,0,0.20)` | Cards at rest |
| `--shadow-medium` | `0 2px 8px rgba(0,0,0,0.10)` | `0 2px 8px rgba(0,0,0,0.30)` | Hovered cards |
| `--shadow-elevated` | `0 8px 24px rgba(0,0,0,0.12)` | `0 8px 24px rgba(0,0,0,0.40)` | Dropdowns |
| `--shadow-floating` | `0 16px 48px rgba(0,0,0,0.16)` | `0 16px 48px rgba(0,0,0,0.50)` | Modals |

**Rationale**: Dark themes need 2.5–3× higher opacity because dark backgrounds
absorb shadow. Redefine the same `--shadow-*` variable names in JS via the
existing `applySettings()` function (see `App.tsx` lines 85–98) — no additional
dark-mode selector needed, matching the app's existing theming pattern.

**Alternatives considered**: Single shadow for all states — rejected for flat
visual hierarchy. Colored shadows — rejected for complexity without benefit in
this UI.

---

## 4. Animation & Transition Tokens

**Decision**: 3 duration tiers + 2 easing functions with token-level reduced-motion override.

| Token | Value | Use case |
|-------|-------|----------|
| `--duration-fast` | 120ms | Hover, color changes, button press |
| `--duration-normal` | 200ms | Tab switch, fade, small reveals |
| `--duration-slow` | 300ms | Expand/collapse, modal enter/exit |
| `--ease-default` | `cubic-bezier(0.2, 0, 0, 1)` | Most transitions |
| `--ease-decelerate` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | Enter/reveal |

**Reduced motion approach**: Override at the token level, not per-component:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
  }
}
```

**Rationale**: Token-level reduced-motion is superior to per-component media queries —
write transitions referencing `var(--duration-normal)` once, and the preference is
respected everywhere. No boilerplate, no missed components. Setting to `0ms` allows
`transitionend` events to still fire while making motion imperceptible.

**Alternatives considered**: Per-component `@media` queries — rejected for
boilerplate and risk of missed components. `animation: none !important` global —
rejected for breaking animations that provide essential state feedback.

---

## 5. Status Indicator Colors

**Decision**: Theme-adaptive status colors using the existing JS-based theming approach.

| Status | Light bg | Light text | Dark bg | Dark text |
|--------|----------|------------|---------|-----------|
| Success | `hsl(145, 65%, 92%)` | `hsl(145, 70%, 28%)` | `hsl(145, 40%, 18%)` | `hsl(145, 60%, 65%)` |
| Error | `hsl(0, 75%, 93%)` | `hsl(0, 70%, 35%)` | `hsl(0, 45%, 20%)` | `hsl(0, 65%, 68%)` |
| Warning | `hsl(40, 90%, 90%)` | `hsl(30, 80%, 30%)` | `hsl(40, 45%, 18%)` | `hsl(40, 70%, 65%)` |
| Info | `hsl(210, 75%, 92%)` | `hsl(210, 70%, 32%)` | `hsl(210, 40%, 18%)` | `hsl(210, 60%, 65%)` |

**Rationale**: All text-on-background pairings exceed WCAG AA 4.5:1 contrast.
Light theme uses desaturated, high-lightness backgrounds with dark text. Dark theme
inverts: low-lightness backgrounds with medium-lightness text. Status indicators
must pair color with icons for colorblind accessibility (WCAG 1.4.1).

**Alternatives considered**: Single color per status (no bg/text split) — rejected
for insufficient contrast in dark mode. Opacity-based approach — rejected for
unpredictable contrast ratios.

---

## 6. Inline Style Removal Strategy

**Decision**: Replace all hardcoded inline styles in `DeviceSettingsModal.tsx` and
settings panels with CSS class-based styling via `App.css`.

**Current state**: `DeviceSettingsModal.tsx` has ~20 inline style objects with
hardcoded dark-mode colors (`#0f0f14`, `#333`, `#b0b0b0`). Settings panels
(`DisplayPanel.tsx`, etc.) each have ~15 inline styles with hardcoded values.

**Approach**: 
- Create CSS classes (e.g., `.modal-content-dark`, `.panel-input`) that reference
  existing CSS custom properties.
- Remove all inline `style={{...}}` from TSX files.
- The existing `applySettings()` function already sets `--surface`, `--text-primary`,
  `--input-bg` etc. — the hardcoded colors bypass this system and must be eliminated.

**Rationale**: Inline styles override the theming system, breaking light mode
entirely in the settings modal. Moving to CSS classes restores theme compliance
and reduces component complexity.

---

## 7. Pulsing Status Dot Animation

**Decision**: CSS `@keyframes` animation for online device status dots.

**Approach**: 
- Define `@keyframes pulse` animation that scales from 1 to 1.5 and fades opacity.
- Apply to `.status-dot.online` class.
- Use `var(--duration-slow)` for animation duration.
- Automatically disabled via reduced-motion token override.

**Rationale**: A pulsing dot is the most universally recognized "active/live"
indicator. Using CSS keyframes keeps it lightweight with zero JS overhead.

---

## 8. Settings Panel Expand/Collapse

**Decision**: CSS `max-height` transition with `overflow: hidden`.

**Current state**: Panels use conditional rendering (`{expanded && <div>...`). This
provides no animation — content appears/disappears instantly.

**Approach**: 
- Keep the React conditional rendering for accessibility (screen readers skip
  collapsed content).
- Add CSS transition on `.panel-content` using `max-height` from `0` to a
  generous value (e.g., `1000px`).
- Use `var(--duration-slow)` and `var(--ease-default)` for the transition.

**Rationale**: `max-height` transition is the most reliable pure-CSS approach for
variable-height content. Grid-based animation (`grid-template-rows: 0fr → 1fr`)
is newer but has less consistent browser support in Tauri's webview.

**Alternatives considered**: JS-measured height animations — rejected for complexity.
`details/summary` element — rejected because existing accordion pattern uses
buttons with `aria-expanded`.
