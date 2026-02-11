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

## Technical Context

**Language/Version**: TypeScript ~5.6 (strict mode) + Rust 1.93 (edition 2021)
**Primary Dependencies**: Tauri 2.x, React 18.3, Vite 6.x, tokio 1.x, serde 1.x, rfd 0.16
**Package Manager**: Bun 1.3.9
**Storage**: `localStorage` (frontend) — no database, no Tauri store plugin
**Testing**: `cargo test` (Rust), Vitest (to add for frontend — currently no frontend tests)
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
├── App.css                          # Global CSS custom properties + theme
├── main.tsx                         # Entry point (unchanged)
├── types/
│   ├── device.ts                    # Device, DeviceHealth interfaces
│   ├── settings.ts                  # DeviceSettings, Preset interfaces
│   └── scrcpy.ts                    # ScrcpyConfig, enums (KeyboardMode, etc.)
├── components/
│   ├── Sidebar.tsx                  # Tab navigation
│   ├── DeviceList.tsx               # Device cards with search/filter
│   ├── DeviceSettingsModal.tsx       # Settings modal shell + accordion
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
│   └── PairDeviceModal.tsx          # USB/wireless pairing modal
├── hooks/
│   ├── useDeviceSettings.ts         # Per-device settings state + persistence
│   ├── useScrcpyProcess.ts          # Start/stop/stderr capture
│   └── useScrcpyVersion.ts          # Version detection + feature gating
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

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 11 settings panels | Each panel maps 1:1 to a scrcpy feature group; keeps components ≤50 lines | Fewer panels would create ≥100-line components violating constitution |
| `commands/` submodule in Rust | Current lib.rs is 461 lines and will grow to 800+ with new commands | Single file violates the 50-line function principle when adding version detection, stderr capture, V4L2 listing |
