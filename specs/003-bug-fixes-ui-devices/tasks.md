# Tasks: Bug Fixes — UI Theming, Command Execution & Device Management

**Input**: Design documents from `/specs/003-bug-fixes-ui-devices/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tauri-commands.md, quickstart.md

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup

**Purpose**: Ensure the project builds and tests pass before making changes

- [x] T001 Verify project compiles and all existing tests pass by running `bun install && bun run test && cd src-tauri && cargo test`
- [x] T002 Create a snapshot of current CSS custom properties and hardcoded colors for comparison in `src/App.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared type changes and infrastructure that multiple user stories depend on

**⚠️ CRITICAL**: US3 and US4 depend on the Device type update. US2 depends on the command builder refactor type. These must complete before their respective story phases.

- [x] T003 Update `DeviceStatus` union type and `Device` interface with `last_seen`, `first_seen`, and status union `"device" | "offline" | "unauthorized" | "disconnected"` in `src/types/device.ts`
- [x] T004 [P] Add new CSS custom properties to `:root` block in `src/App.css`: `--border-color`, `--input-bg`, `--error-bg`, `--error-text`, `--error-border`, `--separator-color` with light-mode defaults
- [x] T005 [P] Remove dead CSS variables (`--surface-dark`, `--text-light`) and the ineffective `select.select option { ... }` rule from `src/App.css`

**Checkpoint**: Types updated, CSS foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Consistent Dark/Light Mode Theming (Priority: P1) 🎯 MVP

**Goal**: Every UI element correctly follows the active theme (dark, light, system) with no hardcoded light-only colors, no flash on load, and automatic OS theme tracking.

**Independent Test**: Switch between dark/light/system themes. Inspect every screen — dropdowns, modals, alerts, log viewer, settings panels. All elements must be legible and theme-appropriate.

### Implementation for User Story 1

- [x] T006 [US1] Add synchronous theme preloader `<script>` in `<head>` of `index.html` that reads `localStorage("scrcpy-theme")`, computes `isDark`, and sets `document.documentElement.style.colorScheme` and `data-theme` attribute before first paint. Add `<meta name="color-scheme" content="light dark">` tag.
- [x] T007 [US1] Add `color-scheme` CSS property toggle to `applySettings()` in `src/App.tsx` — set `root.style.setProperty("color-scheme", isDark ? "dark" : "light")` alongside existing theme var assignments
- [x] T008 [US1] Add OS theme change listener `useEffect` in `src/App.tsx` that attaches `addEventListener("change", handler)` on `window.matchMedia("(prefers-color-scheme: dark)")` when `theme === "system"`, re-invokes `applySettings`, and cleans up on unmount or theme change
- [x] T009 [US1] Update `applySettings()` in `src/App.tsx` to set the new CSS custom properties (`--error-bg`, `--error-text`, `--error-border`, `--separator-color`) with correct light and dark values per data-model.md CSS properties table
- [x] T010 [US1] Replace all hardcoded light-only colors in `src/App.css`: `.alert-error` background/color (`#fee2e2`, `#fecaca`, `#dc2626`) → `var(--error-bg)`, `var(--error-text)`, `var(--error-border)`
- [x] T011 [US1] Replace hardcoded border `rgba(255, 255, 255, 0.2)` on `.section` and `.device-card` in `src/App.css` with `var(--border-color)`
- [x] T012 [US1] Replace hardcoded log separator `rgba(255, 255, 255, 0.1)` in `.log-entry` border in `src/App.css` with `var(--separator-color)`
- [x] T013 [US1] Replace hardcoded `#dc2626` in `.btn-delete-text:hover`, `.btn-stop:hover`, `.btn-delete:hover` in `src/App.css` with `var(--error-color)`
- [x] T014 [US1] Audit and ensure all `var(--border-color)` usages without fallback in `src/App.css` (lines ~475, 484, 579, 786, 917, 1080, 1106, 1260, 1349, 1411, 1425, 1509) now have the `:root` default from T004
- [x] T015 [US1] Ensure `.panel-content select` in `src/App.css` uses `var(--input-bg)` and `var(--border-color)` consistently with `.select` class styling so all 16 select elements across settings panels are themed
- [x] T016 [US1] Add regression test in `src/components/SettingsPage.test.tsx` verifying that `applySettings` call sets `color-scheme` CSS property on document root for both dark and light themes

**Checkpoint**: All theme/visual bugs fixed. Dark mode dropdowns, alerts, borders, separators all themed correctly. No flash on load. OS theme changes tracked automatically.

---

## Phase 4: User Story 2 — Reliable Command Execution (Priority: P1)

**Goal**: Mirroring sessions launched via the app behave identically to copy-pasting the preview command. Single source of truth for argument generation.

**Independent Test**: Configure scrcpy options (resolution, bitrate, window title with spaces, camera mode, virtual display), launch via app, compare behavior to terminal paste.

### Implementation for User Story 2

- [x] T017 [US2] Refactor `buildCommandPreview()` in `src/utils/command-builder.ts` into `buildArgs(serial: string, settings: DeviceSettings): string[]` that returns a raw argument array (no joining). Apply all existing conditional guards (camera, virtualDisplay, OTG, default-value skipping). Add `--record-format` support when `recordFormat` is set and differs from file extension.
- [x] T018 [US2] Create `formatCommandDisplay(args: string[]): string` function in `src/utils/command-builder.ts` that joins args with space-quoting for values containing spaces/special characters: `args.map(a => /[\s"'\\$\`]/.test(a) || a === "" ? \`"\${a}"\` : a).join(" ")`
- [x] T019 [US2] Update `CommandPreview` component in `src/components/CommandPreview.tsx` to call `buildArgs()` + `formatCommandDisplay()` instead of the old `buildCommandPreview()`
- [x] T020 [US2] Delete `buildInvokeConfig()` function from `src/hooks/useDeviceSettings.ts` and replace all callers with `buildArgs()` from `src/utils/command-builder.ts`
- [x] T021 [US2] Simplify `start_scrcpy` Rust command in `src-tauri/src/commands/scrcpy.rs` to accept `(serial: String, args: Vec<String>, app: tauri::AppHandle)` and build command via `Command::new("scrcpy").args(&args)`. Remove the `ScrcpyConfig` struct, all `push_optional_*` helpers, and the per-field arg reconstruction logic. Keep process management, stdout/stderr streaming, and exit event emission.
- [x] T022 [US2] Update `startScrcpy` call in `src/App.tsx` (or `src/hooks/useScrcpyProcess.ts`) to invoke with `{ serial, args: buildArgs(serial, settings) }` instead of the old config object
- [x] T023 [US2] Update existing command builder tests in `src/utils/command-builder.test.ts` to test `buildArgs()` return type (`string[]`) and add new test cases for: camera-mode guard suppression, virtualDisplay guard suppression, default bitrate/audioBitrate skipping, OTG early return, window title with spaces preserved as single array element
- [x] T024 [US2] Update Rust tests in `src-tauri/src/commands/scrcpy.rs` to remove `ScrcpyConfig` deserialization tests and add test verifying `Vec<String>` args are passed through correctly

**Checkpoint**: Command preview and execution use the same `buildArgs()` function. Zero drift between displayed and executed commands.

---

## Phase 5: User Story 3 — Persistent Device List with Disconnected State (Priority: P1)

**Goal**: Devices persist in the list after disconnection with a "disconnected" status. Reconnecting restores them. Users can "Forget" devices permanently.

**Independent Test**: Connect device → disconnect → verify stays in list as "disconnected" → reconnect → verify status updates and settings preserved → "Forget" → verify removed.

### Implementation for User Story 3

- [x] T025 [US3] Implement device registry file I/O helper functions in `src-tauri/src/commands/device.rs`: `load_registry(app_data_dir) → Vec<DeviceInfo>` (reads `devices.json`, returns empty vec if file missing/corrupt), `save_registry(app_data_dir, Vec<DeviceInfo>)` (writes JSON)
- [x] T026 [US3] Implement three-way merge logic in `src-tauri/src/commands/device.rs`: `merge_devices(registry: Vec<DeviceInfo>, adb_output: Vec<AdbDevice>) → Vec<DeviceInfo>` per contracts/tauri-commands.md merge rules. New devices get `first_seen`/`last_seen`. Missing devices get `status = "disconnected"`. Matched devices get updated `status`/`last_seen` and re-fetched props if `status == "device"`.
- [x] T027 [US3] Update `list_devices` Tauri command in `src-tauri/src/commands/device.rs` to accept `app: tauri::AppHandle`, call `load_registry`, run ADB, call `merge_devices`, call `save_registry`, return merged list. Update command registration in `src-tauri/src/lib.rs` if signature changes.
- [x] T028 [US3] Implement `forget_device(serial: String, app: tauri::AppHandle)` Tauri command in `src-tauri/src/commands/device.rs` that removes device from `devices.json`. Register it in `src-tauri/src/lib.rs`.
- [x] T029 [US3] Update frontend Device type usage in `src/App.tsx` to handle the new `status` field values ("disconnected", "offline", "unauthorized") — disable Mirror button for non-"device" status, show appropriate status message when user attempts to mirror a disconnected device
- [x] T030 [US3] Update `DeviceList.tsx` in `src/components/DeviceList.tsx` to render disconnected devices with distinct visual styling (faded/dimmed card, status badge showing "Disconnected"/"Offline"/"Unauthorized"), and add a "Forget" button visible on disconnected devices
- [x] T031 [US3] Implement "Forget" action handler in `src/App.tsx` that calls `invoke("forget_device", { serial })`, then removes the device's settings from localStorage `deviceSettings` map, removes from `deviceNames` if present, and removes from React state
- [x] T032 [US3] Add Rust unit tests in `src-tauri/src/commands/device.rs` for `merge_devices`: test new device addition, disconnected marking, reconnection status update, and metadata preservation for disconnected devices
- [x] T033 [US3] Add Rust unit tests in `src-tauri/src/commands/device.rs` for `load_registry`/`save_registry`: test empty file, corrupt file recovery, round-trip serialization

**Checkpoint**: Devices persist across disconnects. "Forget" removes permanently. Disconnected devices are visually distinct. Mirroring blocked on disconnected devices.

---

## Phase 6: User Story 4 — Auto-Discovery of Directly Connected Devices (Priority: P2)

**Goal**: USB devices appear automatically without using the Add/Pair modal. Device list updates within 5 seconds of connection/disconnection changes.

**Independent Test**: Plug in USB device → verify it appears in 3–5 seconds without any button click. Unplug → verify status changes to "disconnected" within 3–5 seconds.

### Implementation for User Story 4

- [x] T034 [US4] Add 3-second `setInterval` polling in `src/App.tsx` `useEffect` that calls `listDevices()` automatically. Clean up interval on unmount. Ensure polling does not stack (skip if previous poll is still in progress).
- [x] T035 [US4] Optimize `list_devices` in `src-tauri/src/commands/device.rs` to only fetch expensive device properties (model, android_version, battery_level) for newly discovered devices or devices whose status changed to `"device"` — reuse cached values from registry for known connected devices
- [x] T036 [US4] Update `src/components/Sidebar.tsx` to show device count reflecting total (connected + disconnected) or just connected count, whichever is more useful

**Checkpoint**: USB devices auto-discovered. No manual refresh needed. Polling is efficient with cached properties.

---

## Phase 7: User Story 5 — Device Settings Persistence Without Launching (Priority: P2)

**Goal**: Settings modal saves changes on any close action, not just on "Launch". Device name changes reflect immediately in the device list.

**Independent Test**: Open settings → change options → close without launching → reopen → verify saved. Rename device → close → verify name updated in list.

### Implementation for User Story 5

- [x] T037 [US5] Add `onSave` callback prop to `DeviceSettingsModal` in `src/components/DeviceSettingsModal.tsx` that is called when the modal is about to close (from close button, Escape key, or backdrop click), passing the current settings state
- [x] T038 [US5] Implement settings-save-on-close handler in `src/App.tsx` that persists `currentSettings` to `allDeviceSettings` Map → `localStorage["deviceSettings"]` and updates `deviceNames` Map from `currentSettings.name`, called from both the modal `onSave` callback and the existing `handleLaunchFromModal`
- [x] T039 [US5] Consolidate device name sourcing: migrate from dual-source (`deviceNames` Map + `settings.name`) to single-source (`settings.name` only) in `src/App.tsx`. Update `DeviceList.tsx` to read device display name from `allDeviceSettings.get(serial)?.name` instead of `deviceNames.get(serial)`
- [x] T040 [US5] Add regression test in `src/hooks/useDeviceSettings.test.ts` verifying that settings are persisted to localStorage when save function is called (mock localStorage, verify `setItem` called with expected data)

**Checkpoint**: Settings always saved on close. Device names sync immediately. No data loss from closing without launching.

---

## Phase 8: User Story 6 — Pair Device Modal Improvements (Priority: P3)

**Goal**: Wireless connection flow validates IP, shows loading/success/error feedback, modal stays open on failure.

**Independent Test**: Enter invalid IP → see validation error. Enter valid IP → see loading → see success/error. On error, modal stays open for retry.

### Implementation for User Story 6

- [x] T041 [US6] Add IP address validation function in `src/components/PairDeviceModal.tsx`: validate IPv4 format (4 octets, each 0–255), reject empty/malformed input, show inline validation error below the input field
- [x] T042 [US6] Refactor wireless connection flow in `src/components/PairDeviceModal.tsx` and `src/App.tsx`: keep modal open during `invoke("connect_wireless_device")`, show a loading spinner during the async call, display success message on resolve (then auto-close after 1.5s), display error message on reject (modal stays open for retry)
- [x] T043 [US6] Add connection status state (`idle | connecting | success | error`) and feedback message display in `src/components/PairDeviceModal.tsx` with appropriate styling using theme-aware CSS variables

**Checkpoint**: Pair modal validates input, shows progress, provides feedback. Never closes silently on failure.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation across all user stories

- [x] T044 [P] Remove dead Rust code: delete `get_device_health` command if unused from `src-tauri/src/commands/device.rs` and unregister from `src-tauri/src/lib.rs` (or keep if planned for future use)
- [x] T045 [P] Remove duplicate Audio Codec `<select>` in `src/components/settings-panels/NetworkPanel.tsx` (mislabeled — duplicates AudioPanel's codec select)
- [x] T046 [P] Update `--color-focus-ring` CSS variable in `src/App.css` to use `var(--primary-color)` instead of hardcoded `#3b82f6`, and remove dead `--secondary-color` if unused
- [x] T047 [P] Clean up deprecated `deviceNames` localStorage key handling: add migration in `src/hooks/useDeviceSettings.ts` that reads old `deviceNames` entries, merges them into `deviceSettings` as `.name` fields, then removes the old key
- [x] T048 Run full test suite (`bun run test && cd src-tauri && cargo test`), fix any failures, verify `bun run build` succeeds with zero warnings
- [x] T049 Run quickstart.md manual validation: test all 5 development workflow sections end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS phases 3, 5, 6
- **Phase 3 (US1 Theming)**: Depends on Phase 2 (CSS vars in T004/T005)
- **Phase 4 (US2 Commands)**: Can start after Phase 1 — independent of Phase 2
- **Phase 5 (US3 Device Persistence)**: Depends on Phase 2 (Device type T003)
- **Phase 6 (US4 Auto-Discovery)**: Depends on Phase 5 (needs registry merge from T025–T027)
- **Phase 7 (US5 Settings Persistence)**: Can start after Phase 1 — independent of other stories
- **Phase 8 (US6 Pair Modal)**: Can start after Phase 1 — independent of other stories
- **Phase 9 (Polish)**: Depends on all other phases complete

### User Story Independence

| Story | Can Start After | Dependencies on Other Stories |
|---|---|---|
| US1 (Theming) | Phase 2 complete | None |
| US2 (Commands) | Phase 1 complete | None |
| US3 (Device Persistence) | Phase 2 complete | None |
| US4 (Auto-Discovery) | US3 complete | Uses `list_devices` merge from US3 |
| US5 (Settings Persistence) | Phase 1 complete | None |
| US6 (Pair Modal) | Phase 1 complete | None |

### Within Each User Story

- Implementation tasks within a story are sequentially ordered unless marked [P]
- Tasks marked [P] can run in parallel with other [P] tasks in the same phase
- Each story's checkpoint should be validated before the next story begins (for sequential execution)

### Parallel Opportunities

**After Phase 2 completes, these can run in parallel:**
- US1 (Theming) — touches `App.css`, `App.tsx`, `index.html`
- US2 (Commands) — touches `command-builder.ts`, `useDeviceSettings.ts`, `scrcpy.rs`
- US3 (Device Persistence) — touches `device.ts`, `device.rs`, `DeviceList.tsx`
- US5 (Settings Persistence) — touches `DeviceSettingsModal.tsx`, `App.tsx` (different sections)

**After US3 completes:**
- US4 (Auto-Discovery) — extends `App.tsx` polling and `device.rs` optimization

**Independently at any time:**
- US6 (Pair Modal) — touches `PairDeviceModal.tsx`

---

## Parallel Example: Post-Phase 2

```
# These can all run simultaneously (different files):
[US1] T006 — index.html theme preloader
[US2] T017 — command-builder.ts buildArgs refactor
[US3] T025 — device.rs registry I/O
[US5] T037 — DeviceSettingsModal.tsx save-on-close
[US6] T041 — PairDeviceModal.tsx IP validation
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (types + CSS vars)
3. Complete Phase 3: US1 Theming — most visible fix
4. Complete Phase 4: US2 Commands — core functionality fix
5. Complete Phase 5: US3 Device Persistence — workflow fix
6. **STOP and VALIDATE**: All P1 stories should be independently testable
7. Deploy/demo — app now has correct theming, reliable execution, and persistent devices

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 Theming → visually polished (SC-001, SC-007)
3. US2 Commands → functionally reliable (SC-002)
4. US3 Device Persistence → workflow improved (SC-004)
5. US4 Auto-Discovery → discovery frictionless (SC-003, SC-008)
6. US5 Settings Persistence → no data loss (SC-005)
7. US6 Pair Modal → polished connection UX (SC-006)
8. Polish → dead code cleaned up, full test pass

---
---

# Session 2: Camera/No-Control Flag Suppression & UI Hints

**Input**: Updated design documents from Session 2 (2026-02-11)
**Context**: Bug fix — `--video-source=camera` and `--no-control` cause scrcpy to error when control-dependent flags are passed. See [command-builder-contract.md](contracts/command-builder-contract.md) for full behavioral contract.
**Scope**: 4 files modified, 0 new files. Frontend-only fix.
**Spec References**: FR-007 (suppression), FR-007a (UI hints), US2 scenarios 5

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US2)
- Exact file paths included in all task descriptions

---

## Phase 10: Setup (Session 2)

**Purpose**: Verify baseline — all Session 1 work still passes before making changes

- [x] T050 Verify project compiles and all existing tests pass by running `bun run test && cd src-tauri && cargo test && cd .. && bun run build`

---

## Phase 11: User Story 2 (continued) — Control-Disabled Flag Suppression (Priority: P1)

**Goal**: When device control is disabled — either implicitly by camera mode or explicitly by `--no-control` — the command builder silently suppresses 5 control-dependent flags. The BehaviorPanel shows an informational banner explaining why. Toggle state is preserved.

**Independent Test**: Set `videoSource` to `camera`, enable `turnScreenOff` + `showTouches` + `stayAwake` + `powerOffOnClose`, generate args → verify none of those 4 flags appear. Set `noPowerOn` → verify `--no-power-on` DOES appear. Open BehaviorPanel with camera mode → verify info banner is shown. Repeat with `noControl: true` instead of camera.

### Implementation

- [x] T051 [US2] Add `controlDisabled` guard and suppress 4 behavior flags in `src/utils/command-builder.ts`: Insert `const controlDisabled = settings.videoSource === "camera" || settings.noControl;` before the Behavior section (line ~131). Guard `turnScreenOff`, `stayAwake`, `showTouches`, `powerOffOnClose` with `&& !controlDisabled`. Leave `noPowerOn` unguarded (safe without control).
- [x] T052 [US2] Suppress `--start-app` when control is disabled in `src/utils/command-builder.ts`: In the Virtual Display section (line ~196), change `if (settings.startApp)` to `if (settings.startApp && !controlDisabled)`. Move the `controlDisabled` const above Virtual Display section so it is in scope.
- [x] T053 [P] [US2] Add control-disabled warning banner to `src/components/settings-panels/BehaviorPanel.tsx`: After the panel-content opening, before the first `<div className="row">`, add a conditional banner using the existing `version-warning` class. Show when `settings.videoSource === "camera"` (message: "Camera mode disables device control — some behavior options will be skipped.") or `settings.noControl` (message: "Read-only mode — some behavior options will be skipped."). Follow the existing OTG warning pattern.
- [x] T054 [P] [US2] Add regression tests for control-disabled suppression in `src/utils/command-builder.test.ts`: Add a new `describe("control-disabled flag suppression")` block with these test cases: (1) camera mode suppresses `--turn-screen-off`, (2) camera mode suppresses `--show-touches`, (3) camera mode suppresses `--stay-awake`, (4) camera mode suppresses `--power-off-on-close`, (5) camera mode does NOT suppress `--no-power-on`, (6) noControl suppresses `--turn-screen-off`, (7) virtual display + camera suppresses `--start-app`, (8) neither camera nor noControl → flags are emitted normally.
- [x] T055 [P] [US2] Add BehaviorPanel hint rendering tests in `src/components/settings-panels/BehaviorPanel.test.tsx`: Add tests verifying: (1) camera mode shows "Camera mode disables device control" banner, (2) noControl shows "Read-only mode" banner, (3) normal mode (no camera, no noControl) does NOT show banner, (4) toggles remain interactive (not disabled) when banner is shown.

**Checkpoint**: Camera mode and no-control mode correctly suppress control-dependent flags. UI informs users. All regression tests pass.

---

## Phase 12: Verification (Session 2)

**Purpose**: Final validation — all tests pass, build clean, no regressions

- [x] T056 Run full test suite (`bun run test && cd src-tauri && cargo test`), verify `bun run build` succeeds with zero errors, and confirm total test count increased by the new regression tests

---

## Dependencies & Execution Order (Session 2)

### Phase Dependencies

- **Phase 10 (Setup)**: No dependencies — start immediately
- **Phase 11 (US2 continued)**: Depends on Phase 10
- **Phase 12 (Verification)**: Depends on Phase 11

### Within Phase 11

- T051 and T052 touch the same file (`command-builder.ts`) — execute sequentially (T051 first, then T052 uses same `controlDisabled` const)
- T053 (BehaviorPanel.tsx), T054 (command-builder.test.ts), T055 (BehaviorPanel.test.tsx) are in different files and marked [P] — can run in parallel with each other AND after T051
- T053, T054, T055 can start after T051 (they test/complement the new behavior)

### Parallel Opportunities

```bash
# After T051 completes, these can all run simultaneously:
[US2] T052 — command-builder.ts (startApp guard, same file as T051 but different section)
[US2] T053 — BehaviorPanel.tsx (UI warning banner)
[US2] T054 — command-builder.test.ts (regression tests)
[US2] T055 — BehaviorPanel.test.tsx (hint rendering tests)
```

---

## Implementation Strategy (Session 2)

### Execution Order

1. T050: Verify baseline
2. T051: Add `controlDisabled` guard for 4 behavior flags
3. T052: Guard `--start-app` in virtual display section
4. T053 + T054 + T055 (parallel): UI banner + all regression tests
5. T056: Full verification

### Scope

- **4 files modified**: `command-builder.ts`, `command-builder.test.ts`, `BehaviorPanel.tsx`, `BehaviorPanel.test.tsx`
- **0 new files**: All changes within existing files
- **~30 lines added** across all files (estimated)
- **No Rust changes**: Fix is entirely in the frontend command builder and UI

---

# Session 3: Stale-State Race Condition in Modal Launch Path

**Input**: Updated design documents from Session 3 (2026-02-12)
**Context**: Bug fix — selecting `--video-source=camera` in the device settings modal doesn't activate the camera. The displayed command preview is correct, but the actual launched command uses stale/default settings. Root cause: `handleLaunchFromModal` calls `setAllDeviceSettings()` (React batched/async) then immediately reads the old state in `startScrcpy()`. See [launch-path-contract.md](contracts/launch-path-contract.md) for full behavioral contract and [research.md](research.md) R12 for decision rationale.
**Scope**: 1 file modified (`src/App.tsx`), 1 test file modified. Frontend-only fix.
**Spec References**: FR-005 (command execution consistency), US2 (reliable command execution)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US2)
- Exact file paths included in all task descriptions

---

## Phase 13: Setup (Session 3)

**Purpose**: Verify baseline — all Session 1+2 work still passes before making changes

- [x] T057 Verify project compiles and all existing tests pass by running `bun run test && cd src-tauri && cargo test && cd .. && bun run build`

---

## Phase 14: User Story 2 (continued) — Stale-State Launch Fix (Priority: P1)

**Goal**: When launching scrcpy from the device settings modal, the executed command uses the exact settings the user configured in the modal — not stale state from before the modal was opened. The fix adds an optional `settingsOverride` parameter to `startScrcpy()` so `handleLaunchFromModal` can pass `currentSettings` directly, bypassing the batched `setAllDeviceSettings` state.

**Independent Test**: Open device settings modal → set `videoSource` to `camera` → click "Start Mirroring" → verify the Tauri `invoke("start_scrcpy")` call receives args containing `--video-source=camera`. Repeat with other settings changes (e.g., resolution, bitrate) to confirm they all reach the launched command.

### Implementation

- [x] T058 [US2] Add `settingsOverride?: DeviceSettings` parameter to `startScrcpy` function in `src/App.tsx`: Change the function signature from `async function startScrcpy(serial?: string)` to `async function startScrcpy(serial?: string, settingsOverride?: DeviceSettings)`. Replace the settings resolution line (currently `const settings: DeviceSettings = { ...DEFAULT_DEVICE_SETTINGS, ...allDeviceSettings.get(deviceSerial) }`) with `const settings: DeviceSettings = settingsOverride ?? { ...DEFAULT_DEVICE_SETTINGS, ...allDeviceSettings.get(deviceSerial) }`. This ensures existing call sites (DeviceList, PairDeviceModal) continue reading from state, while the modal launch path can bypass stale state. See [launch-path-contract.md](contracts/launch-path-contract.md) for the exact implementation.
- [x] T059 [US2] Update `handleLaunchFromModal` callback in `src/App.tsx` to pass `currentSettings` as the second argument to `startScrcpy`: Change `startScrcpy(selectedDeviceForSettings)` to `startScrcpy(selectedDeviceForSettings, currentSettings)`. This ensures the modal's live settings reach `buildArgs()` directly without going through React's batched state update cycle.
- [x] T060 [P] [US2] Add regression test for modal launch settings override in `src/App.test.tsx` (or co-located test): Write a test that verifies when `startScrcpy` is called with a `settingsOverride` containing `videoSource: "camera"`, the resulting `invoke("start_scrcpy")` call receives args that include `--video-source=camera`. Also verify that when `settingsOverride` is undefined, settings are read from the `allDeviceSettings` map as before (backward compatibility).

**Checkpoint**: Modal launch path now correctly passes user-configured settings to scrcpy. Camera mode, and all other modal setting changes, work identically whether launched from the app or copy-pasted from the command preview.

---

## Phase 15: Verification (Session 3)

**Purpose**: Final validation — all tests pass, build clean, no regressions

- [x] T061 Run full test suite (`bun run test && cd src-tauri && cargo test`), verify `bun run build` succeeds with zero errors, and confirm total test count increased by the new regression test(s)

---

## Dependencies & Execution Order (Session 3)

### Phase Dependencies

- **Phase 13 (Setup)**: No dependencies — start immediately
- **Phase 14 (US2 continued)**: Depends on Phase 13
- **Phase 15 (Verification)**: Depends on Phase 14

### Within Phase 14

- T058 and T059 touch the same file (`App.tsx`) — execute sequentially (T058 first adds the parameter, T059 updates the call site)
- T060 (regression test) is in a different file and marked [P] — can run in parallel with T059 after T058 completes

### Parallel Opportunities

```bash
# After T058 completes, these can run simultaneously:
[US2] T059 — App.tsx (update handleLaunchFromModal call site)
[US2] T060 — App.test.tsx (regression test for settings override)
```

---

## Implementation Strategy (Session 3)

### Execution Order

1. T057: Verify baseline (all 296 JS + 34 Rust tests pass, build clean)
2. T058: Add `settingsOverride` parameter to `startScrcpy`
3. T059 + T060 (parallel): Update `handleLaunchFromModal` + regression test
4. T061: Full verification

### Scope

- **1 file modified**: `App.tsx` (~2-3 lines changed)
- **1 test file modified/created**: `App.test.tsx` (regression test)
- **0 new production files**: Fix is entirely within existing `startScrcpy` function
- **No Rust changes**: Fix is entirely in the frontend React layer
- **~10 lines added** across all files (estimated)
