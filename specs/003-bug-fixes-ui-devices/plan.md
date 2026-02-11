# Implementation Plan: Bug Fixes — UI Theming, Command Execution & Device Management

**Branch**: `003-bug-fixes-ui-devices` | **Date**: 2026-02-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-bug-fixes-ui-devices/spec.md`

## Summary

Fix critical bugs across four areas: (1) dark/light theme inconsistencies where dropdowns, alerts, borders and selects render with hardcoded light-only colors; (2) command execution drift where the preview builder and invoke builder apply different conditional logic for flags; (3) device list transience where disconnected devices are removed instead of persisted with status; (4) settings loss where modal close without launch discards changes. Technical approach: unify command builders into a single source of truth, introduce a persistent device registry with connection status tracking, fix all CSS theming to use custom properties without hardcoded fallbacks, and add save-on-close for the settings modal.

## Technical Context

**Language/Version**: TypeScript ~5.6.2 (strict mode) + Rust stable (Tauri 2.x)  
**Primary Dependencies**: React 18.3, Vite 6, Tauri 2, tokio 1, serde 1, @tauri-apps/api 2, @heroicons/react 2  
**Storage**: localStorage (frontend: device settings, names, presets, theme); no backend DB  
**Testing**: Vitest 4 + @testing-library/react 16 (jsdom env); Rust unit tests in-module  
**Target Platform**: Linux primary (Tauri desktop app)  
**Project Type**: Desktop app — Tauri (Rust backend) + React (TypeScript frontend)  
**Performance Goals**: Cold start <3s, device list refresh <2s, theme switch <1s (per constitution)  
**Constraints**: Bundle <500KB gzipped, no CSS-in-JS runtime, no external state management  
**Scale/Scope**: ~30 component/hook/util files, 13 Tauri commands, 6 settings panels

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Code Quality & Type Safety | PASS | All changes use strict TypeScript and typed Rust. No `any` types. New device status type will be a union type. Unified command builder reduces code duplication. |
| II | Testing Standards | PASS | Bug fixes will include regression tests per constitution requirement. Command builder unification will have before/after test cases. Device persistence tested with mocked localStorage. |
| III | User Experience Consistency | PASS | This feature directly addresses UX failures: theme inconsistency (FR-001–004), feedback gaps (FR-018), data loss prevention (FR-015). All UI changes will use CSS custom properties per constitution. |
| IV | Performance Requirements | PASS | Device polling interval (~5s) well within 2s refresh target per poll cycle. No new dependencies. No unbounded memory growth — device registry is bounded by physical device count. |
| — | Technology Stack | PASS | React 18 + TypeScript strict + Tauri 2 + Rust + Bun + CSS custom properties. No new deps needed. |
| — | Complexity | PASS | No new projects, packages, or architectural layers. Changes are localized to existing modules. Command unification reduces a code duplication pattern. |

**Gate result: PASS — no violations, no justifications needed.**

## Project Structure

### Documentation (this feature)

```text
specs/003-bug-fixes-ui-devices/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── tauri-commands.md
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── App.tsx                          # [MODIFY] Theme listener, device state, settings save-on-close
├── App.css                          # [MODIFY] Fix all hardcoded colors, add :root dark/light defaults
├── types/
│   └── device.ts                    # [MODIFY] Add connection status union type, persistent device type
├── utils/
│   └── command-builder.ts           # [MODIFY] Unify into single canonical builder used by both preview and invoke
├── hooks/
│   ├── useDeviceSettings.ts         # [MODIFY] Refactor buildInvokeConfig to use unified builder
│   └── useScrcpyProcess.ts          # [NO CHANGE] Already works correctly with proper args
├── components/
│   ├── DeviceList.tsx               # [MODIFY] Handle disconnected state, "Forget" action, status badges
│   ├── Sidebar.tsx                  # [MODIFY] Minor — ensure device count reflects connected/all
│   ├── PairDeviceModal.tsx          # [MODIFY] IP validation, async feedback, don't close on error
│   ├── DeviceSettingsModal.tsx      # [MODIFY] Save-on-close callback
│   ├── LogViewer.tsx                # [NO CHANGE]
│   └── settings-panels/
│       └── *.tsx                    # [MINOR] Ensure select elements styled consistently

src-tauri/src/
├── commands/
│   ├── device.rs                    # [MODIFY] Return richer status (offline/unauthorized/device)
│   ├── scrcpy.rs                    # [MODIFY] Apply same conditional guards as unified builder
│   └── connection.rs                # [NO CHANGE]
└── lib.rs                           # [NO CHANGE] — commands already registered
```

**Structure Decision**: Existing single-project Tauri + React structure is preserved. No new directories or architectural layers needed — changes are localized refinements to existing modules.
