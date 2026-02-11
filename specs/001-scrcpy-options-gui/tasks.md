# Tasks: Complete scrcpy Options GUI

**Input**: Design documents from `/specs/001-scrcpy-options-gui/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tauri-commands.md, quickstart.md

**Tests**: Not explicitly requested in feature specification. Test infrastructure is set up in Phase 1 (Vitest, cargo test). Individual test tasks deferred to Polish phase.

**Organization**: Tasks grouped by user story (7 stories from spec.md) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `src/` (React components, hooks, utils, types)
- **Backend**: `src-tauri/src/` (Rust commands organized by domain)
- Structure per plan.md Project Structure section

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, new dependencies, tooling configuration

- [ ] T001 Create project directory structure per plan.md (src/types/, src/components/, src/components/settings-panels/, src/hooks/, src/utils/, src-tauri/src/commands/)
- [ ] T002 Install frontend dev dependencies via bun add -d vitest jsdom @testing-library/react @testing-library/jest-dom
- [ ] T003 [P] Install and configure @tauri-apps/plugin-os via tauri plugin add os in src-tauri/
- [ ] T004 [P] Configure Vitest with jsdom environment and WebCrypto polyfill in vitest.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type extraction, Rust backend restructuring, component decomposition of existing 2874-line App.tsx, hooks, and utilities. Resolves all constitution violations.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. The monolithic App.tsx must be decomposed before adding new features.

### Types & Utilities

- [ ] T005 [P] Create Device and DeviceHealth interfaces extracted from App.tsx in src/types/device.ts
- [ ] T006 [P] Create DeviceSettings (52 fields), Preset interface, and all enums (KeyboardMode, MouseMode, GamepadMode, VideoSource, CameraFacing) per data-model.md in src/types/settings.ts
- [ ] T007 [P] Create ScrcpyVersion interface and version feature-gate helpers (hasAudio, hasCamera, hasUhidInput, hasGamepad, hasVirtualDisplay, hasNoVideo) per data-model.md in src/types/scrcpy.ts
- [ ] T008 [P] Create platform detection constants (isLinux, isWindows, isMacOS) using @tauri-apps/plugin-os platform() in src/utils/platform.ts
- [ ] T009 [P] Create buildCommandPreview function that generates a complete scrcpy command string from DeviceSettings (all existing flags) in src/utils/command-builder.ts

### Rust Backend Restructuring

- [ ] T010 Create src-tauri/src/commands/mod.rs and extract existing commands from lib.rs into domain modules: device.rs (list_devices, get_device_health, test_device), connection.rs (connect/disconnect_wireless_device), file.rs (select_save_file)
- [ ] T011 [P] Refactor start_scrcpy from 34 individual params to a single typed ScrcpyConfig struct (per data-model.md), add stderr capture via Stdio::piped() + tokio::spawn BufReader line reader + app.emit("scrcpy-log") per contracts, in src-tauri/src/commands/scrcpy.rs
- [ ] T012 [P] Create get_scrcpy_version (parse scrcpy --version first line), get_platform (std::env::consts::OS), and list_v4l2_devices (#[cfg(target_os = "linux")] read_dir /dev/video*) commands per contracts in src-tauri/src/commands/system.rs
- [ ] T013 Remove unused greet command and update Tauri command registration to use new commands/ modules in src-tauri/src/lib.rs

### React Hooks

- [ ] T014 Create useScrcpyVersion hook that invokes get_scrcpy_version on mount, parses ScrcpyVersion, and exposes feature-gate booleans per data-model.md in src/hooks/useScrcpyVersion.ts
- [ ] T015 [P] Create useDeviceSettings hook with per-device settings state via useReducer, localStorage persistence, default values for new fields (backward-compatible preset migration), in src/hooks/useDeviceSettings.ts
- [ ] T016 [P] Create useScrcpyProcess hook with start (invoke start_scrcpy with ScrcpyConfig), stop (invoke stop_scrcpy), and scrcpy-log event listener per contracts in src/hooks/useScrcpyProcess.ts

### Component Extraction (from App.tsx)

- [ ] T017 [P] Extract tab navigation sidebar from App.tsx into src/components/Sidebar.tsx
- [ ] T018 [P] Extract device cards with search, filter, and health display from App.tsx into src/components/DeviceList.tsx
- [ ] T019 [P] Extract generated command display and copy-to-clipboard button from App.tsx into src/components/CommandPreview.tsx
- [ ] T020 [P] Extract logs tab content with scrcpy-log event integration from App.tsx into src/components/LogViewer.tsx
- [ ] T021 [P] Extract presets tab (save, load, delete, apply presets with new field migration) from App.tsx into src/components/PresetManager.tsx
- [ ] T022 [P] Extract settings/preferences tab (theme, font size, color scheme) from App.tsx into src/components/SettingsPage.tsx
- [ ] T023 [P] Extract USB/wireless device pairing modal from App.tsx into src/components/PairDeviceModal.tsx

### Settings Panel Extraction (from App.tsx renderContent)

- [ ] T024 [P] Extract resolution, rotation, crop, display ID settings from App.tsx into src/components/settings-panels/DisplayPanel.tsx
- [ ] T025 [P] Extract window position, size, always-on-top, borderless, fullscreen settings from App.tsx into src/components/settings-panels/WindowPanel.tsx
- [ ] T026 [P] Extract stay awake, show touches, turn screen off, no control settings from App.tsx into src/components/settings-panels/BehaviorPanel.tsx
- [ ] T027 [P] Extract record toggle, record format, file path selection from App.tsx into src/components/settings-panels/RecordingPanel.tsx
- [ ] T028 [P] Extract max FPS, video codec, video encoder, video buffer settings from App.tsx into src/components/settings-panels/PerformancePanel.tsx
- [ ] T029 [P] Extract time limit, no cleanup, force ADB forward settings from App.tsx into src/components/settings-panels/NetworkPanel.tsx

### Assembly

- [ ] T030 Create DeviceSettingsModal as accordion shell that imports and renders all 6 extracted settings panels in src/components/DeviceSettingsModal.tsx
- [ ] T031 Refactor src/App.tsx to slim shell: context providers wrapping Sidebar + tab content router, delegating all rendering to extracted components

**Checkpoint**: Foundation ready — existing functionality preserved in decomposed components, Rust backend restructured, all pre-existing constitution violations resolved. User story implementation can now begin.

---

## Phase 3: User Story 1 — Input Mode Selection (Priority: P1) 🎯 MVP

**Goal**: Users can select keyboard and mouse input modes (Default, SDK, UHID, AOA) from dropdowns in device settings without typing CLI flags.

**Independent Test**: Select "Physical keyboard (UHID)", start scrcpy, verify command includes `--keyboard=uhid`. Reset to default, verify no `--keyboard` flag.

### Implementation for User Story 1

- [ ] T032 [P] [US1] Create keyboard mode dropdown (Default/SDK/UHID/AOA) and mouse mode dropdown (Default/SDK/UHID/AOA/Disabled) with version gating (≥2.4 via useScrcpyVersion) in src/components/settings-panels/InputControlPanel.tsx
- [ ] T033 [P] [US1] Add keyboard_mode and mouse_mode flag generation (--keyboard=X, --mouse=X when not "default") to command preview in src/utils/command-builder.ts
- [ ] T034 [US1] Integrate InputControlPanel into DeviceSettingsModal accordion as "Input & Control" section in src/components/DeviceSettingsModal.tsx

**Checkpoint**: User Story 1 fully functional — keyboard/mouse mode selection works end-to-end with command preview and version gating.

---

## Phase 4: User Story 2 — Audio Forwarding Controls (Priority: P1)

**Goal**: Users can toggle audio forwarding, select audio codec, adjust bitrate, and enable audio-only (no video) mode from the device settings panel.

**Independent Test**: Enable audio forwarding with AAC codec and 192K bitrate, verify command shows `--audio-codec=aac --audio-bit-rate=192000`. Disable audio, verify `--no-audio`. Enable no-video, verify `--no-video`.

### Implementation for User Story 2

- [ ] T035 [P] [US2] Create audio forwarding toggle, audio codec dropdown (opus/aac/flac/raw), audio bitrate input, noAudio toggle, and noVideo toggle (FR-011) with version gating (≥2.0 for audio, ≥2.1 for noVideo) in src/components/settings-panels/AudioPanel.tsx
- [ ] T036 [P] [US2] Add audio flags (--no-audio, --audio-codec, --audio-bit-rate, --audio-source=mic, --no-video) to command preview in src/utils/command-builder.ts
- [ ] T037 [US2] Integrate AudioPanel into DeviceSettingsModal accordion as "Audio" section in src/components/DeviceSettingsModal.tsx

**Checkpoint**: User Stories 1 AND 2 both work independently — input modes and audio forwarding can be configured and tested separately.

---

## Phase 5: User Story 3 — Camera Mirroring (Priority: P2)

**Goal**: Users can switch video source from Display to Camera, select camera facing (front/back/external), set camera resolution, and specify camera ID.

**Independent Test**: Select Camera as video source, pick Front facing, set size to 1920x1080, verify command shows `--video-source=camera --camera-facing=front --camera-size=1920x1080`.

### Implementation for User Story 3

- [ ] T038 [P] [US3] Create video source toggle (Display/Camera), camera facing dropdown, camera size input, camera ID input with version gating (≥2.2) and Android 12+ device gating in src/components/settings-panels/VideoSourcePanel.tsx
- [ ] T039 [P] [US3] Add video source and camera flags (--video-source, --camera-facing, --camera-size, --camera-id) to command preview in src/utils/command-builder.ts
- [ ] T040 [US3] Integrate VideoSourcePanel into DeviceSettingsModal accordion as "Video Source" section in src/components/DeviceSettingsModal.tsx
- [ ] T041 [US3] Implement videoSource state transition: when camera selected, disable/grey displayId, crop, rotation fields in DisplayPanel via src/hooks/useDeviceSettings.ts

**Checkpoint**: Camera mirroring fully functional — video source switching works with proper field disabling and command generation.

---

## Phase 6: User Story 4 — V4L2 Virtual Webcam (Priority: P2)

**Goal**: Linux users can expose phone screen/camera as a virtual webcam by selecting a V4L2 device path, with optional buffer and no-playback mode.

**Independent Test**: On Linux, enable V4L2 Sink, select /dev/video2, check No Playback, verify command shows `--v4l2-sink=/dev/video2 --no-playback`. On non-Linux, verify V4L2 section is hidden.

### Implementation for User Story 4

- [ ] T042 [P] [US4] Create V4L2 enable toggle, device path selector (populated via invoke list_v4l2_devices), buffer size input, noPlayback toggle with Linux-only visibility (isLinux from platform.ts) in src/components/settings-panels/V4L2Panel.tsx
- [ ] T043 [P] [US4] Add V4L2 flags (--v4l2-sink, --v4l2-buffer, --no-playback) to command preview in src/utils/command-builder.ts
- [ ] T044 [US4] Integrate V4L2Panel into DeviceSettingsModal accordion as "V4L2 Virtual Webcam" section (Linux only) in src/components/DeviceSettingsModal.tsx

**Checkpoint**: V4L2 virtual webcam fully functional on Linux — device listing, path selection, and flag generation work end-to-end.

---

## Phase 7: User Story 5 — Virtual Display (Priority: P3)

**Goal**: Users can create a virtual display on the device with custom resolution and DPI, optionally launching an app on it, without affecting the physical screen.

**Independent Test**: Enable Virtual Display, set resolution to 1920x1080, set start app to org.videolan.vlc, verify command shows `--new-display=1920x1080 --start-app=org.videolan.vlc`.

### Implementation for User Story 5

- [ ] T045 [P] [US5] Create virtual display enable toggle, resolution input (WxH), DPI input, start app package name field with version gating (≥3.0) in src/components/settings-panels/VirtualDisplayPanel.tsx
- [ ] T046 [P] [US5] Add virtual display flags (--new-display=WxH[/DPI], --start-app) to command preview in src/utils/command-builder.ts
- [ ] T047 [US5] Integrate VirtualDisplayPanel into DeviceSettingsModal accordion as "Virtual Display" section in src/components/DeviceSettingsModal.tsx
- [ ] T048 [US5] Implement virtualDisplay state transition: when enabled, disable/grey displayId field in DisplayPanel via src/hooks/useDeviceSettings.ts

**Checkpoint**: Virtual display fully functional — resolution, DPI, app launching, and displayId disabling work correctly.

---

## Phase 8: User Story 6 — OTG Mode (Priority: P3)

**Goal**: Users can enable OTG mode for input-only forwarding (keyboard/mouse as game controller) without video/audio mirroring overhead. USB-only.

**Independent Test**: With USB device connected, enable OTG mode, verify command shows `--otg`, verify incompatible options (audio, video, recording) are disabled. With wireless device, verify OTG toggle is disabled with tooltip.

### Implementation for User Story 6

- [ ] T049 [P] [US6] Add OTG mode toggle with USB-only validation (disabled + tooltip for wireless devices) to device settings UI in src/components/DeviceSettingsModal.tsx
- [ ] T050 [P] [US6] Add OTG flag (--otg) to command preview in src/utils/command-builder.ts
- [ ] T051 [US6] Implement OTG state transition: when enabled, force videoSource=display, disable recording/noVideo/noAudio toggles, grey out all a/v panel controls per data-model.md state transitions in src/hooks/useDeviceSettings.ts

**Checkpoint**: OTG mode fully functional — USB-only gating, incompatible option disabling, and clean command generation work correctly.

---

## Phase 9: User Story 7 — Gamepad Forwarding (Priority: P3)

**Goal**: Users can enable gamepad forwarding with UHID or AOA mode to use computer gamepads on Android device.

**Independent Test**: Enable gamepad forwarding with UHID mode, verify command shows `--gamepad=uhid`. Disable, verify no `--gamepad` flag.

### Implementation for User Story 7

- [ ] T052 [P] [US7] Add gamepad mode dropdown (Disabled/UHID/AOA) with version gating (≥2.7) to existing InputControlPanel in src/components/settings-panels/InputControlPanel.tsx
- [ ] T053 [P] [US7] Add gamepad_mode flag generation (--gamepad=X when not "disabled") to command preview in src/utils/command-builder.ts

**Checkpoint**: All 7 user stories now independently functional — gamepad forwarding extends the Input & Control panel created in US1.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Quality improvements that span multiple user stories, constitution compliance verification

- [ ] T054 [P] Add window title text input (FR-010, --window-title) to src/components/settings-panels/WindowPanel.tsx
- [ ] T055 [P] Add --window-title flag generation to command preview in src/utils/command-builder.ts
- [ ] T056 Implement cross-panel incompatible option disabling with explanatory tooltips (FR-013): camera options hidden when videoSource=display, V4L2 hidden on non-Linux, audio controls disabled below Android 11, camera disabled below Android 12, in src/components/DeviceSettingsModal.tsx
- [ ] T057 Migrate inline dark-theme styles from device settings modal JS to CSS custom properties in src/App.css
- [ ] T058 Run quickstart.md validation for all 7 user stories per specs/001-scrcpy-options-gui/quickstart.md
- [ ] T059 Code cleanup and dead code removal across src/ and src-tauri/src/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**
- **User Stories (Phase 3–9)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 Input Modes (P1)**: Can start after Foundational — no dependencies on other stories
- **US2 Audio (P1)**: Can start after Foundational — no dependencies on other stories
- **US3 Camera (P2)**: Can start after Foundational — no dependencies on other stories
- **US4 V4L2 (P2)**: Can start after Foundational — no dependencies on other stories
- **US5 Virtual Display (P3)**: Can start after Foundational — no dependencies on other stories
- **US6 OTG (P3)**: Can start after Foundational — no dependencies on other stories
- **US7 Gamepad (P3)**: Depends on **US1** completion (extends InputControlPanel created in US1)

### Within Each User Story

- Panel creation and command builder updates are parallel [P]
- Modal integration depends on panel creation
- State transitions depend on panel integration
- Story complete before moving to next priority

### Key Foundational Dependencies (within Phase 2)

```
T005-T009 (types/utils) ──→ T014-T016 (hooks) ──→ T017-T029 (components) ──→ T030-T031 (assembly)
T010 (Rust modules)     ──→ T011-T012 (new commands) ──→ T013 (registration update)
```

---

## Parallel Opportunities

### Phase 2: Types & Utilities (5 tasks in parallel)

```
T005 (device.ts)  ║  T006 (settings.ts)  ║  T007 (scrcpy.ts)  ║  T008 (platform.ts)  ║  T009 (command-builder.ts)
```

### Phase 2: Rust Commands (2 tasks in parallel after T010)

```
T011 (scrcpy.rs — start_scrcpy refactor)  ║  T012 (system.rs — version/platform/v4l2)
```

### Phase 2: Component Extraction (13 tasks in parallel)

```
T017 (Sidebar)  ║  T018 (DeviceList)  ║  T019 (CommandPreview)  ║  T020 (LogViewer)
T021 (PresetManager)  ║  T022 (SettingsPage)  ║  T023 (PairDeviceModal)
T024 (DisplayPanel)  ║  T025 (WindowPanel)  ║  T026 (BehaviorPanel)
T027 (RecordingPanel)  ║  T028 (PerformancePanel)  ║  T029 (NetworkPanel)
```

### User Story Phases (2 tasks in parallel per story)

```
# Example: US1 Input Mode Selection
T032 (InputControlPanel.tsx)  ║  T033 (command-builder.ts update)
→ then T034 (integrate into modal)

# Example: US3 Camera Mirroring
T038 (VideoSourcePanel.tsx)  ║  T039 (command-builder.ts update)
→ then T040 (integrate into modal)
→ then T041 (state transitions)
```

### Cross-Story Parallelism (after Phase 2)

```
US1 (Input)  ║  US2 (Audio)  ║  US3 (Camera)  ║  US4 (V4L2)
US5 (Virtual Display)  ║  US6 (OTG)
US7 (Gamepad) — must wait for US1 (extends InputControlPanel)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Input Mode Selection)
4. **STOP and VALIDATE**: Test keyboard/mouse mode dropdowns, command preview, version gating
5. Deploy/demo if ready — users can already select input modes without CLI

### Incremental Delivery

1. **Setup + Foundational** → App decomposed, Rust restructured, all existing features preserved
2. **+ US1 Input Modes** → Test independently → MVP! (P1)
3. **+ US2 Audio** → Test independently → Audio forwarding controls live (P1)
4. **+ US3 Camera** → Test independently → Camera mirroring accessible (P2)
5. **+ US4 V4L2** → Test independently → Virtual webcam for Linux users (P2)
6. **+ US5 Virtual Display** → Test independently → Advanced display features (P3)
7. **+ US6 OTG** → Test independently → Input-only mode available (P3)
8. **+ US7 Gamepad** → Test independently → Full input suite complete (P3)
9. **+ Polish** → Cross-cutting quality, tooltips, cleanup
10. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Phase 2 completion:

- Developer A: US1 (Input) → US7 (Gamepad, extends US1's panel)
- Developer B: US2 (Audio) → US5 (Virtual Display)
- Developer C: US3 (Camera) → US4 (V4L2)
- Developer D: US6 (OTG)
- All: Polish phase collaboratively

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks within same phase
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable after Foundational phase
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- command-builder.ts is updated incrementally per story — each story adds its flags
- DeviceSettingsModal.tsx is the integration point — each story adds its panel
- useDeviceSettings.ts handles state transitions — each story adds its rules
- Preset migration is handled in useDeviceSettings hook (T015) via default values for missing fields
- All 17 new DeviceSettings fields have sensible defaults so existing users are not disrupted
