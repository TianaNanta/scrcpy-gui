# Tauri Command Contracts: Complete scrcpy Options GUI

**Feature**: 001-scrcpy-options-gui
**Date**: 2026-02-11

These contracts define the Tauri IPC boundary — the typed interface between
the React frontend (`invoke()`) and Rust backend (`#[tauri::command]`).

## Existing Commands (unchanged signatures)

### `check_dependencies`
```
Input: (none)
Output: { adb: boolean, scrcpy: boolean }
```

### `list_devices`
```
Input: (none)
Output: Device[]
  Device: { serial: string, status: string, model?: string,
            android_version?: string, battery_level?: number,
            is_wireless: boolean }
```

### `stop_scrcpy`
```
Input: { serial: string }
Output: string (success message)
Error: string (if process not found)
```

### `select_save_file`
```
Input: (none)
Output: string | null (file path or null if cancelled)
```

### `connect_wireless_device`
```
Input: { ip: string, port: string }
Output: string (success message)
Error: string
```

### `disconnect_wireless_device`
```
Input: { ip: string, port: string }
Output: string (success message)
Error: string
```

### `get_device_health`
```
Input: { serial: string }
Output: { battery_level?: number }
```

### `test_device`
```
Input: { serial: string }
Output: boolean
```

---

## Modified Commands

### `start_scrcpy` (BREAKING CHANGE — parameter restructuring)

**Before**: 34 individual parameters
**After**: Single typed `ScrcpyConfig` struct

```
Input: {
  // Device
  serial: string,

  // Video
  bitrate?: number,                  // -b (default: omit → scrcpy default 8M)
  maxSize?: number,                  // --max-size (0 = omit)
  maxFps?: number,                   // --max-fps (0 = omit)
  videoCodec?: string,               // --video-codec (omit if "h264")
  videoEncoder?: string,             // --video-encoder (omit if empty)
  videoBuffer?: number,              // --video-buffer (0 = omit)

  // Video Source
  videoSource?: string,              // --video-source (omit if "display")
  cameraFacing?: string,             // --camera-facing (only if videoSource=camera)
  cameraSize?: string,               // --camera-size (only if videoSource=camera)
  cameraId?: string,                 // --camera-id (only if videoSource=camera)

  // Audio
  noAudio: boolean,                  // --no-audio
  audioForwarding: boolean,          // gates audio-related flags
  audioBitrate?: number,             // --audio-bit-rate (0 = omit)
  audioCodec?: string,               // --audio-codec (omit if "opus")
  microphoneForwarding: boolean,     // --audio-source=mic

  // Video toggles
  noVideo: boolean,                  // --no-video
  noPlayback: boolean,               // --no-playback

  // Display
  displayId?: number,                // --display-id (0 = omit)
  rotation?: number,                 // --orientation (0 = omit)
  crop?: string,                     // --crop (empty = omit)
  lockVideoOrientation?: number,     // --lock-video-orientation (-1 = omit)
  displayBuffer?: number,            // --display-buffer (0 = omit)

  // Window
  windowX?: number,                  // --window-x (0 = omit)
  windowY?: number,                  // --window-y (0 = omit)
  windowWidth?: number,              // --window-width (0 = omit)
  windowHeight?: number,             // --window-height (0 = omit)
  alwaysOnTop: boolean,              // --always-on-top
  windowBorderless: boolean,         // --window-borderless
  fullscreen: boolean,               // --fullscreen
  windowTitle?: string,              // --window-title (NEW, empty = omit)

  // Behavior
  noControl: boolean,                // --no-control
  turnScreenOff: boolean,            // --turn-screen-off
  stayAwake: boolean,                // --stay-awake
  showTouches: boolean,              // --show-touches
  powerOffOnClose: boolean,          // --power-off-on-close
  noPowerOn: boolean,                // --no-power-on

  // Recording
  record: boolean,                   // gates --record
  recordFile?: string,               // --record <file>

  // Input Modes (NEW)
  keyboardMode?: string,             // --keyboard=<mode> (omit if "default")
  mouseMode?: string,                // --mouse=<mode> (omit if "default")
  gamepadMode?: string,              // --gamepad=<mode> (omit if "disabled")

  // V4L2 (NEW, Linux only)
  v4l2Sink?: string,                 // --v4l2-sink=<path> (empty = omit)
  v4l2Buffer?: number,               // --v4l2-buffer (0 = omit)

  // Virtual Display (NEW)
  virtualDisplay?: string,           // --new-display=<WxH> (empty = omit)
  startApp?: string,                 // --start-app=<package> (empty = omit)

  // OTG (NEW)
  otgMode: boolean,                  // --otg

  // Network
  noCleanup: boolean,                // --no-cleanup
  forceAdbForward: boolean,          // --force-adb-forward
  timeLimit?: number,                // --time-limit (0 = omit)
}

Output: string (success message with serial)
Error: string (spawn failure message)

Side Effects:
  - Spawns scrcpy process stored in SCRCPY_PROCESSES HashMap
  - Spawns tokio task reading stderr → emits "scrcpy-log" events
```

---

## New Commands

### `get_scrcpy_version`

Returns the parsed version of the installed scrcpy binary.

```
Input: (none)
Output: { major: number, minor: number, patch: number, raw: string }
Error: string (if scrcpy not found or version unparseable)

Implementation:
  - Run `scrcpy --version`
  - Parse first line: "scrcpy X.Y.Z <url>"
  - Split by whitespace, take index 1, split by "."
```

### `get_platform`

Returns the current operating system.

```
Input: (none)
Output: string ("linux" | "macos" | "windows")

Implementation:
  - Return std::env::consts::OS
```

### `list_v4l2_devices`

Lists available V4L2 video devices. Linux only.

```
Input: (none)
Output: string[] (e.g., ["/dev/video0", "/dev/video1", "/dev/video2"])

Implementation:
  - #[cfg(target_os = "linux")]: Read /dev/video* entries
  - #[cfg(not(target_os = "linux"))]: Return empty vec
```

---

## New Events

### `scrcpy-log`

Emitted by the `start_scrcpy` command when scrcpy writes to stderr.

```
Payload: { serial: string, line: string }
Direction: Backend → Frontend
Frequency: Per-line, as scrcpy produces output
```

Frontend listener:
```typescript
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen<{ serial: string; line: string }>(
  'scrcpy-log',
  (event) => {
    addLog({
      timestamp: new Date().toISOString(),
      level: event.payload.line.toLowerCase().includes('error') ? 'error' : 'info',
      message: `[${event.payload.serial}] ${event.payload.line}`,
    });
  }
);
```

---

## Removed Commands

### `greet`

Unused Tauri scaffolding placeholder. Remove from `lib.rs` and command registration.
