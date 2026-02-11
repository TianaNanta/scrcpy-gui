# Feature Specification: Complete scrcpy Options GUI

**Feature Branch**: `001-scrcpy-options-gui`  
**Created**: 2026-02-11  
**Status**: Draft  
**Input**: User description: "Update this app to help users use scrcpy without the hassle of remembering command-line options"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Input Mode Selection (Priority: P1)

A user connects an Android device and wants to control it using their computer's physical keyboard and mouse for a more natural experience (e.g., gaming, text editing). They open the device settings, go to an "Input & Control" section, choose "Physical keyboard (UHID)" from a dropdown, and optionally pick a mouse mode. When they click "Start Scrcpy," the session uses the selected input modes without the user ever typing `--keyboard=uhid` or `--mouse=uhid`.

**Why this priority**: Keyboard and mouse mode selection is one of the most commonly needed scrcpy options and has no reasonable GUI default — users must currently know the CLI flags. It directly addresses the core goal of eliminating command-line memorization.

**Independent Test**: Can be fully tested by selecting a keyboard mode, starting a scrcpy session, and verifying the generated command includes the correct `--keyboard` and `--mouse` flags.

**Acceptance Scenarios**:

1. **Given** a connected device and the device settings panel open, **When** the user selects "Physical keyboard (UHID)" from the keyboard mode dropdown, **Then** the generated command preview shows `--keyboard=uhid`.
2. **Given** a connected device with "Physical mouse (UHID)" selected, **When** the user clicks "Start Scrcpy," **Then** scrcpy launches with `--mouse=uhid` and the mouse works as a physical input on the device.
3. **Given** a connected device with default input settings, **When** the user does not change keyboard or mouse modes, **Then** scrcpy launches without `--keyboard` or `--mouse` flags (using scrcpy defaults).

---

### User Story 2 — Audio Forwarding Controls (Priority: P1)

A user wants to hear their Android device audio on their computer while mirroring. They open device settings, toggle "Audio Forwarding" on, optionally select an audio codec and adjust the bitrate. When they start the session, audio streams alongside video. If the user has an older device (below Android 11), the toggle is disabled with a tooltip explaining the requirement.

**Why this priority**: Audio forwarding is a headline scrcpy feature (v2.0+), and the current GUI has backend support but no visible controls in the device settings modal. Exposing it is high-value with minimal effort.

**Independent Test**: Can be fully tested by toggling audio forwarding on, starting scrcpy, and verifying audio streams through. Tested independently of input modes.

**Acceptance Scenarios**:

1. **Given** a device running Android 11+ and device settings open, **When** the user enables "Audio Forwarding," **Then** the generated command does not include `--no-audio` and includes the selected audio codec.
2. **Given** audio forwarding enabled and audio bitrate set to 192k, **When** the user starts scrcpy, **Then** the command includes `--audio-bit-rate=192K`.
3. **Given** a device running Android 10 or below, **When** the user views the audio forwarding toggle, **Then** the toggle is disabled and a tooltip reads "Audio forwarding requires Android 11 or higher."
4. **Given** audio forwarding is disabled, **When** the user starts scrcpy, **Then** the command includes `--no-audio`.

---

### User Story 3 — Camera Mirroring (Priority: P2)

A user wants to mirror their phone's camera feed to their computer — for example, to use it as a webcam in video calls or to preview camera output on a larger screen. They open device settings, switch "Video Source" from "Display" to "Camera," optionally select the facing (front/back) and camera resolution, and start the session. The GUI generates the correct `--video-source=camera` flags.

**Why this priority**: Camera mirroring is a major scrcpy feature (Android 12+) not currently exposed in the GUI. It enables webcam and streaming use cases that are completely inaccessible without CLI knowledge.

**Independent Test**: Can be tested by selecting camera as video source, choosing camera facing, and verifying the generated command and session.

**Acceptance Scenarios**:

1. **Given** a device running Android 12+ and device settings open, **When** the user selects "Camera" as video source, **Then** the command preview shows `--video-source=camera`.
2. **Given** camera source selected, **When** the user picks "Front" facing and sets camera size to "1920x1080," **Then** the command includes `--camera-facing=front --camera-size=1920x1080`.
3. **Given** a device below Android 12, **When** the user views the video source dropdown, **Then** the "Camera" option is disabled with a tooltip "Camera mirroring requires Android 12+."

---

### User Story 4 — V4L2 Virtual Webcam (Priority: P2)

A Linux user wants to expose their phone's screen or camera feed as a virtual webcam device so they can select it in video conferencing apps (Zoom, Meet, etc.). They open device settings, enable "V4L2 Sink," select a video device path (e.g., `/dev/video2`), optionally check "No Playback" (to avoid opening a scrcpy window), and start the session.

**Why this priority**: This is a Linux-exclusive high-value feature that turns the phone into a webcam. It requires multiple coordinated CLI flags (`--v4l2-sink`, `--v4l2-buffer`, `--no-playback`) that are difficult to remember.

**Independent Test**: Can be tested on Linux by enabling V4L2 sink, selecting a device path, and verifying the generated command includes the correct flags.

**Acceptance Scenarios**:

1. **Given** a Linux machine and device settings open, **When** the user enables "V4L2 Sink" and enters `/dev/video2`, **Then** the command preview shows `--v4l2-sink=/dev/video2`.
2. **Given** V4L2 sink enabled with "No Playback" checked, **When** the user starts scrcpy, **Then** the command includes `--v4l2-sink=/dev/video2 --no-playback` and no scrcpy window opens.
3. **Given** a non-Linux platform, **When** the user views device settings, **Then** the V4L2 section is not shown.

---

### User Story 5 — Virtual Display (Priority: P3)

A user wants to open apps on a separate virtual display that doesn't affect the phone's physical screen — for example, running a second app alongside mirroring. They open device settings, enable "Virtual Display," specify the resolution (e.g., 1920x1080), and optionally set an app to launch on that display. The user's physical phone screen remains untouched.

**Why this priority**: Virtual display is a powerful advanced feature but serves a narrower audience. It depends on understanding of display concepts, so it's lower priority than basic input/audio/camera needs.

**Independent Test**: Can be tested by enabling virtual display with a resolution, starting scrcpy, and verifying a virtual display is created on the device.

**Acceptance Scenarios**:

1. **Given** device settings open, **When** the user enables "Virtual Display" and sets resolution to "1920x1080," **Then** the command preview shows `--new-display=1920x1080`.
2. **Given** virtual display enabled with start app set to "org.videolan.vlc," **When** the user starts scrcpy, **Then** the command includes `--new-display=1920x1080 --start-app=org.videolan.vlc`.
3. **Given** virtual display is disabled, **When** the user starts scrcpy, **Then** no `--new-display` or `--start-app` flags are included.

---

### User Story 6 — OTG Mode (Priority: P3)

A user wants to use their phone as a game controller or input device without mirroring the screen at all. They select OTG mode from a top-level mode selector. The GUI starts scrcpy with `--otg`, and the user can use gamepad and keyboard input without video/audio overhead.

**Why this priority**: OTG is a niche but completely CLI-dependent feature. Without the GUI, users have no way to discover or use it.

**Independent Test**: Can be tested by selecting OTG mode, starting scrcpy, and verifying no video window opens while input is forwarded.

**Acceptance Scenarios**:

1. **Given** a connected USB device and "OTG" selected as connection mode, **When** the user starts scrcpy, **Then** the command includes `--otg` and no video window opens.
2. **Given** a wirelessly connected device, **When** the user attempts to select OTG mode, **Then** OTG mode is disabled with a tooltip "OTG requires a USB connection."

---

### User Story 7 — Gamepad Forwarding (Priority: P3)

A user plugs a gamepad into their computer and wants to use it to control games on their Android device. They open device settings, enable "Gamepad Forwarding" and select the mode (UHID or AOA). When they start scrcpy, gamepad input is forwarded to the device.

**Why this priority**: Gamepad support is valuable for gamers but is a specialized use case. It depends on the input mode infrastructure from US1.

**Independent Test**: Can be tested by enabling gamepad forwarding, starting scrcpy with a connected gamepad, and verifying the command includes `--gamepad=uhid`.

**Acceptance Scenarios**:

1. **Given** device settings open, **When** the user enables gamepad forwarding with UHID mode, **Then** the command preview shows `--gamepad=uhid`.
2. **Given** gamepad forwarding disabled, **When** the user starts scrcpy, **Then** no `--gamepad` flag is included.

---

### Edge Cases

- What happens when the user selects camera mode on a device with no cameras? The GUI should display an error from scrcpy's output and suggest switching back to display mode.
- What happens when the selected V4L2 device path doesn't exist? The GUI should validate the path exists before launching and show an actionable error message.
- What happens when conflicting options are selected (e.g., OTG mode + recording)? The GUI should disable incompatible options and show a tooltip explaining why.
- What happens when scrcpy fails to start after the process is spawned? The GUI should capture stderr output and display the error in the logs tab with an actionable message.
- What happens when audio forwarding is enabled but scrcpy version doesn't support it? The GUI should detect the scrcpy version at startup and disable unsupported features.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a keyboard input mode selector with options: Default, SDK (software), UHID (physical), AOA (physical).
- **FR-002**: System MUST provide a mouse input mode selector with options: Default, SDK, UHID, AOA, Disabled.
- **FR-003**: System MUST provide a visible audio forwarding toggle in the device settings panel with codec and bitrate controls.
- **FR-004**: System MUST provide a "No Audio" explicit toggle that adds `--no-audio` when disabled.
- **FR-005**: System MUST provide a video source selector (Display or Camera) with camera-specific options: facing (front/back/external), camera size, and camera ID.
- **FR-006**: System MUST provide a V4L2 sink section (Linux only) with device path input, buffer size, and a "No Playback" toggle.
- **FR-007**: System MUST provide a virtual display section with resolution input and an optional "Start App" package name field.
- **FR-008**: System MUST provide an OTG mode toggle that disables incompatible options (recording, display settings, audio).
- **FR-009**: System MUST provide a gamepad forwarding selector with UHID and AOA mode options.
- **FR-010**: System MUST provide a `--window-title` text input so users can name scrcpy windows when mirroring multiple devices.
- **FR-011**: System MUST provide a "No Video" toggle for audio-only streaming scenarios.
- **FR-012**: System MUST capture scrcpy process stderr and display errors in the Logs tab with actionable messages.
- **FR-013**: System MUST disable or hide options that are incompatible with the current configuration (e.g., camera options when video source is "Display," V4L2 on non-Linux platforms).
- **FR-014**: System MUST update the generated command preview in real-time as any option is changed.
- **FR-015**: System MUST persist all new settings per device alongside existing device settings.
- **FR-016**: System MUST include all new options in the preset save/load mechanism.
- **FR-017**: System MUST detect the installed scrcpy version and disable features not supported by that version with explanatory tooltips.

### Key Entities

- **Device Settings**: Extended to include keyboard mode, mouse mode, gamepad mode, audio forwarding toggle, video source, camera options, V4L2 settings, virtual display settings, OTG mode, window title, and no-video toggle.
- **Scrcpy Session**: Represents a running scrcpy instance with its full configuration, process handle, and captured stderr output.
- **Preset**: Extended to include all new configuration fields so saved presets cover the complete feature set.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can configure and launch any scrcpy feature (keyboard/mouse modes, audio, camera, V4L2, virtual display, OTG, gamepad) entirely from the GUI without typing any command-line flags.
- **SC-002**: 100% of scrcpy's most-used options (as listed in scrcpy's "Usage examples" section) are accessible through the GUI.
- **SC-003**: Users can start a camera-as-webcam session (camera + V4L2) in under 5 clicks from the device list.
- **SC-004**: When scrcpy fails after launch, 100% of errors are captured and displayed in the Logs tab within 2 seconds.
- **SC-005**: The generated command preview updates within 100ms of any settings change.
- **SC-006**: Incompatible option combinations are prevented at the UI level — users cannot submit an invalid scrcpy command through the GUI.
- **SC-007**: All new options are included in preset save/load, and existing presets continue to work without migration issues.
- **SC-008**: Features unavailable on the current platform or device are hidden or disabled with clear explanatory text, not shown as broken controls.

## Assumptions

- The user has scrcpy v2.0+ installed (audio forwarding requires v2.0+, camera requires v2.1+, virtual display requires v2.7+). The GUI will detect the version and gate features accordingly.
- V4L2 support is Linux-only; the GUI hides this section on other platforms. Since the app's primary target is Linux per the constitution, this is a first-class feature.
- OTG mode only works with USB connections; wirelessly connected devices cannot use OTG.
- Camera mirroring requires Android 12+ (API 31); the GUI disables camera options for older devices.
- Audio forwarding requires Android 11+ (API 30); the GUI disables audio controls for older devices.
- Existing device settings and presets will gain new fields with sensible defaults (default input modes, audio enabled, display as video source) so current users are not disrupted.
- The `adb pair` workflow (Android 11+ wireless pairing codes) is out of scope for this feature and tracked separately.
