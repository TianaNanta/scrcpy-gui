# Research: Complete scrcpy Options GUI

**Feature**: 001-scrcpy-options-gui
**Date**: 2026-02-11
**Status**: Complete

## R1 — scrcpy Version Detection & Feature Gating

**Decision**: Parse `scrcpy --version` first-line output using simple string splitting (no regex crate needed).

**Output format** (confirmed locally with scrcpy 3.3.4):
```
scrcpy 3.3.4 <https://github.com/Genymobile/scrcpy>
```
First line, split by whitespace, second token is `X.Y.Z` (patch may be absent: `X.Y`).

**Feature version map** (confirmed from release notes):

| Feature | Min Version | CLI Flag |
|---------|-------------|----------|
| Audio forwarding | 2.0 | `--no-audio` to disable |
| `--no-audio` | 2.0 | `--no-audio` |
| `--no-video` | 2.1 | `--no-video` |
| Microphone capture | 2.1 | `--audio-source=mic` |
| Camera mirroring | 2.2 | `--video-source=camera` |
| `--keyboard=uhid`, `--mouse=uhid` | 2.4 | `--keyboard=uhid`, `--mouse=uhid` |
| `--gamepad=uhid` | 2.7 | `--gamepad=uhid` or `-G` |
| Virtual display (`--new-display`) | 3.0 | `--new-display[=WxH[/DPI]]` |

**Rationale**: String splitting avoids adding a regex dependency; the version format is stable and well-defined.

**Alternatives considered**: regex crate (rejected — too heavy for one parse), `semver` crate (rejected — adds dependency for trivial comparison).

---

## R2 — scrcpy stderr Capture & Streaming

**Decision**: Use `Stdio::piped()` for stderr, take the stderr handle before storing the child process, spawn a tokio task to read lines, and push them to the frontend via Tauri events (`app.emit()`).

**Approach**:
1. Add `app: AppHandle` parameter to `start_scrcpy` command
2. Set `cmd.stderr(Stdio::piped())`
3. Call `child.stderr.take()` before inserting child into the `SCRCPY_PROCESSES` HashMap
4. Spawn a `tokio::spawn` task with `BufReader::new(stderr).lines()` loop
5. Emit `"scrcpy-log"` events with `{ serial, line }` payload
6. Frontend listens via `listen<{serial: string, line: string}>('scrcpy-log', ...)`

**Rationale**: Tauri events are the standard mechanism for backend-to-frontend streaming. They're simple, ordered, and don't require additional dependencies.

**Alternatives considered**: Tauri Channels (higher perf but more complex setup — overkill for log lines at ~10/sec), writing to file then tailing (fragile, platform-dependent).

---

## R3 — V4L2 Device Listing

**Decision**: List `/dev/video*` entries via `std::fs::read_dir("/dev")` behind `#[cfg(target_os = "linux")]`. Return empty list on non-Linux.

**Details**: V4L2 loopback devices (from `v4l2loopback` kernel module) appear as regular `/dev/video*` entries. The command returns all video devices and lets the user select; no filtering for loopback-specific devices is needed since the user knows their setup.

**Rationale**: Simple filesystem listing avoids dependency on `v4l2-ctl` or V4L2 ioctl bindings.

**Alternatives considered**: `v4l2-ctl --list-devices` (requires tool installed), `/sys/class/video4linux/*/name` for loopback detection (unnecessary complexity for the user selecting a device path).

---

## R4 — Platform Detection

**Decision**: Use `@tauri-apps/plugin-os` for frontend (`platform()` is synchronous), `std::env::consts::OS` for Rust backend.

**Setup**: `tauri add os` adds the plugin. The `platform()` call returns `"linux"` | `"macos"` | `"windows"` synchronously (compile-time constant). Create `src/utils/platform.ts` exporting `isLinux`, `isWindows`, `isMacOS` constants.

**Rationale**: The OS plugin is the official Tauri approach and is synchronous, so it can be used directly in render conditions without async/state.

**Alternatives considered**: Custom Tauri command returning OS string (unnecessary given the plugin exists), user-agent sniffing (unreliable in webview).

---

## R5 — Vitest Setup for Tauri + React

**Decision**: Add Vitest with jsdom environment, `@testing-library/react`, and `@tauri-apps/api/mocks` for IPC mocking.

**Installation**: `bun add -d vitest jsdom @testing-library/react @testing-library/jest-dom`

**Key setup details**:
- Test environment: `jsdom`
- Mock IPC via `mockIPC((cmd, args) => { ... })` from `@tauri-apps/api/mocks`
- `clearMocks()` after each test
- WebCrypto polyfill required: `Object.defineProperty(window, 'crypto', { value: { getRandomValues: (buf) => randomFillSync(buf) } })`
- Config in `vitest.config.ts` or merged into `vite.config.ts`

**Rationale**: Vitest is the natural choice for a Vite project — zero config needed for module resolution and transforms.

**Alternatives considered**: Jest (requires separate babel/ts config, doesn't share Vite config), Playwright (overkill for unit/component tests).

---

## R6 — Component Decomposition Strategy

**Decision**: Use React Context + `useReducer` for state management, split into 3 contexts, decompose bottom-up (leaf components first).

**State split**:

| Context | State Variables | Purpose |
|---------|----------------|---------|
| `DeviceContext` | devices, selectedDevice, activeDevices, deviceNames, deviceSettings, deviceHealth | Device lifecycle |
| `ScrcpyConfigContext` | All scrcpy options (~35 fields) via `useReducer` | Settings form state |
| `AppContext` | theme, colorScheme, fontSize, currentTab, logs | App-level UI |

**Decomposition order**:
1. Extract types to `src/types/`
2. Extract utility functions to `src/utils/`
3. Create contexts with reducers
4. Extract leaf components (DeviceCard, LogViewer, CommandPreview)
5. Extract container components (DeviceList, DeviceSettingsModal, panels)
6. Slim `App.tsx` to context providers + layout + tab router

**Rationale**: Context + useReducer is built-in React (constitution requirement), handles ~50 state variables cleanly, and eliminates prop drilling. `useReducer` groups related transitions (e.g., `LOAD_PRESET` sets all fields at once).

**Alternatives considered**: Prop drilling (rejected — 50 props across 20 components is unmaintainable), zustand/jotai (rejected — external dependency, constitution says prefer built-in), single mega-context (rejected — every state change re-renders everything).
