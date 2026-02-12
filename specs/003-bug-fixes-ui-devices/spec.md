# Feature Specification: Bug Fixes — UI Theming, Command Execution & Device Management

**Feature Branch**: `003-bug-fixes-ui-devices`  
**Created**: 2026-02-11  
**Status**: Draft  
**Input**: User description: "Resolve some issues with this project, like UI that doesn't match dark/light mode (dropdown stay light/white even in dark mode), mirroring tweaks don't work as the user entered a set of given configuration (generated command work well when copied and pasted inside terminal but when launched via the app, doesn't work as intended), list_devices that show directly connected devices without adding or pairing it via the add devices buttons and also the fact that when a devices is disconnected, it is also removed from the list of devices but I want it to stay in the list with a state as disconnected so that when I reconnect the devices, I can just reconnect to it from the list without adding it as a new devices, and many more bugs and issues fixes"

## Clarifications

### Session 2026-02-11

### Session 2026-02-12

- Q: Camera mode (`--video-source=camera`) selected in the modal doesn't activate the device camera — app always mirrors the screen. Root cause? → A: Stale React state race condition. `handleLaunchFromModal` calls `setAllDeviceSettings()` (batched/async) then immediately calls `startScrcpy()` which reads the old state. Fix: pass `currentSettings` directly to `buildArgs` in the modal launch path instead of reading from the state map. No clarification questions needed — FR-005 already covers expected behavior.

### Session 2026-02-11

- Q: Which control-dependent flags should the command builder suppress in camera mode? → A: All flags that error when control is disabled: `--turn-screen-off`, `--show-touches`, `--power-off-on-close`, `--stay-awake`, `--start-app`. Note: `--no-power-on` is NOT control-dependent (safe to pass).
- Q: Should the UI indicate that control-dependent flags are suppressed in camera mode? → A: Yes — show a brief info message or tooltip on affected toggles (e.g., "Disabled in camera mode") but don't change toggle state
- Q: Should the same suppression + UI hints apply when the user explicitly enables `--no-control`? → A: Yes — identical behavior for both camera mode and explicit no-control

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 — Consistent Dark/Light Mode Theming (Priority: P1)

As a user, I want every part of the application UI — including all dropdowns, selects, modals, alerts, log entries, and input fields — to correctly follow my chosen theme (dark, light, or system) so that I never encounter unreadable text, invisible elements, or jarring white flashes.

**Why this priority**: A broken visual theme is the most immediately visible defect. It degrades every interaction across the entire app and makes the application look unprofessional and unfinished. Fixing theming has the broadest impact on perceived quality.

**Independent Test**: Switch the app between dark mode, light mode, and system mode. Visually inspect every screen (device list, settings modal, pair device modal, log viewer, settings page) and confirm all elements are legible and correctly themed.

**Acceptance Scenarios**:

1. **Given** the user has selected dark mode, **When** they open any dropdown/select element anywhere in the app, **Then** the dropdown options render with a dark background and light text — no white/light backgrounds leak through.
2. **Given** the user has selected dark mode, **When** the app first loads, **Then** there is no visible flash of light-mode colors before the theme applies.
3. **Given** the user has selected "system" theme and the OS theme changes from light to dark at runtime, **When** the change occurs, **Then** the app automatically updates its theme without requiring a manual refresh or setting change.
4. **Given** the user is in dark mode, **When** an error alert is displayed, **Then** the alert background and text are correctly themed for dark mode (no hardcoded light-only colors).
5. **Given** the user is in light mode, **When** they view the log viewer, **Then** log entry separators and borders are visible (not invisible-white-on-white).
6. **Given** the user is in dark mode, **When** they open the device settings modal, **Then** all select inputs within settings panels render with appropriate dark-mode styling.

---

### User Story 2 — Reliable Command Execution Matching User Configuration (Priority: P1)

As a user, I want the mirroring session launched via the app to behave identically to copying the displayed command and pasting it in a terminal, so that my configured options (resolution, bitrate, crop, rotation, recording path, window title, etc.) are faithfully applied during mirroring.

**Why this priority**: This is a core functional bug — the primary purpose of the app is to configure and launch scrcpy. If the launched session ignores user configuration, the app fails its fundamental value proposition. This ties with theming as P1 because it breaks core functionality.

**Independent Test**: Configure several scrcpy options (e.g., custom resolution, bitrate, crop, window title with spaces, recording to a file path with spaces), launch via the app, and verify the mirroring session applies all settings. Compare behavior with copy-pasting the preview command into a terminal.

**Acceptance Scenarios**:

1. **Given** the user has configured specific mirroring options (e.g., max resolution 1280, bitrate 4M, rotation 90°), **When** they launch mirroring via the app, **Then** the scrcpy session applies the exact same options as would be applied by running the preview command in a terminal.
2. **Given** the user has set a window title containing spaces (e.g., "My Phone"), **When** they launch mirroring via the app, **Then** the window title is correctly passed without being split into multiple arguments.
3. **Given** the user has set a recording path containing spaces, **When** they launch via the app, **Then** the recording saves to the correct file path.
4. **Given** the user has selected "camera" as video source and configured camera-specific options, **When** they launch via the app, **Then** display-specific flags (like `--display-id`) that conflict with camera mode are not sent.
5. **Given** the user has selected "camera" as video source, **When** they launch via the app, **Then** control-dependent flags (`--turn-screen-off`, `--show-touches`, `--power-off-on-close`, `--stay-awake`, `--start-app`) are suppressed because camera mode disables device control.
6. **Given** the user has configured a virtual display with custom dimensions, **When** they launch via the app, **Then** flags incompatible with virtual display mode (e.g., `--crop`, `--display-id`) are not sent.
7. **Given** the user has all options at their default values, **When** they launch mirroring, **Then** no redundant default-value flags are passed (the command is clean and minimal).

---

### User Story 3 — Persistent Device List with Disconnected State (Priority: P1)

As a user, I want devices that I have previously connected to remain in my device list even after they disconnect, shown with a "disconnected" status. When I reconnect the device, I want to resume using it from the existing list entry — without having to re-add or re-pair it.

**Why this priority**: Currently, device disconnection erases the device from the list, losing all per-device settings and forcing the user to go through the add/pair flow again. This is one of the most frustrating workflow disruptions reported.

**Independent Test**: Connect a device, verify it appears. Disconnect the device physically or via wireless disconnect. Verify it remains in the list as "disconnected." Reconnect, verify the status updates to "connected" and all previous settings are preserved.

**Acceptance Scenarios**:

1. **Given** a device was previously connected and is now physically disconnected, **When** the device list refreshes, **Then** the device remains in the list with a visible "disconnected" indicator.
2. **Given** a disconnected device is shown in the list, **When** the user reconnects the device (by plugging it back in or re-enabling wireless), **Then** the device status updates to "connected" and all previously saved settings and custom name are intact.
3. **Given** a disconnected device is shown in the list, **When** the user attempts to launch mirroring on it, **Then** the system shows a clear message indicating the device is not currently available.
4. **Given** a device has never been connected before and is plugged in via USB, **When** the device list refreshes, **Then** the device appears automatically in the list as "connected" without requiring the user to explicitly add it through the pair/add modal.
5. **Given** a user has multiple devices (some connected, some disconnected), **When** they view the device list, **Then** connected devices are visually distinguishable from disconnected ones (e.g., different styling, status badge).
6. **Given** a user wishes to permanently remove a previously-connected device from the list, **When** they use a "Remove" or "Forget" action on a disconnected device, **Then** the device and all its saved settings are removed from the list and storage.

---

### User Story 4 — Auto-Discovery of Directly Connected Devices (Priority: P2)

As a user, I want USB-connected devices to appear in the device list automatically without needing to open the "Add Device" modal, so that the common workflow of plugging in a phone and starting mirroring is fast and frictionless.

**Why this priority**: While the persistent device list (P1) handles the data model, auto-discovery ensures new USB devices appear immediately. This is a usability improvement that eliminates a redundant manual step for the most common connection method.

**Independent Test**: Plug in a USB device with ADB debugging enabled. Without clicking any "Add" or "Pair" button, verify that the device appears in the sidebar device list within a few seconds.

**Acceptance Scenarios**:

1. **Given** a USB device with ADB debugging enabled is plugged in, **When** the app is running, **Then** the device appears in the device list within 5 seconds without any user action.
2. **Given** the app is running with no devices connected, **When** a USB device is plugged in, **Then** the device list updates automatically to show the new device.
3. **Given** a USB device is shown in the list, **When** it is unplugged, **Then** the device status changes to "disconnected" within 5 seconds (the device remains in the list per User Story 3).
4. **Given** multiple USB devices are plugged in simultaneously, **When** the app is running, **Then** all devices appear in the list.

---

### User Story 5 — Device Settings Persistence Without Launching (Priority: P2)

As a user, I want my device configuration changes to be saved when I close the settings modal, even if I don't immediately launch a mirroring session, so that I can configure devices ahead of time and my work is not lost.

**Why this priority**: Currently, settings changes are only persisted when the user clicks "Launch." Closing the modal without launching discards all changes silently. This is a data-loss bug that erodes user trust.

**Independent Test**: Open device settings, change several options, close the modal without launching. Re-open the settings and verify all changes were saved.

**Acceptance Scenarios**:

1. **Given** the user has modified device settings in the modal, **When** they close the modal without launching, **Then** all changes are persisted to storage.
2. **Given** the user has renamed a device in the settings modal, **When** they close the modal and view the device list, **Then** the new name is immediately reflected in the device list.
3. **Given** the user has modified settings and clicks "Launch," **When** the mirroring session starts, **Then** the settings are also persisted (existing behavior maintained).

---

### User Story 6 — Pair Device Modal Improvements (Priority: P3)

As a user, I want the "Pair Device" modal to provide meaningful feedback (success/failure), validate IP addresses before attempting connection, and support newer wireless debugging pairing flows so that connecting wireless devices is reliable and informative.

**Why this priority**: The pairing modal has several usability gaps (no feedback, no validation, premature close), but the core wireless connect functionality works. These are polishing improvements.

**Independent Test**: Open the pair device modal, enter an invalid IP, verify validation feedback. Enter a valid IP, attempt connection, verify success/error feedback is shown in the modal before it closes.

**Acceptance Scenarios**:

1. **Given** the user opens the wireless connection flow, **When** they enter an invalid IP format (e.g., "abc", "999.999.999.999"), **Then** the system shows a validation error before attempting connection.
2. **Given** the user initiates a wireless connection, **When** the connection is in progress, **Then** a loading indicator is shown in the modal.
3. **Given** a wireless connection attempt succeeds, **When** the result is received, **Then** a success message is displayed before the modal closes.
4. **Given** a wireless connection attempt fails, **When** the error is received, **Then** the error message is displayed in the modal and the modal remains open so the user can retry.

---

### Edge Cases

- What happens when a device serial changes after factory reset? The system should treat it as a new device.
- What happens when a wireless device is connected but network latency causes ADB to report it as offline intermittently? The system should show an "offline" or "unauthorized" status rather than removing the device.
- What happens when the user switches between light and dark mode rapidly? Each switch should apply cleanly with no stale colors persisting.
- What happens when the user has a recording path or window title containing special characters (quotes, ampersands, etc.)? The command execution should handle these correctly.
- What happens when the device list refresh takes a long time (many devices, slow ADB responses)? The UI should show a loading state and remain responsive.
- What happens when `adb` is not installed or not on PATH? The system should show a clear error message rather than silently failing.
- What happens when a user removes a device from the list that currently has an active mirroring session? The system should stop the session and then remove the device.
- What happens when settings are changed in the modal and launched immediately? The launch path must use the modal's live settings (`currentSettings`), not the React state map (`allDeviceSettings`), because `setState` is batched and not yet applied when `startScrcpy` runs in the same synchronous block. This stale-state race condition causes the executed command to use old/default settings instead of the user's current choices.
- What happens when `--video-source=camera` is active and control-dependent options are enabled? Camera mode implicitly disables device control; the command builder must silently suppress `--turn-screen-off`, `--show-touches`, `--power-off-on-close`, `--stay-awake`, and `--start-app` to prevent scrcpy errors. `--no-power-on` is safe to pass.

## Requirements *(mandatory)*

### Functional Requirements

**Theme & Visual Consistency**

- **FR-001**: System MUST render all dropdown/select elements (including native `<option>` popups) with colors matching the active theme in both dark and light mode.
- **FR-002**: System MUST apply CSS custom properties for theming before the first paint to prevent a flash of unstyled/wrong-theme content on page load.
- **FR-003**: System MUST listen for operating system theme changes when the user has selected "system" theme and apply the new theme automatically at runtime.
- **FR-004**: System MUST use theme-aware colors for all UI elements — alerts, borders, separators, and backgrounds — with no hardcoded light-only or dark-only color values.

**Command Execution Consistency**

- **FR-005**: System MUST ensure the scrcpy command executed by the app uses exactly the same set of flags and arguments as shown in the command preview display.
- **FR-006**: System MUST correctly handle argument values containing spaces, quotes, or special characters when executing scrcpy (e.g., window titles, file paths).
- **FR-007**: System MUST apply the same conditional logic for flag inclusion in both the command preview builder and the execution builder (e.g., suppressing `--display-id` when camera mode is active, suppressing `--crop` when virtual display is active). When device control is disabled — either implicitly by `--video-source=camera` or explicitly by `--no-control` — the system MUST suppress all control-dependent flags: `--turn-screen-off`, `--show-touches`, `--power-off-on-close`, `--stay-awake`, `--start-app`. Note: `--no-power-on` is NOT control-dependent and should NOT be suppressed.
- **FR-007a**: When device control is disabled (by camera mode or explicit `--no-control`), the UI MUST show a brief informational indicator (tooltip or inline hint) on control-dependent toggles to inform the user these flags will be suppressed. The toggle state itself MUST NOT be changed — the user's intent is preserved and re-applied when control is re-enabled.
- **FR-008**: System MUST NOT pass default-value flags to scrcpy when the user has not modified the option from its default (keeping the executed command minimal and clean).

**Device List & Persistence**

- **FR-009**: System MUST retain previously connected devices in the device list after they disconnect, displaying them with a "disconnected" status.
- **FR-010**: System MUST automatically detect and display USB-connected devices without requiring user action through the add/pair modal.
- **FR-011**: System MUST periodically check for device connection status changes (new connections, disconnections) and update the device list accordingly.
- **FR-012**: System MUST merge auto-discovered device information with any existing saved device data (custom name, settings) when a known device reconnects.
- **FR-013**: System MUST allow users to permanently remove ("forget") a disconnected device and all its associated settings from the list.
- **FR-014**: System MUST prevent launching mirroring on a device that is currently disconnected, showing a clear informational message.

**Settings Persistence**

- **FR-015**: System MUST save device settings to persistent storage when the settings modal is closed, regardless of whether the user clicks "Launch" or simply closes the modal.
- **FR-016**: System MUST immediately reflect device name changes in the device list after the settings modal is closed (without requiring page reload).

**Pair Device Modal**

- **FR-017**: System MUST validate IP address format before attempting a wireless connection.
- **FR-018**: System MUST display connection progress, success, and failure feedback within the pair device modal before closing it.

### Key Entities

- **Device**: Represents a physical Android device. Key attributes: serial (unique identifier), display name (user-customizable), connection type (USB or wireless), connection status (connected, disconnected, offline, unauthorized), device model, Android version, battery level.
- **Device Settings**: Per-device scrcpy configuration. Key attributes: all scrcpy options (video, audio, display, input, recording, etc.), associated device serial. Persisted independently of device connection status.
- **Theme**: Application visual theme. Possible values: light, dark, system. Affects all visual elements globally.
- **Scrcpy Command**: The set of flags and arguments passed to scrcpy for a mirroring session. Must be consistent between what is displayed (preview) and what is executed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of UI elements (dropdowns, selects, modals, alerts, log entries, borders) render correctly in both dark and light themes with no hardcoded wrong-theme colors visible.
- **SC-002**: Every scrcpy session launched via the app produces identical behavior to copy-pasting the preview command into a terminal — 0% configuration drift between preview and execution.
- **SC-003**: USB-connected devices appear in the device list within 5 seconds of being plugged in, without any manual "Add" or "Refresh" action.
- **SC-004**: Disconnected devices remain in the device list across app restarts, with 100% of their saved settings preserved and restored upon reconnection.
- **SC-005**: Device settings saved in the modal are persisted on modal close — 0 instances of silent data loss when closing without launching.
- **SC-006**: Wireless connection attempts in the pair modal show inline feedback (loading, success, or error) — the modal never closes silently on failure.
- **SC-007**: The app responds to OS theme changes within 1 second when "system" theme is selected.
- **SC-008**: Users can go from plugging in a USB device to launching mirroring in under 10 seconds (no unnecessary add/pair steps).

## Assumptions

- The host machine has `adb` installed and accessible on the system PATH.
- USB-connected devices have ADB debugging enabled in their developer settings.
- The application already has a functioning theme system with CSS custom properties — fixes are refinements to the existing approach, not a full rewrite.
- Scrcpy is installed and accessible on the system PATH.
- Device serial numbers are stable identifiers for the lifetime of a device (they don't change across reconnections, though they may differ between USB and wireless for the same physical device).
- The existing localStorage-based persistence approach is acceptable for device settings storage.
