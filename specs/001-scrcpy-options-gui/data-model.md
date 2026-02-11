# Data Model: Complete scrcpy Options GUI

**Feature**: 001-scrcpy-options-gui
**Date**: 2026-02-11

## Entities

### ScrcpyVersion

Parsed version of the installed scrcpy binary, used for feature gating.

| Field | Type | Description |
|-------|------|-------------|
| major | number | Major version (e.g., 3) |
| minor | number | Minor version (e.g., 3) |
| patch | number | Patch version (e.g., 4), defaults to 0 if absent |
| raw | string | Original version string (e.g., "3.3.4") |

**Validation**: major ≥ 1 (scrcpy versions start at 1.x). Feature gating:
- `hasAudio`: major > 2 OR (major == 2 AND minor >= 0)
- `hasCamera`: major > 2 OR (major == 2 AND minor >= 2)
- `hasUhidInput`: major > 2 OR (major == 2 AND minor >= 4)
- `hasGamepad`: major > 2 OR (major == 2 AND minor >= 7)
- `hasVirtualDisplay`: major >= 3
- `hasNoVideo`: major > 2 OR (major == 2 AND minor >= 1)

---

### KeyboardMode (enum)

| Value | CLI Flag | Min Version |
|-------|----------|-------------|
| default | (none) | any |
| sdk | `--keyboard=sdk` | 2.4 |
| uhid | `--keyboard=uhid` | 2.4 |
| aoa | `--keyboard=aoa` | 2.4 |

---

### MouseMode (enum)

| Value | CLI Flag | Min Version |
|-------|----------|-------------|
| default | (none) | any |
| sdk | `--mouse=sdk` | 2.4 |
| uhid | `--mouse=uhid` | 2.4 |
| aoa | `--mouse=aoa` | 2.4 |
| disabled | `--mouse=disabled` | 2.4 |

---

### GamepadMode (enum)

| Value | CLI Flag | Min Version |
|-------|----------|-------------|
| disabled | (none) | any |
| uhid | `--gamepad=uhid` | 2.7 |
| aoa | `--gamepad=aoa` | 2.7 |

---

### VideoSource (enum)

| Value | CLI Flag | Min Version |
|-------|----------|-------------|
| display | (none — default) | any |
| camera | `--video-source=camera` | 2.2 |

---

### CameraFacing (enum)

| Value | CLI Flag |
|-------|----------|
| front | `--camera-facing=front` |
| back | `--camera-facing=back` |
| external | `--camera-facing=external` |

---

### DeviceSettings (extended)

Extends the existing 35-field interface with new fields. Fields marked **NEW** are additions.

| Field | Type | Default | NEW | Description |
|-------|------|---------|-----|-------------|
| name | string | "" | | Device display name |
| bitrate | number | 8000000 | | Video bitrate |
| maxSize | number | 0 | | Max resolution (0 = unlimited) |
| noControl | boolean | false | | Read-only mode |
| turnScreenOff | boolean | false | | Turn device screen off |
| stayAwake | boolean | false | | Keep device awake |
| showTouches | boolean | false | | Show touch indicators |
| recordingEnabled | boolean | false | | Enable recording |
| recordFile | string | "" | | Recording file path |
| recordFormat | "mp4" \| "mkv" | "mp4" | | Recording format |
| audioForwarding | boolean | true | | Enable audio forwarding |
| audioBitrate | number | 128000 | | Audio bitrate |
| microphoneForwarding | boolean | false | | Forward microphone |
| displayId | number | 0 | | Display ID |
| rotation | number | 0 | | Orientation |
| crop | string | "" | | Crop region |
| lockVideoOrientation | number | -1 | | Lock video orientation |
| displayBuffer | number | 0 | | Display buffer (ms) |
| windowX | number | 0 | | Window X position |
| windowY | number | 0 | | Window Y position |
| windowWidth | number | 0 | | Window width |
| windowHeight | number | 0 | | Window height |
| alwaysOnTop | boolean | false | | Always on top |
| windowBorderless | boolean | false | | Borderless window |
| fullscreen | boolean | false | | Fullscreen mode |
| maxFps | number | 0 | | Max FPS |
| videoCodec | string | "h264" | | Video codec |
| videoEncoder | string | "" | | Video encoder |
| videoBuffer | number | 0 | | Video buffer (ms) |
| powerOffOnClose | boolean | false | | Power off on close |
| noPowerOn | boolean | false | | Don't power on |
| audioCodec | string | "opus" | | Audio codec |
| noCleanup | boolean | false | | No cleanup |
| forceAdbForward | boolean | false | | Force ADB forward |
| timeLimit | number | 0 | | Time limit (seconds) |
| keyboardMode | KeyboardMode | "default" | ✅ | Keyboard input mode |
| mouseMode | MouseMode | "default" | ✅ | Mouse input mode |
| gamepadMode | GamepadMode | "disabled" | ✅ | Gamepad forwarding mode |
| videoSource | VideoSource | "display" | ✅ | Video source |
| cameraFacing | CameraFacing | "front" | ✅ | Camera facing |
| cameraSize | string | "" | ✅ | Camera resolution (e.g., "1920x1080") |
| cameraId | string | "" | ✅ | Camera ID (numeric string) |
| v4l2Sink | string | "" | ✅ | V4L2 device path |
| v4l2Buffer | number | 0 | ✅ | V4L2 buffer (ms) |
| noPlayback | boolean | false | ✅ | No playback (for V4L2/virtual) |
| noVideo | boolean | false | ✅ | No video (audio-only) |
| noAudio | boolean | false | ✅ | Explicit no-audio |
| virtualDisplay | boolean | false | ✅ | Enable virtual display |
| virtualDisplayResolution | string | "" | ✅ | Virtual display resolution |
| virtualDisplayDpi | number | 0 | ✅ | Virtual display DPI |
| startApp | string | "" | ✅ | App to start on virtual display |
| otgMode | boolean | false | ✅ | OTG mode |
| windowTitle | string | "" | ✅ | Custom window title |

**Total**: 52 fields (35 existing + 17 new)

**Validation rules**:
- `otgMode` = true → `videoSource` forced to "display", `recordingEnabled` = false, `noVideo` = false, `noAudio` = false (OTG disables all a/v)
- `videoSource` = "camera" → `displayId`, `crop`, `rotation` are ignored
- `v4l2Sink` non-empty → only valid if platform is Linux
- `virtualDisplay` = true → `displayId` is ignored
- `noVideo` = true → `videoCodec`, `videoEncoder`, `maxSize`, `maxFps` are ignored

---

### Preset (extended)

Same as DeviceSettings but with `id: string` and without: `recordingEnabled`, `recordFile`, `recordFormat` (recording is session-specific, not preset-worthy).

**New fields in Preset**: all 17 new DeviceSettings fields are included.

**Migration**: Existing presets loaded from localStorage that lack new fields receive defaults (backward compatible).

---

### ScrcpyConfig (Rust struct)

Typed struct for the `start_scrcpy` Tauri command, replacing 34 individual parameters.

| Field | Rust Type | Maps to CLI |
|-------|-----------|-------------|
| serial | String | `-s` |
| bitrate | Option\<u32\> | `-b` |
| max_size | Option\<u32\> | `--max-size` |
| no_control | bool | `--no-control` |
| turn_screen_off | bool | `--turn-screen-off` |
| stay_awake | bool | `--stay-awake` |
| show_touches | bool | `--show-touches` |
| record | bool | gates `--record` |
| record_file | Option\<String\> | `--record` |
| audio_forwarding | bool | gates audio flags |
| audio_bitrate | Option\<u32\> | `--audio-bit-rate` |
| microphone_forwarding | bool | `--audio-source=mic` |
| display_id | Option\<u32\> | `--display-id` |
| rotation | Option\<u32\> | `--orientation` |
| crop | Option\<String\> | `--crop` |
| lock_video_orientation | Option\<i32\> | `--lock-video-orientation` |
| display_buffer | Option\<u32\> | `--display-buffer` |
| window_x | Option\<u32\> | `--window-x` |
| window_y | Option\<u32\> | `--window-y` |
| window_width | Option\<u32\> | `--window-width` |
| window_height | Option\<u32\> | `--window-height` |
| always_on_top | bool | `--always-on-top` |
| window_borderless | bool | `--window-borderless` |
| fullscreen | bool | `--fullscreen` |
| max_fps | Option\<u32\> | `--max-fps` |
| video_codec | Option\<String\> | `--video-codec` |
| video_encoder | Option\<String\> | `--video-encoder` |
| video_buffer | Option\<u32\> | `--video-buffer` |
| power_off_on_close | bool | `--power-off-on-close` |
| no_power_on | bool | `--no-power-on` |
| audio_codec | Option\<String\> | `--audio-codec` |
| no_cleanup | bool | `--no-cleanup` |
| force_adb_forward | bool | `--force-adb-forward` |
| time_limit | Option\<u32\> | `--time-limit` |
| keyboard_mode | Option\<String\> | `--keyboard` |
| mouse_mode | Option\<String\> | `--mouse` |
| gamepad_mode | Option\<String\> | `--gamepad` |
| video_source | Option\<String\> | `--video-source` |
| camera_facing | Option\<String\> | `--camera-facing` |
| camera_size | Option\<String\> | `--camera-size` |
| camera_id | Option\<String\> | `--camera-id` |
| v4l2_sink | Option\<String\> | `--v4l2-sink` |
| v4l2_buffer | Option\<u32\> | `--v4l2-buffer` |
| no_playback | bool | `--no-playback` |
| no_video | bool | `--no-video` |
| no_audio | bool | `--no-audio` |
| virtual_display | Option\<String\> | `--new-display` |
| start_app | Option\<String\> | `--start-app` |
| otg_mode | bool | `--otg` |
| window_title | Option\<String\> | `--window-title` |

---

### Device (unchanged)

| Field | Type | Description |
|-------|------|-------------|
| serial | string | ADB serial (e.g., "192.168.1.5:5555") |
| status | string | "device", "offline", "unauthorized" |
| model | string? | Device model name |
| android_version | string? | Android version string |
| battery_level | number? | Battery percentage |
| is_wireless | boolean | TCP/IP connection |

---

### LogEntry (unchanged)

| Field | Type | Description |
|-------|------|-------------|
| timestamp | string | ISO timestamp |
| level | "info" \| "error" \| "warn" \| "success" \| "debug" | Log severity |
| message | string | Log message text |

**New source**: scrcpy stderr lines (via Tauri events) are converted to LogEntry with level "error" or "info" based on content.

## State Transitions

### OTG Mode Toggle
```
otgMode: false → true
  → noVideo: forced false (N/A in OTG)
  → noAudio: forced false (N/A in OTG)
  → recordingEnabled: forced false
  → videoSource: forced "display"
  → UI: disable all a/v/recording/camera sections
```

### Video Source Change
```
videoSource: "display" → "camera"
  → displayId: ignored (greyed)
  → crop: ignored (greyed)
  → rotation: ignored (greyed)
  → UI: show camera facing, camera size, camera ID fields
```

### Virtual Display Toggle
```
virtualDisplay: false → true
  → displayId: ignored (greyed)
  → UI: show resolution, DPI, start app fields
```
