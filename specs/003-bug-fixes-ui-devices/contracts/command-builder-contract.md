# Command Builder Contract: Control-Disabled Flag Suppression

**Feature**: `003-bug-fixes-ui-devices` (Session 2) | **Date**: 2026-02-11

## Overview

Documents the behavioral contract for `buildArgs()` when device control is disabled.

---

## `buildArgs()` — Control-Disabled Suppression

### Contract

When device control is disabled — either implicitly by `videoSource === "camera"` or explicitly by `noControl === true` — the following 5 flags MUST be omitted from the returned args array, regardless of their toggle state in DeviceSettings:

| Settings Field | CLI Flag | Suppressed When |
|---|---|---|
| `turnScreenOff` | `--turn-screen-off` | `controlDisabled` |
| `stayAwake` | `--stay-awake` | `controlDisabled` |
| `showTouches` | `--show-touches` | `controlDisabled` |
| `powerOffOnClose` | `--power-off-on-close` | `controlDisabled` |
| `startApp` (in virtual display) | `--start-app=<value>` | `controlDisabled` |

Where: `controlDisabled = settings.videoSource === "camera" || settings.noControl`

### NOT Suppressed

| Settings Field | CLI Flag | Why Not Suppressed |
|---|---|---|
| `noPowerOn` | `--no-power-on` | Not control-dependent in scrcpy source |
| `noControl` | `--no-control` | The flag itself — still emitted when user sets it explicitly |

### Existing Suppression Rules (unchanged)

| Flag | Suppressed When |
|---|---|
| `--display-id` | `videoSource === "camera"` OR `virtualDisplay` |
| `--crop` | `videoSource === "camera"` OR `virtualDisplay` |
| `--orientation` | `videoSource === "camera"` |

### Example

**Input:**
```typescript
settings = {
  videoSource: "camera",
  cameraFacing: "back",
  noAudio: true,
  alwaysOnTop: true,
  turnScreenOff: true,    // ← would error in scrcpy
  showTouches: true,      // ← would error in scrcpy
  powerOffOnClose: true,  // ← would error in scrcpy
  noPowerOn: true,        // ← safe, NOT suppressed
  recordingEnabled: true,
  recordFile: "/home/user/video.mp4",
  // ... other defaults
}
```

**Expected output:**
```
["-s", "91c6483d", "--video-source=camera", "--camera-facing=back",
 "--no-audio", "--always-on-top", "--no-power-on",
 "--record", "/home/user/video.mp4"]
```

Note: `--turn-screen-off`, `--show-touches`, `--power-off-on-close` are suppressed. `--no-power-on` is preserved.

---

## BehaviorPanel — UI Hint Contract

### When to Show

A `version-warning` banner appears at the top of the BehaviorPanel content when:
- `settings.videoSource === "camera"`, OR
- `settings.noControl === true`

### Message Content

| Trigger | Message |
|---|---|
| Camera mode | "Camera mode disables device control — some behavior options will be skipped." |
| Explicit no-control | "Read-only mode — some behavior options will be skipped." |

### Toggle Behavior

- Toggle states (checked/unchecked) MUST NOT change when the banner appears
- Toggle visual state MUST remain interactive (not disabled)
- User's toggle selections are preserved and re-applied when control is re-enabled

### CSS

Reuses existing `.version-warning` class — no new CSS rules required.
