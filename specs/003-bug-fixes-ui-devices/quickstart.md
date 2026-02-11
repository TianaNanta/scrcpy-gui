# Quickstart: Bug Fixes — UI Theming, Command Execution & Device Management

**Feature**: `003-bug-fixes-ui-devices`  
**Date**: 2026-02-11

## Prerequisites

- **Bun** (package manager) — installed and on PATH
- **Rust** (latest stable) — `rustup`, `cargo` on PATH
- **Tauri CLI** — installed via `bun add -D @tauri-apps/cli`
- **ADB** — Android Debug Bridge on PATH (for device testing)
- **scrcpy** — on PATH (for mirroring testing)
- **A physical Android device** (USB or wireless) — for integration testing

## Getting Started

```bash
# Clone and checkout feature branch
git checkout 003-bug-fixes-ui-devices

# Install frontend dependencies
bun install

# Run in development mode (launches Tauri with hot-reload)
bun run tauri dev

# Run frontend tests
bun run test

# Run Rust tests
cd src-tauri && cargo test

# Build for production
bun run tauri build
```

## Development Workflow

### 1. Theme Fixes (FR-001 through FR-004)

**Files to modify**:
- [index.html](../../index.html) — Add synchronous theme script in `<head>`
- [src/App.css](../../src/App.css) — Add missing `:root` defaults, replace hardcoded colors, remove ineffective `option` styling
- [src/App.tsx](../../src/App.tsx) — Add `color-scheme` property to `applySettings()`, add OS theme change listener

**Testing approach**:
1. Start dev server: `bun run tauri dev`
2. Open Settings → set theme to Dark → inspect every screen for light-colored elements
3. Open Settings → set theme to System → change OS theme at runtime → verify app follows
4. Close app → reopen → verify no flash of wrong theme
5. Run existing visual-regression tests: `bun run test -- --grep "theme"`

### 2. Command Builder Unification (FR-005 through FR-008)

**Files to modify**:
- [src/utils/command-builder.ts](../../src/utils/command-builder.ts) — Refactor `buildCommandPreview` into `buildArgs` → returns `string[]`
- [src/hooks/useDeviceSettings.ts](../../src/hooks/useDeviceSettings.ts) — Replace `buildInvokeConfig` with `buildArgs` usage
- [src-tauri/src/commands/scrcpy.rs](../../src-tauri/src/commands/scrcpy.rs) — Simplify `start_scrcpy` to accept `Vec<String>` args

**Testing approach**:
1. Run existing command builder tests: `bun run test -- --grep "command"`
2. Add new tests for camera/virtualDisplay guards, default skipping, space handling
3. Run Rust tests: `cd src-tauri && cargo test`
4. Manual: configure options in UI → compare preview with actual execution behavior

### 3. Device Persistence & Auto-Discovery (FR-009 through FR-014)

**Files to modify**:
- [src/types/device.ts](../../src/types/device.ts) — Update `Device` interface with new fields
- [src-tauri/src/commands/device.rs](../../src-tauri/src/commands/device.rs) — Add registry merge logic, file persistence
- [src/App.tsx](../../src/App.tsx) — Add polling interval, handle "Forget" action
- [src/components/DeviceList.tsx](../../src/components/DeviceList.tsx) — Disconnected device styling, "Forget" button

**Testing approach**:
1. Connect USB device → verify it appears automatically (no manual Add)
2. Disconnect → verify device stays with "disconnected" badge
3. Reconnect → verify status returns to "connected" and settings preserved
4. Use "Forget" on disconnected device → verify it's removed
5. Restart app → verify disconnected devices persist across sessions

### 4. Settings Persistence (FR-015, FR-016)

**Files to modify**:
- [src/App.tsx](../../src/App.tsx) — Save settings on modal close, sync device name to list
- [src/components/DeviceSettingsModal.tsx](../../src/components/DeviceSettingsModal.tsx) — Add `onSave` callback to close handler

**Testing approach**:
1. Open device settings → change options → close without launching → reopen → verify saved
2. Rename device → close → verify name updates in device list immediately

### 5. Pair Device Modal (FR-017, FR-018)

**Files to modify**:
- [src/components/PairDeviceModal.tsx](../../src/components/PairDeviceModal.tsx) — Add IP validation, async feedback
- [src/App.tsx](../../src/App.tsx) — Don't close modal until connection result received

**Testing approach**:
1. Enter invalid IP → verify validation error shown
2. Enter valid IP → verify loading indicator → verify success/error message → verify modal stays open on error

## Key Architecture Decisions

| Decision | Reference |
|---|---|
| Use `color-scheme` CSS property for native dark dropdowns | [research.md#R1](./research.md) |
| Blocking `<script>` in `<head>` for FOWT prevention | [research.md#R2](./research.md) |
| Single `buildArgs()` function as command source of truth | [research.md#R4](./research.md) |
| Rust-managed `devices.json` with three-way merge | [research.md#R5](./research.md) |
| 3-second setInterval polling for auto-discovery | [research.md#R6](./research.md) |
| USB and wireless serials as separate device entries | [research.md#R7](./research.md) |

## File Change Summary

| File | Change Type | Scope |
|---|---|---|
| `index.html` | Modify | Add theme preloader script |
| `src/App.css` | Modify | Fix ~15 hardcoded colors, add `:root` defaults |
| `src/App.tsx` | Modify | Theme listener, polling, save-on-close, device state |
| `src/types/device.ts` | Modify | Add `last_seen`, `first_seen`, status union type |
| `src/utils/command-builder.ts` | Modify | Unify into `buildArgs()` + `formatCommandDisplay()` |
| `src/hooks/useDeviceSettings.ts` | Modify | Remove `buildInvokeConfig`, use `buildArgs` |
| `src/components/DeviceList.tsx` | Modify | Disconnected styling, "Forget" button |
| `src/components/PairDeviceModal.tsx` | Modify | IP validation, async feedback |
| `src/components/DeviceSettingsModal.tsx` | Modify | Save-on-close callback |
| `src-tauri/src/commands/scrcpy.rs` | Modify | Simplify to `Vec<String>` passthrough |
| `src-tauri/src/commands/device.rs` | Modify | Registry merge, file persistence |
| `src-tauri/src/lib.rs` | Modify | Register `forget_device` command |
