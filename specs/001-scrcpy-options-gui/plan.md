# Implementation Plan: Complete scrcpy Options GUI

**Branch**: `001-scrcpy-options-gui` | **Date**: 2026-02-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-scrcpy-options-gui/spec.md`

## Summary

Extend the existing scrcpy-gui Tauri app to expose all major scrcpy CLI features
through the GUI — keyboard/mouse/gamepad input modes, audio forwarding controls,
camera mirroring, V4L2 virtual webcam, virtual display, and OTG mode. This
requires extending the `DeviceSettings` and `Preset` interfaces, adding new Tauri
commands (version detection, V4L2 device listing), decomposing the 2874-line
monolithic `App.tsx` into discrete components, and capturing scrcpy stderr for
error reporting. The approach adds features incrementally by user story priority
while restructuring the codebase for maintainability per constitution principles.

Additionally, all new and existing interactive components must meet the
constitution's keyboard accessibility mandate (III-6). This requires adding ARIA
semantics, focus management, and keyboard navigation patterns across the
component tree.

## Technical Context

**Language/Version**: TypeScript ~5.6 (strict mode) + Rust 1.93 (edition 2021)
**Primary Dependencies**: Tauri 2.x, React 18.3, Vite 6.x, tokio 1.x, serde 1.x, rfd 0.16
**Package Manager**: Bun 1.3.9
**Storage**: `localStorage` (frontend) — no database, no Tauri store plugin
**Testing**: `cargo test` (Rust), Vitest (frontend — jsdom environment)
**Target Platform**: Linux primary (constitution), cross-platform via Tauri
**Project Type**: Desktop app (Tauri = Rust backend + React frontend)
**Performance Goals**: <3s cold start, <2s device refresh, <100ms settings preview update, <500KB gzipped frontend bundle
**Constraints**: No `any` types, zero Rust warnings, functions ≤50 lines, scoped re-renders
**Scale/Scope**: Single-user desktop app, ~7 user stories, ~17 new scrcpy flags

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Code Quality & Type Safety

| Gate | Status | Notes |
|------|--------|-------|
| TypeScript strict mode | ✅ PASS | `tsconfig.json` has `strict: true` |
| No `any` types in new code | ✅ PASS | All new interfaces will be fully typed |
| Rust zero warnings | ✅ PASS | Existing code compiles clean; new commands will maintain this |
| Typed IPC boundary | ⚠️ VIOLATION | Current `start_scrcpy` has 34 individual params — not a typed struct. New fields make this worse |
| Functions ≤50 lines | ⚠️ VIOLATION | Current `App.tsx` has `renderContent()` spanning ~2100 lines. Must decompose |
| Dead code removal | ⚠️ VIOLATION | `greet` command in lib.rs is unused |

### Principle II — Testing Standards

| Gate | Status | Notes |
|------|--------|-------|
| Tauri command unit tests | ⚠️ VIOLATION | No tests exist in `lib.rs` currently. New commands must include tests |
| Frontend test coverage | ⚠️ VIOLATION | No test infrastructure exists. Must add Vitest |
| Co-located test files | ✅ PASS | Will enforce with new component structure |

### Principle III — User Experience Consistency

| Gate | Status | Notes |
|------|--------|-------|
| 100ms feedback | ✅ PASS | Command preview already updates reactively |
| Actionable errors | ⚠️ VIOLATION | scrcpy stderr is not captured — `Stdio::inherit()`. Must fix |
| Theme support | ⚠️ VIOLATION | Device settings modal has hardcoded dark-theme inline styles |
| Responsive layout | ✅ PASS | Existing CSS handles 800px+ |
| Keyboard accessibility (III-6) | ⚠️ VIOLATION | Zero ARIA attributes, no focus traps in modals, panel headers are non-focusable divs, device cards unreachable by keyboard, no `aria-expanded`/`aria-selected`, no `:focus-visible` styles |

### Principle IV — Performance Requirements

| Gate | Status | Notes |
|------|--------|-------|
| Non-blocking IPC | ✅ PASS | All Tauri commands are async |
| Scoped re-renders | ⚠️ VIOLATION | ~50 `useState` calls in one component means every state change re-renders entire tree |
| Stable memory | ✅ PASS | Log buffer is currently unbounded but low volume |
| Bundle size <500KB | ✅ PASS | Only dependency is @heroicons/react |

### Pre-existing Violations (to address during implementation)

| Violation | Principle | Resolution |
|-----------|-----------|------------|
| 34-param `start_scrcpy` | I | Refactor to accept a single typed `ScrcpyConfig` struct |
| 2100-line `renderContent()` | I | Decompose into component files |
| No tests at all | II | Add Vitest for frontend, add `#[cfg(test)]` for Rust |
| Unused `greet` command | I | Remove |
| Inline dark-theme styles | III | Extract to CSS custom properties |
| 50 `useState` in one component | IV | Move to extracted components with local state |
| scrcpy stderr not captured | III | Capture via `Stdio::piped()` and stream to frontend |
| Zero keyboard accessibility | III-6 | Add ARIA semantics, focus traps, keyboard handlers, `:focus-visible` styles |

**GATE RESULT**: PASS WITH CONDITIONS — Violations are pre-existing and will be resolved as part of this feature implementation. No new violations introduced.

### Post-Design Re-check (after Phase 1)

| Pre-existing Violation | Resolution in Design | Status |
|------------------------|---------------------|--------|
| 34-param `start_scrcpy` | `ScrcpyConfig` typed struct defined in [data-model.md](data-model.md) and [contracts](contracts/tauri-commands.md) | ✅ RESOLVED |
| 2100-line `renderContent()` | Decomposed into 11 settings panels + 6 page components + 3 hooks (see Project Structure) | ✅ RESOLVED |
| No tests at all | Vitest setup researched ([research.md](research.md) R5), test file locations defined in structure | ✅ RESOLVED |
| Unused `greet` command | Marked for removal in [contracts](contracts/tauri-commands.md) | ✅ RESOLVED |
| Inline dark-theme styles | New components use CSS custom properties; existing modal to be migrated | ✅ ADDRESSED |
| 50 `useState` in one component | Split into 3 React Contexts with `useReducer` ([research.md](research.md) R6) | ✅ RESOLVED |
| scrcpy stderr not captured | `scrcpy-log` event contract defined in [contracts](contracts/tauri-commands.md) | ✅ RESOLVED |
| Zero keyboard accessibility | Accessibility patterns defined in [research.md](research.md) R7, requirements mapped to components in Keyboard Accessibility section | ✅ RESOLVED |

**POST-DESIGN GATE**: ✅ PASS — All pre-existing violations have design-level resolutions. No new violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/001-scrcpy-options-gui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Tauri command contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── App.tsx                          # Slim shell: sidebar + router only
├── App.css                          # Global CSS custom properties + theme + focus styles
├── main.tsx                         # Entry point (unchanged)
├── types/
│   ├── device.ts                    # Device, DeviceHealth interfaces
│   ├── settings.ts                  # DeviceSettings, Preset interfaces
│   └── scrcpy.ts                    # ScrcpyConfig, enums (KeyboardMode, etc.)
├── components/
│   ├── Sidebar.tsx                  # Tab navigation (role=tablist + arrow keys)
│   ├── DeviceList.tsx               # Device cards with search/filter
│   ├── DeviceSettingsModal.tsx       # Settings modal shell + accordion (focus trap + ESC)
│   ├── settings-panels/
│   │   ├── InputControlPanel.tsx    # US1: keyboard, mouse, gamepad modes
│   │   ├── AudioPanel.tsx           # US2: audio forwarding, codec, bitrate
│   │   ├── VideoSourcePanel.tsx     # US3: display vs camera, camera opts
│   │   ├── DisplayPanel.tsx         # Existing: resolution, rotation, crop
│   │   ├── WindowPanel.tsx          # Existing: position, size, always-on-top
│   │   ├── BehaviorPanel.tsx        # Existing: stay awake, show touches
│   │   ├── RecordingPanel.tsx       # Existing: record toggle, file, format
│   │   ├── PerformancePanel.tsx     # Existing: FPS, codec, encoder, buffer
│   │   ├── V4L2Panel.tsx            # US4: V4L2 sink, buffer, no-playback
│   │   ├── VirtualDisplayPanel.tsx  # US5: new-display, start-app
│   │   └── NetworkPanel.tsx         # Existing: timeout, cleanup, ADB forward
│   ├── CommandPreview.tsx           # Generated command + copy button
│   ├── PresetManager.tsx            # Presets tab content
│   ├── LogViewer.tsx                # Logs tab content
│   ├── SettingsPage.tsx             # Settings tab content
│   └── PairDeviceModal.tsx          # USB/wireless pairing modal (focus trap + ESC)
├── hooks/
│   ├── useDeviceSettings.ts         # Per-device settings state + persistence
│   ├── useScrcpyProcess.ts          # Start/stop/stderr capture
│   └── useScrcpyVersion.ts         # Version detection + feature gating
├── utils/
│   ├── command-builder.ts           # Single source of truth for command string
│   └── platform.ts                  # OS detection helpers
└── vite-env.d.ts

src-tauri/src/
├── main.rs                          # Entry point (unchanged)
├── lib.rs                           # Command registration, process management
├── commands/
│   ├── mod.rs                       # Re-exports
│   ├── device.rs                    # list_devices, get_device_health, test_device
│   ├── scrcpy.rs                    # start_scrcpy (typed config), stop_scrcpy
│   ├── connection.rs                # connect/disconnect wireless
│   ├── system.rs                    # check_dependencies, get_scrcpy_version, get_platform
│   └── file.rs                      # select_save_file
└── tests/
    ├── device_test.rs
    ├── scrcpy_test.rs
    └── system_test.rs
```

**Structure Decision**: Tauri desktop app — frontend in `src/` (React components,
hooks, utils, types), backend in `src-tauri/src/` (Rust commands organized by domain).
This is the existing project structure evolved with component decomposition. The
monolithic `App.tsx` is split into ~20 focused files. Rust commands are extracted
from the single `lib.rs` into domain modules.

## Keyboard Accessibility Design

### Constitution III-6 Requirements

> "Keyboard accessibility MUST be maintained for all interactive elements;
> tab order MUST follow visual layout."

### Current State (Audit Findings)

- **Zero ARIA attributes** across the entire component tree
- **11 panel headers** are `<div onClick>` — keyboard-inaccessible
- **DeviceSettingsModal**: no `role="dialog"`, no focus trap, no ESC-to-close, no focus restoration
- **PairDeviceModal**: same gaps as DeviceSettingsModal
- **Device cards**: `<div onDoubleClick>` — unreachable by keyboard
- **Sidebar tabs**: `<button>` elements (focusable) but no `role="tablist"` / `role="tab"` / `aria-selected`
- **Search input**: no `<label>` or `aria-label`
- **Icon-only buttons** (delete, refresh, close): `title` but no `aria-label`
- **No `:focus-visible` styles**; `outline: none` with subtle box-shadow replacements
- **Only 1 keyboard handler** in entire codebase (PresetManager Enter-to-save)

### Design Decisions

1. **Panel headers**: Convert `<div onClick>` to `<button>` with `aria-expanded={isOpen}`. Native `<button>` gives keyboard focus + Enter/Space activation for free. No `tabIndex` hacking needed.

2. **Modals (DeviceSettingsModal, PairDeviceModal)**:
   - Add `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing to heading
   - Add `onKeyDown` handler for `Escape` → close
   - Add focus trap: on open, focus first interactive element; on Tab past last element, wrap to first; on Shift+Tab past first, wrap to last
   - On close, restore focus to the element that opened the modal (store via `useRef`)

3. **Device cards**: Add `tabIndex={0}` + `role="button"` + `aria-label` (e.g., "Configure Pixel 7") + `onKeyDown` for Enter/Space → open settings. "Pair New Device" card: same treatment.

4. **Sidebar**: Add `role="tablist"` to container, `role="tab"` + `aria-selected` to each button, `role="tabpanel"` to content area. Add arrow key navigation (Up/Down to move between tabs, Home/End for first/last).

5. **Icon-only buttons**: Add `aria-label` to close (×), delete (🗑), refresh (↻) buttons.

6. **Search input**: Add `aria-label="Search devices"` (no visible label needed since the placeholder is descriptive and the control is singular).

7. **Disabled controls with tooltips**: Ensure `aria-describedby` points to the tooltip text explaining why the control is disabled, so screen readers announce the reason.

8. **Focus styles in App.css**:
   - Add `.sr-only` utility class for screen-reader-only text
   - Replace `:focus` styles with `:focus-visible` to avoid flash on mouse click
   - Ensure focus ring has ≥3:1 contrast ratio against background (use `outline: 2px solid var(--color-focus-ring)` with a CSS custom property)
   - Add `:focus-visible` styles for: `.sidebar-tab`, `.device-card`, `.panel-header button`, `.modal-close`, all buttons

9. **No external dependencies**: All accessibility is achievable with native HTML semantics, ARIA attributes, and vanilla React event handlers. No focus-trap library needed — manual trap in modals is ~15 lines of code.

### Component-Level Requirements

| Component | Changes Required |
|-----------|-----------------|
| **App.css** | Add `.sr-only` class; add `--color-focus-ring` CSS variable; replace `:focus` with `:focus-visible` for inputs/selects; add `:focus-visible` for buttons, sidebar tabs, panel headers, device cards, modal close |
| **Sidebar.tsx** | Add `role="tablist"` to nav, `role="tab"` + `aria-selected` to buttons, `onKeyDown` for arrow/Home/End navigation |
| **DeviceList.tsx** | Device cards: `tabIndex={0}` + `role="button"` + `aria-label` + `onKeyDown` (Enter/Space). "Pair" card: same. Search: `aria-label`. Filter buttons: `aria-pressed`. Delete: `aria-label` |
| **DeviceSettingsModal.tsx** | `role="dialog"` + `aria-modal` + `aria-labelledby`; focus trap + ESC handler + focus restore |
| **PairDeviceModal.tsx** | Same as DeviceSettingsModal |
| **All 11 settings panels** | Panel header: convert wrapping div to `<button>` with `aria-expanded`; tooltip-gated disabled controls: `aria-describedby` |
| **CommandPreview.tsx** | Copy button: add `aria-label="Copy command"` + live region feedback (`aria-live="polite"` "Copied!") |
| **PresetManager.tsx** | Already has Enter-to-save; add `aria-label` to icon buttons |
| **LogViewer.tsx** | Log output: `role="log"` + `aria-live="polite"` for new entries |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 11 settings panels | Each panel maps 1:1 to a scrcpy feature group; keeps components ≤50 lines | Fewer panels would create ≥100-line components violating constitution |
| `commands/` submodule in Rust | Current lib.rs is 461 lines and will grow to 800+ with new commands | Single file violates the 50-line function principle when adding version detection, stderr capture, V4L2 listing |
| Modal focus trap code | Constitution III-6 requires keyboard accessibility; focus traps keep modal navigation correct | External focus-trap library rejected per constitution dependency policy — manual implementation is ~15 lines |
