# Research: Bug Fixes — UI Theming, Command Execution & Device Management

**Feature**: `003-bug-fixes-ui-devices`  
**Date**: 2026-02-11

## R1: Dark Mode for Native `<select>`/`<option>` Dropdowns

### Decision
Use `color-scheme: dark | light` on `:root`, toggled dynamically in `applySettings()`. Remove ineffective `option { background }` CSS rules.

### Rationale
- Chromium renders `<option>` popups in a **separate OS-level overlay** outside the page DOM. CSS `background`/`color` properties on `<option>` are ignored for the dropdown popup on Linux.
- `color-scheme` is Baseline Widely Available (Chrome 81+, Firefox 96+, Safari 13+). Setting `color-scheme: dark` on `:root` makes all native form controls (select popups, checkboxes, scrollbars) render in dark mode automatically.
- The existing `.select` class uses `appearance: none` for the closed state (fully custom-styled with CSS vars). `color-scheme` handles the native popup that cannot be styled any other way.
- Implementation: one line in `applySettings()` — `root.style.setProperty("color-scheme", isDark ? "dark" : "light")`.

### Alternatives Considered
| Approach | Verdict | Why Rejected |
|---|---|---|
| `option { background; color }` CSS | Rejected | Ignored by Chromium popup renderer on Linux |
| `appearance: base-select` (Chrome 135+) | Rejected | Experimental; Tauri's bundled Chromium may not support it |
| Custom dropdown component | Rejected | Adds complexity, accessibility burden, keyboard navigation reimplementation; overkill |

---

## R2: Preventing Flash of Wrong Theme (FOWT)

### Decision
Add a synchronous `<script>` block in `index.html` `<head>` (before stylesheets) to read localStorage and set `color-scheme` + `data-theme` attribute on `<html>`.

### Rationale
- Theme is currently applied in a React `useEffect` which runs **after** first paint, causing a visible flash.
- A blocking `<script>` in `<head>` executes before any rendering. It reads `localStorage('scrcpy-theme')`, computes `isDark`, and immediately sets `document.documentElement.style.colorScheme`.
- Complement with `<meta name="color-scheme" content="light dark">` to tell the browser both schemes are supported before any CSS parses.

### Alternatives Considered
| Approach | Verdict | Why Rejected |
|---|---|---|
| React `useEffect` only (current) | Rejected | Runs after first paint = visible flash |
| `<meta>` tag only | Insufficient | Can't be conditional on localStorage |
| Tauri `window.theme` config | Partial | Only controls title bar; webview content still needs CSS `color-scheme` |

---

## R3: OS Theme Change Listener

### Decision
Use `addEventListener('change', callback)` on `window.matchMedia('(prefers-color-scheme: dark)')`, within a `useEffect` guarded by `theme === "system"`.

### Rationale
- Current code reads `matchMedia().matches` once during `applySettings()` but has no listener — the app doesn't respond to OS dark/light toggles at runtime.
- Modern pattern uses standard `addEventListener('change', ...)` (the deprecated `addListener()` method should not be used).
- The listener re-invokes `applySettings("system", ...)` which re-evaluates the media query.
- Cleanup via `removeEventListener` in the effect's return function. Listener is only active when `theme === "system"`.

### Alternatives Considered
| Approach | Verdict | Why Rejected |
|---|---|---|
| `addListener()` (deprecated) | Rejected | Removed in modern spec |
| Polling `matchMedia().matches` | Rejected | Wasteful and laggy |
| Tauri OS theme event | Considered | Web `matchMedia` is simpler and works in dev mode too |

---

## R4: Unified Command Builder Architecture

### Decision
Single TypeScript function `buildArgs(serial, settings) → string[]` as the sole source of truth. Rust receives and passes through the args array. Delete the Rust `ScrcpyConfig` struct and arg-building logic.

### Rationale
- Currently three separate code paths build scrcpy arguments: `buildCommandPreview` (TS), `buildInvokeConfig` (TS→Rust config object), and `start_scrcpy` (Rust arg reconstruction). They have **critical discrepancies**: camera/virtualDisplay guards exist only in preview; bitrate defaults are handled differently.
- A single `buildArgs()` function encodes all business logic once. Preview calls a display formatter; invoke sends the raw array to Rust.
- Rust `start_scrcpy` simplifies to: accept `(serial: String, args: Vec<String>)`, call `cmd.args(&args)`, manage process lifecycle. ~60 lines instead of ~270.
- `tokio::process::Command` passes each element as a discrete OS-level argument (no shell involved), so no quoting needed for execution.
- For display, a thin quoting helper wraps values containing spaces: `args.map(a => /[\s"'\\$`]/.test(a) ? `"${a}"` : a).join(' ')`.

### Alternatives Considered
| Approach | Verdict | Why Rejected |
|---|---|---|
| Rust as single source of truth | Rejected | Preview would need IPC roundtrip per keystroke (~50ms latency); UX degrades |
| Keep both builders, add guards to invoke | Rejected | Maintains code duplication; drift will recur |

### Discrepancies to Fix
| Flag/Logic | Preview (current) | Invoke→Rust (current) | Unified (target) |
|---|---|---|---|
| Display ID | Guards: not if camera/virtual_display | No guards | Guard: skip if camera/virtual_display |
| Rotation | Guards: not if camera | No guards | Guard: skip if camera |
| Crop | Guards: not if camera | No guards | Guard: skip if camera/virtual_display |
| Bitrate default (8M) | Skipped | Always sent | Skip (matches scrcpy default) |
| Audio bitrate default (128K) | Skipped | Always sent | Skip (matches scrcpy default) |
| Record format | Never sent | Never sent | Send if `recordFormat` set and file extension differs |

---

## R5: Persistent Device Registry

### Decision
Rust-managed JSON file (`devices.json` in Tauri app data dir), with three-way merge on every `list_devices` call. Frontend caches in React state.

### Rationale
- The merge between ADB output and persistent registry should be atomic and authoritative in Rust (the component that calls `adb devices`).
- A single `list_devices` command returns the already-merged list (connected + disconnected) — the frontend stays a dumb renderer.
- `devices.json` lives in `~/.local/share/com.scrcpy-gui.tianananta/` (Tauri app data dir on Linux).
- Direct `serde_json` file I/O in Rust is simpler than adding `tauri-plugin-store` for one file.

### Merge Strategy
| Scenario | Action |
|---|---|
| In ADB output, NOT in registry | New device — add to registry, fetch props |
| In registry, NOT in ADB output | Mark as `"disconnected"` — preserve cached metadata |
| In both | Update status to ADB value; re-fetch props if status is `"device"` |

### ADB Status Mapping
| ADB Status | App Display | Fetch Props? |
|---|---|---|
| `"device"` | Connected | Yes |
| `"offline"` | Offline | No |
| `"unauthorized"` | Unauthorized | No |
| (absent from ADB output) | Disconnected | No |

### "Forget" Action
New `forget_device(serial)` Tauri command removes entry from `devices.json`. Frontend also clears localStorage settings for that serial.

### Alternatives Considered
| Approach | Verdict | Why Rejected |
|---|---|---|
| localStorage only | Rejected | Split-brain risk between Rust ADB output and frontend registry; race conditions |
| `tauri-plugin-store` | Overkill | Only Rust writes; JS reads via commands; one JSON file doesn't need a plugin |
| SQLite | Overkill | Flat list of ~10-50 devices |

---

## R6: Device Auto-Discovery via Polling

### Decision
Phase 1: 3-second `setInterval` polling calling `list_devices`. Phase 2 (future): `adb track-devices` TCP connection.

### Rationale
- A 3-second poll interval satisfies SC-003 ("within 5 seconds") with margin.
- The existing architecture exclusively shells out to the `adb` CLI — introducing raw ADB TCP protocol handling is a significant complexity jump for Phase 1.
- Polling `list_devices` triggers the merge logic (R5), so auto-discovery and persistence are unified.

### Optimization
Only fetch expensive props (model, version, battery) when a device's status changes or on first appearance. Cache in the registry and re-use for known devices.

### Alternatives Considered
| Approach | Verdict | Why Rejected (for Phase 1) |
|---|---|---|
| `adb track-devices` TCP | Phase 2 | Requires ADB wire protocol implementation, persistent connection management, reconnection logic |
| USB event monitoring (udev) | Rejected | Platform-specific; doesn't help with wireless; still needs ADB for serial/status |

---

## R7: Device Identity — USB vs Wireless Serials

### Decision
Treat USB and wireless serials as **separate device entries**. No automatic correlation.

### Rationale
- ADB uses different serials for USB (`abc123`) and wireless (`192.168.1.5:5555`) connections to the same physical device.
- Users may intentionally want different settings for USB vs wireless (e.g., higher bitrate for USB).
- `ro.serialno` (the hardware serial) is sometimes empty or `unknown` on certain devices and requires the device to be connected to query.
- Users can distinguish entries with custom names ("Pixel 7 (USB)", "Pixel 7 (WiFi)").
- The "Forget" action handles stale entries from IP changes or factory resets.

### Alternatives Considered
| Approach | Verdict | Why Rejected |
|---|---|---|
| Auto-correlate via `ro.serialno` | Rejected | Requires both connections active simultaneously; sometimes unavailable; merging settings is destructive |
| User-initiated linking | Deferred | Good idea but adds UI complexity; future enhancement if requested |
