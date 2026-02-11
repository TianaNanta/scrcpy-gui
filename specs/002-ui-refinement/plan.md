# Implementation Plan: UI Refinement & Visual Polish

**Branch**: `002-ui-refinement` | **Date**: 2026-02-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-ui-refinement/spec.md`

## Summary

Refine the existing scrcpy-gui application with a cohesive visual language,
polished micro-interactions, and enhanced component styling. The approach extends
the current CSS custom properties (design tokens) system with a comprehensive
spacing scale, typography hierarchy, and animation primitives. Device cards get
animated status indicators and hover effects, the settings modal gains smooth
panel transitions and a sticky header/footer, and the sidebar receives animated
tab transitions and color-coded dependency badges. All enhancements respect
`prefers-reduced-motion`, work in both light and dark themes, and maintain the
existing theming architecture. This is a frontend-only change — no Rust/backend
modifications required.

## Technical Context

**Language/Version**: TypeScript ~5.6 (strict mode) + Rust 1.93 (edition 2021)  
**Primary Dependencies**: Tauri 2.x, React 18.3, Vite 6.x, @heroicons/react 2.2  
**Package Manager**: Bun  
**Storage**: `localStorage` (frontend) — no changes  
**Testing**: Vitest (frontend — jsdom environment), co-located test files  
**Target Platform**: Linux primary (constitution), cross-platform via Tauri  
**Project Type**: Desktop app (Tauri = Rust backend + React frontend)  
**Performance Goals**: All animations ≤300ms, <500KB gzipped frontend bundle (constitution), 60fps animations  
**Constraints**: No new npm dependencies, CSS-only styling (no CSS-in-JS), all themes supported, `prefers-reduced-motion` respected  
**Scale/Scope**: Single-user desktop app, 5 user stories, ~17 functional requirements, frontend-only changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Code Quality & Type Safety

| Gate | Status | Notes |
|------|--------|-------|
| TypeScript strict mode | ✅ PASS | `tsconfig.json` has `strict: true` — no changes needed |
| No `any` types in new code | ✅ PASS | Minimal TS changes; any new types will be fully typed |
| Rust zero warnings | ✅ N/A | No Rust changes in this feature |
| Typed IPC boundary | ✅ N/A | No IPC changes — frontend-only styling |
| Functions ≤50 lines | ✅ PASS | New/modified components will stay within limit |
| Dead code removal | ✅ PASS | No dead code introduced |

### Principle II — Testing Standards

| Gate | Status | Notes |
|------|--------|-------|
| Frontend component tests | ✅ PASS | Updated tests for new visual states (empty state, loading skeleton) |
| Tests co-located | ✅ PASS | Test files remain next to source files |
| Deterministic tests | ✅ PASS | Visual changes don't depend on device connectivity |

### Principle III — User Experience Consistency

| Gate | Status | Notes |
|------|--------|-------|
| Visual feedback <100ms | ✅ PASS | All transitions ≤300ms; hover/focus feedback is instant |
| Theme changes without reload | ✅ PASS | All new styles use CSS custom properties |
| Layout 800×600 to 4K | ✅ PASS | Spec extends to 600px min; responsive adjustments included |
| Keyboard accessibility | ✅ PASS | Focus indicators enhanced (FR-009), existing a11y preserved |

### Principle IV — Performance Requirements

| Gate | Status | Notes |
|------|--------|-------|
| <3s cold start | ✅ PASS | CSS-only changes; no performance impact |
| <500KB gzipped bundle | ✅ PASS | No new dependencies added |
| Scoped re-renders | ✅ PASS | New empty state and loading components are leaf nodes |
| No unbounded memory growth | ✅ PASS | CSS animations don't allocate memory |

### Technology Stack Constraints

| Gate | Status | Notes |
|------|--------|-------|
| Styling: CSS custom properties | ✅ PASS | All new styles via CSS custom properties — no CSS-in-JS |
| No new dependencies | ✅ PASS | Zero new npm/cargo deps; uses existing Heroicons + Jost font |

**GATE RESULT**: ✅ All gates pass. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-ui-refinement/
├── plan.md              # This file
├── research.md          # Phase 0: CSS animation patterns, design token research
├── data-model.md        # Phase 1: Design token catalog
├── quickstart.md        # Phase 1: Developer quick-start guide
├── contracts/           # Phase 1: Component visual contracts
└── tasks.md             # Phase 2: Implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── App.css                          # Extended: design tokens, animations, refined styles
├── App.tsx                          # Minor: loading state integration
├── components/
│   ├── Sidebar.tsx                  # Modified: animated tab indicator, dependency badges
│   ├── Sidebar.test.tsx             # Updated: badge rendering tests
│   ├── DeviceList.tsx               # Modified: empty state, loading skeleton, card hover
│   ├── DeviceSettingsModal.tsx      # Modified: sticky header/footer, remove inline styles
│   ├── SettingsPage.tsx             # Modified: consistent section styling
│   ├── PresetManager.tsx            # Modified: consistent card styling
│   ├── LogViewer.tsx                # Modified: consistent container styling
│   └── settings-panels/
│       └── *.tsx                    # Modified: remove hardcoded inline styles, use CSS classes
```

**Structure Decision**: Frontend-only changes within the existing `src/` directory.
No new directories needed. The primary work is in `App.css` (design token
extension + new animation classes) and component TSX files (replacing inline
styles with CSS classes, adding empty/loading states).

## Complexity Tracking

> No constitution violations to justify. All gates pass cleanly.
