# Implementation Plan: Stale-State Race Condition in Modal Launch Path

**Branch**: `003-bug-fixes-ui-devices` | **Date**: 2026-02-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-bug-fixes-ui-devices/spec.md` — Session 3 (camera mode stale-state bug)

## Summary

When launching scrcpy from the device settings modal, `handleLaunchFromModal` saves settings via `setAllDeviceSettings()` (React batched/async) then immediately calls `startScrcpy()` which reads `allDeviceSettings.get(serial)` — still containing the **old** state. This causes all modal setting changes (including `videoSource: "camera"`) to be ignored at launch time. Fix: pass `currentSettings` directly to `startScrcpy` instead of reading from the stale state map.

## Technical Context

**Language/Version**: TypeScript ~5.6.2 (strict) + Rust stable (edition 2021)
**Primary Dependencies**: React 18.3, Tauri 2.x, Vite 6, @heroicons/react, tokio 1, serde 1, chrono 0.4
**Storage**: localStorage (frontend device settings, presets, names); Tauri app data dir (device registry JSON)
**Testing**: Vitest 4 (jsdom env, 296 tests across 23 files); cargo test (34 Rust tests)
**Target Platform**: Linux primary (Tauri desktop app)
**Project Type**: Tauri desktop app — React frontend + Rust backend with IPC
**Performance Goals**: Cold start <3s, device list refresh <2s, theme switch <1s
**Constraints**: Bundle <500KB gzipped, no CSS-in-JS, strict TypeScript, zero Rust warnings
**Scale/Scope**: Single user, 1-10 devices, ~52 settings fields per device

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality & Type Safety | PASS | Fix adds an optional `DeviceSettings` parameter to `startScrcpy`. No new `any` types. Strict TS maintained. |
| II. Testing Standards | PASS | Bug fix requires regression test: `handleLaunchFromModal` must pass `currentSettings` to `buildArgs`, not stale state. Deterministic (mock invoke). |
| III. UX Consistency | PASS | No UI changes. Fix is internal plumbing — ensures launched command matches preview. |
| IV. Performance | PASS | No new dependencies, no new IPC calls. Removes one unnecessary state read. |
| Tech Stack | PASS | No new dependencies. Standard React patterns. |
| Dev Workflow | PASS | Co-located test. `bun run build` + `cargo build` verified. |

**Gate Result**: ALL PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/003-bug-fixes-ui-devices/
├── plan.md              # This file
├── research.md          # Phase 0 output (appended R12)
├── data-model.md        # No changes needed
├── quickstart.md        # Phase 1 output (appended Session 3)
├── contracts/           # Phase 1 output
│   ├── command-builder-contract.md  # Existing (Session 2)
│   ├── tauri-commands.md            # Existing (Session 1)
│   └── launch-path-contract.md      # NEW (Session 3)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (affected files)

```text
src/
└── App.tsx              # MODIFY — fix startScrcpy + handleLaunchFromModal

src-tauri/               # No Rust changes needed
```

**Structure Decision**: Single file fix in `src/App.tsx`. The `startScrcpy` function gains an optional `settingsOverride` parameter. `handleLaunchFromModal` passes `currentSettings` directly. No new files created.

## Complexity Tracking

No constitution violations — this section intentionally left empty.

## Post-Design Constitution Re-Check

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| I. Code Quality | PASS | `startScrcpy` signature: `async function startScrcpy(serial?: string, settingsOverride?: DeviceSettings)`. Clean optional parameter. No type widening. |
| II. Testing | PASS | Regression test: verify `buildArgs` receives camera settings when launched from modal. Deterministic via mock. |
| III. UX | PASS | No UI changes. User's configured settings now correctly reach scrcpy. |
| IV. Performance | PASS | Zero new dependencies. One fewer state map lookup when override provided. |

**Post-Design Gate Result**: ALL PASS — ready for task generation (`/speckit.tasks`).
