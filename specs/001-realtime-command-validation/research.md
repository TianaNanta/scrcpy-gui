# Research: Scrcpy Command Validation & Flag Conflicts

**Date**: February 14, 2026
**Researcher**: AI Assistant
**Purpose**: Gather comprehensive data on scrcpy command-line options, validation rules, and conflicts to implement real-time validation in React GUI.

## Decision

Implement a comprehensive validation system in the React-based GUI that categorizes all scrcpy command-line options by type (boolean, string, number, enum), enforces validation rules including ranges, formats, and dependencies, detects known flag conflicts and incompatible combinations, and provides real-time feedback with error messages and warnings. The system will use a centralized configuration object derived from official scrcpy documentation and source analysis, with version-aware validation based on detected Android API levels.

## Rationale

This approach ensures the GUI prevents invalid commands that could cause scrcpy to fail or behave unexpectedly, improving user experience by providing immediate feedback. By basing validation on official sources (help output, documentation, and GitHub issues), it maintains accuracy and completeness. Categorizing options by type allows for type-specific validation logic (e.g., number ranges, enum values), while conflict detection prevents combinations that are mutually exclusive or API-dependent. Real-time feedback in the GUI aligns with the user's request for preventing invalid commands and showing feedback, and version awareness handles differences across Android versions without requiring user manual checks.

## Alternatives Considered

- Manual validation per component: Rejected because it would lead to inconsistent rules and maintenance overhead across multiple React components.
- Server-side validation only: Rejected as it delays feedback until command execution, missing the "real-time" requirement.
- Static configuration without version awareness: Rejected because it couldn't handle API-level dependencies (e.g., camera options on Android <12), leading to false positives/negatives.
- Crowdsourced validation from forums: Rejected in favor of official documentation to ensure reliability and avoid outdated or incorrect information.

## Detailed Research Findings

### 1. All Available Command-Line Flags/Options with Types

Based on `scrcpy --help` output (v3.3.4) and documentation pages (video.md, audio.md, camera.md, etc.), here is a complete categorized list of options. Options are grouped by category for clarity. Types are inferred from descriptions: **boolean** (no argument, flag-only), **string** (free-form text), **number** (integer/float with units), **enum** (fixed set of values), **array** (comma-separated or repeated), **special** (complex formats like dimensions or ranges).

#### Connection & Device Selection
- `--select-usb` / `-d`: **boolean** - Use USB device (if exactly one connected).
- `--select-tcpip` / `-e`: **boolean** - Use TCP/IP device (if exactly one connected).
- `--serial` / `-s`: **string** - Device serial number (mandatory if multiple devices).
- `--tcpip[=[+]ip[:port]]`: **string** - Configure TCP/IP connection (e.g., "192.168.1.1:5555" or "+192.168.1.1" for reconnection).
- `--tunnel-host`: **string** - IP for adb tunnel (default: localhost).
- `--tunnel-port`: **number** - TCP port for adb tunnel (default: 0, auto).
- `--force-adb-forward`: **boolean** - Avoid adb reverse tunneling.

#### Video Options
- `--video-source`: **enum** - "display" (default) or "camera".
- `--max-size` / `-m`: **number** - Max width/height (0 = unlimited, preserves aspect ratio).
- `--video-bit-rate` / `-b`: **number** - Bit rate (supports K/M suffixes, e.g., "8M").
- `--max-fps`: **number** - Frame rate limit.
- `--video-codec`: **enum** - "h264" (default), "h265", "av1".
- `--video-encoder`: **string** - Specific MediaCodec encoder name.
- `--video-codec-options`: **array** - Key:type=value pairs (e.g., "key:int=1,key2:string=val").
- `--crop`: **string** - Width:height:x:y (device natural orientation).
- `--capture-orientation`: **enum** - 0, 90, 180, 270, flip0, flip90, flip180, flip270, or prefixed with "@" for locking.
- `--display-orientation`: **enum** - Same as capture-orientation.
- `--record-orientation`: **enum** - 0, 90, 180, 270 (no flips for recording).
- `--orientation`: **enum** - Sets both display and record orientation.
- `--angle`: **number** - Custom rotation angle (degrees, clockwise).
- `--display-id`: **number** - Display ID to mirror (default: 0).
- `--new-display[=[width]x[height][/dpi]]`: **string** - Create virtual display (e.g., "1920x1080/420").
- `--video-buffer`: **number** - Buffering delay in ms (default: 0).
- `--no-video`: **boolean** - Disable video forwarding.
- `--no-video-playback`: **boolean** - Disable video playback on computer.
- `--no-downsize-on-error`: **boolean** - Prevent automatic resolution reduction on codec error.
- `--no-mipmaps`: **boolean** - Disable mipmaps for OpenGL rendering.

#### Audio Options
- `--audio-source`: **enum** - "output" (default), "playback", "mic", "mic-unprocessed", "mic-camcorder", "mic-voice-recognition", "mic-voice-communication", "voice-call", "voice-call-uplink", "voice-call-downlink", "voice-performance".
- `--audio-bit-rate`: **number** - Bit rate (supports K/M, default: 128K).
- `--audio-codec`: **enum** - "opus" (default), "aac", "flac", "raw".
- `--audio-encoder`: **string** - Specific MediaCodec encoder name.
- `--audio-codec-options`: **array** - Key:type=value pairs.
- `--audio-buffer`: **number** - Buffering delay in ms (default: 50).
- `--audio-output-buffer`: **number** - SDL output buffer in ms (default: 5).
- `--audio-dup`: **boolean** - Duplicate audio (requires --audio-source=playback).
- `--no-audio`: **boolean** - Disable audio forwarding.
- `--no-audio-playback`: **boolean** - Disable audio playback on computer.
- `--require-audio`: **boolean** - Fail if audio capture fails.

#### Camera Options (Video-Source=Camera Only)
- `--camera-id`: **number** - Camera ID.
- `--camera-facing`: **enum** - "front", "back", "external".
- `--camera-size`: **string** - WidthxHeight (e.g., "1920x1080").
- `--camera-ar`: **string** - Aspect ratio ("num:den", "value", or "sensor").
- `--camera-fps`: **number** - Frame rate (default: 30).
- `--camera-high-speed`: **boolean** - Enable high-speed mode.

#### Control & Input Options
- `--no-control`: **boolean** - Disable device control.
- `--keyboard`: **enum** - "disabled", "sdk", "uhid", "aoa".
- `--mouse`: **enum** - "disabled", "sdk", "uhid", "aoa".
- `--gamepad`: **enum** - "disabled", "uhid", "aoa".
- `-K`: **boolean** - Shortcut for --keyboard=uhid (or aoa if --otg).
- `-M`: **boolean** - Shortcut for --mouse=uhid (or aoa if --otg).
- `-G`: **boolean** - Shortcut for --gamepad=uhid (or aoa if --otg).
- `--mouse-bind`: **string** - xxxx[:xxxx] for secondary click bindings.
- `--prefer-text`: **boolean** - Inject text instead of key events.
- `--raw-key-events`: **boolean** - Inject all key events without text.
- `--no-key-repeat`: **boolean** - Disable repeated key events.
- `--no-mouse-hover`: **boolean** - Disable mouse hover events.
- `--legacy-paste`: **boolean** - Use Ctrl+V for clipboard paste.
- `--no-clipboard-autosync`: **boolean** - Disable automatic clipboard sync.

#### Window & Display Options
- `--fullscreen` / `-f`: **boolean** - Start in fullscreen.
- `--always-on-top`: **boolean** - Keep window on top.
- `--window-title`: **string** - Custom window title.
- `--window-x`: **string/number** - Initial X position ("auto" or number).
- `--window-y`: **string/number** - Initial Y position ("auto" or number).
- `--window-width`: **number** - Initial width (0 = auto).
- `--window-height`: **number** - Initial height (0 = auto).
- `--window-borderless`: **boolean** - Disable window decorations.
- `--display-ime-policy`: **enum** - "local", "fallback", "hide".
- `--no-window`: **boolean** - Disable scrcpy window (implies --no-video-playback).

#### Recording & Output Options
- `--record` / `-r`: **string** - Record to file (format by extension or --record-format).
- `--record-format`: **enum** - "mp4", "mkv", "m4a", "mka", "opus", "aac", "flac", "wav".
- `--v4l2-sink`: **string** - Output to V4L2 device (Linux, e.g., "/dev/video2").
- `--v4l2-buffer`: **number** - Buffering for V4L2 in ms (default: 0).
- `--push-target`: **string** - Target directory for drag & drop (default: "/sdcard/Download/").

#### Device Behavior Options
- `--stay-awake` / `-w`: **boolean** - Keep device awake while plugged in.
- `--turn-screen-off` / `-S`: **boolean** - Turn screen off immediately.
- `--power-off-on-close`: **boolean** - Turn screen off on exit.
- `--screen-off-timeout`: **number** - Screen off timeout in seconds.
- `--show-touches` / `-t`: **boolean** - Enable "show touches".
- `--no-power-on`: **boolean** - Don't power on device on start.
- `--time-limit`: **number** - Max mirroring time in seconds.

#### OTG & Special Modes
- `--otg`: **boolean** - Run in OTG mode (USB-only, no USB debugging required).
- `--start-app`: **string** - Start app by package name (prefix with ? for search, + for force-stop).

#### Miscellaneous Options
- `--port` / `-p`: **string** - TCP port range (e.g., "27183:27199").
- `--verbosity` / `-V`: **enum** - "verbose", "debug", "info", "warn", "error".
- `--print-fps`: **boolean** - Print FPS logs.
- `--pause-on-exit`: **enum** - "true", "false", "if-error".
- `--kill-adb-on-close`: **boolean** - Kill adb on exit.
- `--no-cleanup`: **boolean** - Skip cleanup on exit.
- `--disable-screensaver`: **boolean** - Disable screensaver.
- `--render-driver`: **enum** - SDL render driver hint ("direct3d", "opengl", etc.).
- `--shortcut-mod`: **array** - Modifiers for shortcuts (e.g., "lctrl,lsuper").
- `--help` / `-h`: **boolean** - Show help.
- `--version` / `-v`: **boolean** - Show version.
- `--list-apps`: **boolean** - List installed apps.
- `--list-cameras`: **boolean** - List cameras.
- `--list-camera-sizes`: **boolean** - List camera sizes.
- `--list-displays`: **boolean** - List displays.
- `--list-encoders`: **boolean** - List encoders.

### 2. Validation Rules for Each Option

Validation rules are derived from descriptions, defaults, and constraints in documentation. Rules include allowed ranges, formats, and dependencies.

- **Numbers**:
  - `--max-size`: >= 0 (0 = unlimited).
  - `--video-bit-rate`: > 0, supports suffixes (K=1000, M=1000000).
  - `--max-fps`: > 0 (Android 10+ officially, may work on older).
  - `--audio-bit-rate`: > 0, default 128000, supports suffixes.
  - `--audio-buffer`: >= 0, default 50 (lower = less latency but more glitches).
  - `--audio-output-buffer`: >= 0, default 5 (only adjust if robotic sound).
  - `--video-buffer`: >= 0, default 0.
  - `--v4l2-buffer`: >= 0, default 0.
  - `--angle`: Any float (degrees).
  - `--camera-fps`: > 0, default 30.
  - `--display-id`: >= 0, default 0.
  - `--screen-off-timeout`: > 0.
  - `--time-limit`: > 0.
  - `--port`: Range like "min:max", min/max 1-65535.
  - `--window-x/y/width/height`: >= 0 or "auto".

- **Strings**:
  - `--serial`: Non-empty, valid adb serial.
  - `--tcpip`: IP[:port] format, port 1-65535, optional + prefix.
  - `--tunnel-host`: Valid IP or hostname.
  - `--tunnel-port`: 1-65535.
  - `--video-encoder/audio-encoder`: Non-empty, from --list-encoders.
  - `--crop`: width:height:x:y, all >= 0.
  - `--camera-size`: widthxheight, width/height > 0.
  - `--camera-ar`: num:den (ratios > 0), value (float > 0), or "sensor".
  - `--new-display`: [width]x[height][/dpi], all > 0.
  - `--window-title`: Non-empty.
  - `--record`: Valid file path.
  - `--v4l2-sink`: Valid /dev/videoN path (Linux).
  - `--push-target`: Valid adb push path.
  - `--start-app`: Package name, optional ? or + prefix.
  - `--mouse-bind`: 4 chars per sequence, chars: + - b h s n.

- **Enums**:
  - `--video-source`: "display", "camera".
  - `--video-codec`: "h264", "h265", "av1".
  - `--audio-codec`: "opus", "aac", "flac", "raw".
  - `--audio-source`: As listed.
  - `--capture-orientation/display-orientation/record-orientation/orientation`: 0,90,180,270,flip0,flip90,flip180,flip270, optional @ prefix.
  - `--camera-facing`: "front", "back", "external".
  - `--keyboard/mouse/gamepad`: "disabled", "sdk", "uhid", "aoa".
  - `--display-ime-policy`: "local", "fallback", "hide".
  - `--record-format`: As listed.
  - `--verbosity`: As listed.
  - `--pause-on-exit`: "true", "false", "if-error".
  - `--render-driver`: As listed.
  - `--shortcut-mod`: Comma-separated from "lctrl","rctrl","lalt","ralt","lsuper","rsuper".

- **Arrays**:
  - `--video-codec-options/audio-codec-options`: key[:type]=value, type: int/long/float/string.
  - `--shortcut-mod`: As above.

- **Booleans**: No validation beyond presence.

- **Dependencies**:
  - Camera options require `--video-source=camera`.
  - `--audio-dup` requires `--audio-source=playback`.
  - `--camera-high-speed` requires specific sizes/fps from --list-camera-sizes.
  - `--new-display` creates a virtual display; control may be limited on Android <10.
  - `--otg` disables mirroring, requires USB.
  - `--no-video` makes video options irrelevant.
  - `--no-control` makes input options irrelevant.
  - `--record` implies video/audio capture.

### 3. Known Flag Conflicts and Incompatible Combinations

From documentation and help output, these are mutually exclusive or conflicting:
- `--camera-id` and `--camera-facing`: Cannot specify both (id determines facing).
- `--camera-size` and (`--max-size` or `--camera-ar`): Explicit size overrides constraints.
- `--otg` and `--tcpip`: OTG is USB-only, TCP/IP is network.
- `--video-source=camera` and `--display-id` > 0: Camera doesn't use display IDs.
- `--no-video` and video-related options (e.g., `--video-codec`, `--crop`): Video disabled.
- `--no-control` and control options (e.g., `--keyboard`, `--mouse`): Control disabled.
- `--new-display` and `--otg`: Virtual displays may not work in OTG mode.
- `--turn-screen-off` and `--show-touches`: Touches can't be shown on off screen.
- `--audio-source=playback` without `--audio-dup`: Audio not played on device.
- `--require-audio` and `--no-audio`: Contradictory.
- `--pause-on-exit=true` and background processes: May interfere.
- `--force-adb-forward` and `--tcpip`: Forwarding not needed for TCP/IP.
- `--raw-key-events` and `--prefer-text`: Conflicting input modes.
- `--legacy-paste` and modern clipboard: Overrides standard behavior.
- `--camera-high-speed` and arbitrary `--camera-fps`/`--camera-size`: Restricted to specific combos.

No major issues found in GitHub searches, but source code likely enforces these programmatically.

### 4. Version-Specific Differences

- **Android 5.0 (API 21)+**: Minimum for scrcpy.
- **Android 10 (API 29)+**: Official support for `--max-fps`; secondary display control.
- **Android 11 (API 30)+**: Audio forwarding (12+ out-of-the-box, 11 requires unlock).
- **Android 12 (API 31)+**: Camera mirroring (`--video-source=camera`).
- **Android 13 (API 33)+**: `--audio-source=playback` with `--audio-dup`.
- **General**: Older versions may support options unofficially (e.g., `--max-fps` on <10), but with reduced reliability. H265/AV1 encoders rare on older devices. OTG requires kernel support (Linux UHID/AOA).

This research provides a solid foundation for GUI validation. Implement as a TypeScript module with option metadata, conflict matrices, and API-level checks. Test against scrcpy versions for edge cases.