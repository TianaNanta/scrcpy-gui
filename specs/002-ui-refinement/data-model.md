# Data Model: Design Token Catalog

**Feature**: 002-ui-refinement  
**Date**: 2026-02-11

This feature does not introduce traditional data entities (database tables, API
models). Instead, the "data model" is a **design token catalog** — the named
values that form the visual contract between CSS and components.

## Design Token Entities

### 1. Spacing Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--space-xs` | 4px | Icon padding, tight inner gaps |
| `--space-sm` | 8px | Component inner padding, small gaps |
| `--space-md` | 12px | Default padding, form gaps |
| `--space-lg` | 16px | Section padding, card content |
| `--space-xl` | 24px | Panel gaps, major separation |
| `--space-2xl` | 32px | Page gutters |

**Validation**: All spacing values in component CSS must reference these tokens.
No magic pixel values.

### 2. Typography Tokens

| Token | Value | Weight | Line Height |
|-------|-------|--------|-------------|
| `--text-heading` | `calc(var(--font-size) * 1.5)` | 600 | 1.3 |
| `--text-subheading` | `calc(var(--font-size) * 1.125)` | 500 | 1.4 |
| `--text-body` | `var(--font-size)` | 400 | 1.5 |
| `--text-caption` | `calc(var(--font-size) * 0.875)` | 400 | 1.4 |

**Relationships**: Derived from the user-configurable `--font-size` variable
(set in Settings page, default 16px).

### 3. Shadow Tokens

| Token | Light Value | Dark Value | Use Case |
|-------|-------------|------------|----------|
| `--shadow-subtle` | `0 1px 2px rgba(0,0,0,0.06)` | `0 1px 2px rgba(0,0,0,0.20)` | Cards at rest |
| `--shadow-medium` | `0 2px 8px rgba(0,0,0,0.10)` | `0 2px 8px rgba(0,0,0,0.30)` | Hovered cards |
| `--shadow-elevated` | `0 8px 24px rgba(0,0,0,0.12)` | `0 8px 24px rgba(0,0,0,0.40)` | Dropdowns |
| `--shadow-floating` | `0 16px 48px rgba(0,0,0,0.16)` | `0 16px 48px rgba(0,0,0,0.50)` | Modals |

**State transitions**: Cards transition from `--shadow-subtle` → `--shadow-medium`
on hover. Modals use `--shadow-floating` on open.

### 4. Animation Tokens

| Token | Value | Reduced Motion |
|-------|-------|----------------|
| `--duration-fast` | 120ms | 0ms |
| `--duration-normal` | 200ms | 0ms |
| `--duration-slow` | 300ms | 0ms |
| `--ease-default` | `cubic-bezier(0.2, 0, 0, 1)` | — |
| `--ease-decelerate` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | — |

**Validation**: All `transition` and `animation` properties must reference duration
tokens. The `prefers-reduced-motion` media query overrides at the `:root` level.

### 5. Status Color Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--status-success-bg` | `hsl(145, 65%, 92%)` | `hsl(145, 40%, 18%)` |
| `--status-success-text` | `hsl(145, 70%, 28%)` | `hsl(145, 60%, 65%)` |
| `--status-error-bg` | `hsl(0, 75%, 93%)` | `hsl(0, 45%, 20%)` |
| `--status-error-text` | `hsl(0, 70%, 35%)` | `hsl(0, 65%, 68%)` |
| `--status-warning-bg` | `hsl(40, 90%, 90%)` | `hsl(40, 45%, 18%)` |
| `--status-warning-text` | `hsl(30, 80%, 30%)` | `hsl(40, 70%, 65%)` |
| `--status-info-bg` | `hsl(210, 75%, 92%)` | `hsl(210, 40%, 18%)` |
| `--status-info-text` | `hsl(210, 70%, 32%)` | `hsl(210, 60%, 65%)` |

**Validation**: All status color pairings (text-on-bg) must meet WCAG AA 4.5:1
contrast ratio.

### 6. Border Radius Tokens

| Token | Value | Use Case |
|-------|-------|----------|
| `--radius-sm` | 6px | Buttons, inputs, badges |
| `--radius-md` | 10px | Cards, panels |
| `--radius-lg` | 16px | Modals, large containers |
| `--radius-full` | 9999px | Status dots, avatars |

**Relationships**: Replaces the existing `--border-radius: 12px` single token
with a graduated scale.

## Entity Relationships

```text
User Settings (--font-size)
    └── Typography Tokens (derived via calc())
        └── All text elements across components

Theme Selection (light/dark)
    ├── Shadow Tokens (opacity adjusted per theme)
    ├── Status Color Tokens (lightness/saturation adjusted)
    └── Existing color tokens (--surface, --text-primary, etc.)

prefers-reduced-motion
    └── Animation Tokens (durations zeroed)
        └── All transition/animation properties
```

## Migration Notes

- **Existing `--border-radius`**: Keep for backward compatibility but add
  `--radius-sm/md/lg/full`. Gradually replace usages.
- **Existing `--shadow`**: Replace with `--shadow-subtle` globally. The old
  single-value `--shadow` variable will be removed.
- **Existing `--transition`**: Replace with explicit `transition` declarations
  using duration + easing tokens. The old `all 0.3s ease` value will be removed.
