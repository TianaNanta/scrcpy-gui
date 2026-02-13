# Feature Specification: Device Health Indicators & Status Polling

**Feature Branch**: `004-device-health-polling`  
**Created**: 2026-02-13  
**Status**: Draft  
**Input**: User description: "Build Device health indicators & status polling for this Tauri application"

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

### User Story 1 - Real-time Device Status Display (Priority: P1)

A user with multiple Android devices connected wants to see at a glance whether each device is currently online or offline. They open the Devices tab and instantly see a visual status indicator on each device card — a small icon or colored dot showing "online," "offline," or "connecting." When a device goes offline (e.g., USB is unplugged), the indicator immediately updates without the user needing to refresh or restart the app.

**Why this priority**: The offline/online status is fundamental to the user experience. Without knowing which devices are available, users cannot reliably start scrcpy sessions. This is a critical foundation for all other health features.

**Independent Test**: Can be fully tested by connecting/disconnecting a USB device and verifying the status indicator animates and updates correctly within 1-2 seconds.

**Acceptance Scenarios**:

1. **Given** a device is connected and online, **When** the user views the device list, **Then** a visual "online" indicator (e.g., green dot or animated pulse) is displayed on the device card.
2. **Given** a device is USB-connected and the cable is unplugged, **When** the disconnection occurs, **Then** the status indicator animates to "offline" within 2 seconds without requiring a manual refresh.
3. **Given** a device is in the process of connecting, **When** it transitions between states, **Then** an intermediate "connecting..." state is briefly shown (e.g., spinner or animated icon).
4. **Given** multiple devices are listed with mixed online/offline states, **When** the user glances at the list, **Then** offline devices are visually distinct and do not clutter the view (e.g., slightly faded or lower in the list).

---

### User Story 2 - Battery & Storage Health Warnings (Priority: P2)

A user has an Android device with low battery (e.g., 5%) and critically low storage (e.g., 100 MB free). When they open the Devices tab and click on the device's info popover, they see device details including battery percentage and available storage. For critical levels, a warning badge or icon appears on the device card itself — alerting the user before they attempt a mirror session that might fail due to insufficient resources.

**Why this priority**: This prevents frustration from failed sessions due to device resource constraints. Low battery or storage are common issues that users don't expect, so surfacing them proactively improves user experience and reduces support burden.

**Independent Test**: Can be tested by polling a device with low battery/storage and verifying the warning badges appear with correct values and color-coding.

**Acceptance Scenarios**:

1. **Given** a device has battery below 10%, **When** the user views the device list, **Then** a battery warning badge (e.g., red icon with percentage) appears on the device card.
2. **Given** a device has free storage below 200 MB, **When** the user clicks the device info popover, **Then** storage information is displayed with a clear warning and recommendation to free up space.
3. **Given** a device has both low battery and low storage, **When** the user hovers over the device card, **Then** both warnings are visible without needing to open the popover.
4. **Given** device health improves (battery charged, storage freed), **When** the next health poll occurs, **Then** warning badges automatically disappear.

---

### User Story 3 - Connection Quality Metrics Display (Priority: P2)

A user wants to understand the quality of their connection before starting a mirror session, especially for wireless devices. They click on a wireless device's info popover and see connection metrics: signal strength (WiFi or USB speed), estimated latency, and a quality indicator (e.g., "Excellent," "Good," "Fair," "Poor"). These metrics update in real-time as they unlock and relock the device or move closer/farther from the router.

**Why this priority**: Poor connection quality is a common source of lag and disconnections during mirroring. Showing users this information upfront enables them to make informed decisions (e.g., "Switch to USB" or "Move closer to router") before starting a session.

**Independent Test**: Can be tested by checking a wireless device's connection metrics, moving the device, and verifying the quality indicator updates within 2-3 seconds.

**Acceptance Scenarios**:

1. **Given** a wireless device is connected, **When** the user clicks the device info popover, **Then** connection quality metrics (signal strength, latency estimate, quality label) are displayed.
2. **Given** a USB device is connected, **When** the user views its info popover, **Then** USB transfer speed is displayed instead of WiFi metrics.
3. **Given** a wireless device with weak signal, **When** the user views the quality indicator, **Then** it shows "Fair" or "Poor" with a visual warning (e.g., orange/red icon).
4. **Given** a device that moves locations, **When** the device's signal changes, **Then** the quality indicator updates within 3 seconds without requiring a manual refresh.

---

### User Story 4 - Automatic Reconnection with Error Recovery (Priority: P3)

A user's wireless device briefly loses connection (e.g., network hiccup). Instead of the app immediately showing an error, the system automatically attempts to reconnect with exponential backoff — retrying after 500ms, 1s, 2s, etc. If the device comes back online within a reasonable timeframe, the user sees a transient "reconnecting..." message, but if it exceeds the retry limit, they get a friendly error with troubleshooting suggestions.

**Why this priority**: Temporary connection interruptions are common in wireless scenarios. Graceful auto-retry reduces the number of errors users see and improves perceived reliability. This is valuable but not critical compared to basic status display.

**Independent Test**: Can be tested by intentionally disconnecting a wireless device, waiting for auto-retry logic, and verifying the UI shows appropriate transient vs. final error states.

**Acceptance Scenarios**:

1. **Given** a wireless device is online and its connection is lost, **When** the disconnection is detected, **Then** the system automatically attempts to reconnect with exponential backoff (0.5s, 1s, 2s, etc.).
2. **Given** a device attempts reconnection, **When** it fails after 5 retry attempts (max ~8 seconds), **Then** the user sees a friendly error message with troubleshooting suggestions (e.g., "Check WiFi, restart ADB, or reconnect device").
3. **Given** a device reconnects successfully during retry attempts, **When** the connection is restored, **Then** no error is shown and the status returns to "online."
4. **Given** the user has multiple devices, **When** one device reconnects while another remains offline, **Then** each device's status is managed independently.

---

### Edge Cases

## Requirements *(mandatory)*

### Functional Requirements

#### Polling & Status Detection
- **FR-001**: System MUST poll ADB for device status at configurable intervals (default 1 second for USB, 3 seconds for wireless)
- **FR-002**: System MUST detect device online/offline state changes within 2 seconds of the actual change
- **FR-003**: System MUST use exponential backoff for ADB queries to avoid overwhelming the system when many devices are connected
- **FR-004**: System MUST automatically detect and reconnect when ADB server restarts (e.g., after `adb kill-server`)

#### Health Metrics Collection
- **FR-005**: System MUST collect and display device battery percentage (requires Android API call to `dumpsys battery`)
- **FR-006**: System MUST collect and display free storage space (requires `adb shell df` or similar command)
- **FR-007**: System MUST collect and display device name, Android version, and model from `adb shell getprop`
- **FR-008**: System MUST collect wireless signal strength for WiFi-connected devices
- **FR-009**: System MUST estimate connection latency by measuring ADB command response time (e.g., ping via `adb shell`)

#### UI Display & Updates
- **FR-010**: System MUST display device status indicators on device cards that update in real-time without page refresh
- **FR-011**: System MUST show visual warning badges for low battery (<10%), critically low battery (<5%), and low storage (<200 MB)
- **FR-012**: System MUST allow users to click a device to view detailed health information in a popover (battery %, storage, android version, connection quality)
- **FR-013**: System MUST color-code status indicators: green for online, red for offline, yellow/spinner for connecting
- **FR-014**: System MUST not block the main UI thread during polling; all ADB queries MUST run on background threads

#### Error Handling & Recovery
- **FR-015**: System MUST implement exponential backoff for reconnection attempts (0.5s, 1s, 2s, 4s, 8s max)
- **FR-016**: System MUST limit reconnection attempts to 5 retries before showing a final error state
- **FR-017**: System MUST handle transient ADB errors gracefully and retry without showing errors to the user
- **FR-018**: System MUST handle permission errors (no USB debugging, no ADB access) and show user-friendly messages
- **FR-019**: System MUST cache device health data and show stale data if polling temporarily fails, with a visual indicator of staleness

#### Performance & Optimization
- **FR-020**: System MUST debounce status updates to avoid excessive UI re-renders (coalesce updates within 100ms)
- **FR-021**: System MUST stop polling for devices that remain offline for >5 minutes to reduce system load
- **FR-022**: System MUST pause polling when app is in background or minimized
- **FR-023**: System MUST limit polling frequency dynamically based on number of connected devices (fewer devices = more frequent polling)

### Key Entities *(include if feature involves data)*

- **DeviceStatus**: Represents the current state of a device
  - `deviceId` (string): Unique ADB device serial number
  - `state` (enum): "online" | "offline" | "connecting" | "error"
  - `lastSeen` (timestamp): When device was last confirmed online
  - `batteryPercent` (number): 0-100, updated periodically
  - `batteryTemperature` (number): Celsius, optional
  - `storageUsed` (number): Bytes
  - `storageFree` (number): Bytes
  - `signalStrength` (number): -1 to 0 dBm for wireless, null for USB

- **ConnectionMetrics**: Represents connection quality
  - `latency` (number): Milliseconds, estimated from ADB response time
  - `signalStrength` (number): WiFi signal in dBm or USB speed
  - `qualityLevel` (enum): "excellent" | "good" | "fair" | "poor"
  - `lastUpdated` (timestamp): When metrics were last refreshed

- **HealthPollingStrategy**: Configuration for polling behavior
  - `pollingIntervalUsb` (number): Milliseconds, default 1000
  - `pollingIntervalWireless` (number): Milliseconds, default 3000
  - `offlineThreshold` (number): Milliseconds to wait before marking truly offline, default 5000
  - `maxRetries` (number): Max reconnect attempts, default 5
  - `retryBackoffMs` (number): Initial retry backoff, default 500

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Device status (online/offline) updates within 2 seconds of actual state change on the UI for USB-connected devices
- **SC-002**: Wireless device status updates within 5 seconds of actual state change (accounting for WiFi latency)
- **SC-003**: Low battery/storage warnings appear for ≥5% of devices with critical levels in test fleet
- **SC-004**: App's CPU usage does not exceed 15% during idle polling with 5 connected devices
- **SC-005**: ADB polling causes zero UI thread blocking — all updates are asynchronous and smooth (no visible freezes)
- **SC-006**: When a device is temporarily disconnected and reconnected, it recovers to "online" state within 8 seconds without user intervention
- **SC-007**: Memory footprint for health polling system remains under 10 MB regardless of number of connected devices
- **SC-008**: 95% of users successfully identify which devices are available by looking at status indicators without additional clicks
- **SC-009**: Troubleshooting suggestions displayed on connection errors reduce support tickets related to device connection issues by 30%
- **SC-010**: Connection quality indicator correctly predicts user experience (devices marked "Poor" experience >20% latency; "Excellent" experience <10% latency)

### Non-Functional Requirements

- **Performance**: Polling queries must complete within 500ms per device; aggregate query for 10 devices within 2 seconds
- **Reliability**: System must maintain 99.5% uptime for status polling (no more than 30 seconds downtime per 10-hour session)
- **Battery Impact**: Status polling should not increase device battery drain by more than 1% per hour
- **Network Efficiency**: Each polling cycle should use <1 KB of data per device

---

## Assumptions

- **ADB availability**: Assumes `adb` command-line tool is installed and accessible in the system PATH
- **Device permissions**: Assumes devices have USB debugging enabled for ADB access
- **Polling intervals**: Users cannot customize polling frequency in this MVP; defaults are reasonable for most use cases
- **Historical data**: Health data is not persisted between app sessions; only current state is maintained
- **No temperature monitoring**: While battery temperature can be read, thermal warnings are out of scope for this feature
- **Limited to local devices**: Polling only works for locally connected devices (USB or wireless LAN); cloud-based remote devices are not supported

---

## Out of Scope

- Device grouping or filtering by health status (separate feature)
- Historical health metrics or graphs (separate feature)
- Automated actions based on health (e.g., auto-disconnect at critical battery)
- Custom polling intervals per device (future enhancement)
- Integration with third-party device management services
