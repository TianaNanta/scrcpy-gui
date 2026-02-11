# Quickstart: UI Refinement & Visual Polish

**Feature**: 002-ui-refinement  
**Date**: 2026-02-11

## Prerequisites

- Bun installed (`bun --version`)
- Rust toolchain installed (`rustc --version`)
- Tauri CLI installed (`cargo install tauri-cli`)

## Getting Started

```bash
# 1. Switch to the feature branch
git checkout 002-ui-refinement

# 2. Install dependencies (no new deps, just ensure node_modules is current)
bun install

# 3. Start the development server
bun run tauri dev
```

## Development Workflow

### CSS Changes (most of the work)

All design token and styling changes go in:
- `src/App.css` — design tokens (`:root` block) and component styles

After saving CSS changes, Vite HMR will hot-reload immediately — no page refresh needed.

### Component Changes (TSX)

Component modifications go in:
- `src/components/*.tsx` — remove inline styles, add CSS classes, add empty/loading states
- `src/components/settings-panels/*.tsx` — remove hardcoded inline styles

### Testing

```bash
# Run all frontend tests
bun run test

# Watch mode for active development
bun run test:watch
```

Test files are co-located: `Component.tsx` → `Component.test.tsx`

## Key Files to Modify

| File | Changes |
|------|---------|
| `src/App.css` | Add design tokens (spacing, typography, shadow, animation), refine component styles |
| `src/components/Sidebar.tsx` | Animated tab transitions, dependency badges |
| `src/components/DeviceList.tsx` | Empty state, loading skeleton, card hover effects |
| `src/components/DeviceSettingsModal.tsx` | Remove inline styles, sticky header/footer, use CSS classes |
| `src/components/settings-panels/*.tsx` | Remove hardcoded inline styles, use CSS classes |
| `src/components/SettingsPage.tsx` | Consistent section styling |
| `src/components/PresetManager.tsx` | Consistent card styling |
| `src/components/LogViewer.tsx` | Consistent container styling |

## Design Token Reference

See [data-model.md](data-model.md) for the complete token catalog.

Quick reference:
- Spacing: `var(--space-xs)` through `var(--space-2xl)`
- Typography: `var(--text-heading)`, `var(--text-subheading)`, `var(--text-body)`, `var(--text-caption)`
- Shadows: `var(--shadow-subtle)` through `var(--shadow-floating)`
- Animation: `var(--duration-fast)`, `var(--duration-normal)`, `var(--duration-slow)`
- Easing: `var(--ease-default)`, `var(--ease-decelerate)`

## Validation Checklist

Before considering a change complete:

1. Toggle between light and dark themes — everything renders correctly
2. Switch between all 5 color schemes — accent colors apply everywhere
3. Resize window to 600px width — layout adapts gracefully
4. Tab through all interactive elements — focus indicators visible
5. Enable "Reduce motion" in OS settings — all animations disabled
6. Run `bun run test` — all tests pass
7. Run `bun run build` — zero errors, zero warnings

## Architecture Notes

- **No new dependencies**: Everything uses existing React, Heroicons, and Jost font
- **No Rust changes**: This is entirely a frontend visual refinement
- **Theme system**: The app sets CSS variables via JS in `App.tsx:applySettings()` — shadow and status color tokens should be added there for theme-awareness
- **Inline style debt**: `DeviceSettingsModal.tsx` and settings panels have extensive inline styles with hardcoded dark colors — these must be moved to CSS classes
