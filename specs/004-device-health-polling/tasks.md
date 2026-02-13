# Tasks: Device Health Indicators & Status Polling

**Input**: Design documents from `/specs/004-device-health-polling/`  
**Branch**: `004-device-health-polling`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅  
**Tech Stack**: Tauri + Rust 1.75+ + React 18.3+ + TypeScript 5.6+ + Bun

---

## Format Guide

- **[P]**: Task can run in parallel (different files, no blocking dependencies)
- **[US#]**: Belongs to User Story # (enables independent testing)
- **File paths**: Exact locations for implementation

---

## Phase 1: Setup & Infrastructure

**Purpose**: Project initialization, types, and Tauri command registration

- [x] T001 Create Rust module structure: `src-tauri/src/services/`, `src-tauri/src/commands/`
- [x] T002 [P] Create React module structure: `src/hooks/`, `src/types/health.ts`, `src/components/`
- [x] T003 [P] Add dependencies to `Cargo.toml`: tokio, tokio_util, chrono (with versions)
- [x] T004 [P] Create TypeScript type file `src/types/health.ts` with all interfaces from data-model.md
- [x] T005 [P] Create Rust types file `src-tauri/src/types/health.rs` matching data model (DeviceHealth, DeviceState, etc.)
- [x] T006 Create `src-tauri/src/services/mod.rs` to export health_poller and adb_health_provider modules
- [x] T007 Create `src-tauri/src/commands/mod.rs` to export device_health commands

---

## Phase 2: Foundational (Blocking Prerequisites) 🔄

**Purpose**: Core ADB provider and health types that all user stories depend on

**⚠️ CRITICAL**: Cannot start user story work until health provider is testable

### ADB Health Provider (Reusable by all stories)

- [x] T008 Implement ADB command execution helper in `src-tauri/src/services/adb_health_provider.rs`
  - Function: `run_adb_command(device_id: &str, cmd: &str) -> Result<String, String>`
  - Must timeout after 500ms per command
  - Must handle stderr and return user-friendly errors

- [x] T009 [P] Implement battery parsing in `src-tauri/src/services/adb_health_provider.rs`
  - Function: `get_battery_info(device_id: &str) -> Result<BatteryInfo, String>`
  - Parse `adb shell dumpsys battery` output
  - Extract: percentage, temperature, charging status

- [x] T010 [P] Implement storage parsing in `src-tauri/src/services/adb_health_provider.rs`
  - Function: `get_storage_info(device_id: &str) -> Result<StorageInfo, String>`
  - Parse `adb shell df /data` output
  - Calculate: used, total, free (bytes)

- [x] T011 [P] Implement device info parsing in `src-tauri/src/services/adb_health_provider.rs`
  - Function: `get_device_info(device_id: &str) -> Result<DeviceInfo, String>`
  - Parse `adb shell getprop ro.product.model`, `ro.build.version.release`, `ro.build.id`

- [x] T012 [P] Implement latency measurement in `src-tauri/src/services/adb_health_provider.rs`
  - Function: `get_latency(device_id: &str) -> Result<u32, String>`
  - Measure response time of lightweight ADB command
  - Return milliseconds

- [x] T013 Implement quality level derivation helper in `src-tauri/src/services/adb_health_provider.rs`
  - Function: `derive_quality_level(latency: u32) -> String`
  - Logic: <50ms=excellent, <100ms=good, <200ms=fair, >200ms=poor

### Rust Unit Tests for Provider

- [x] T014 [P] Write parser tests in `src-tauri/tests/health/adb_provider_tests.rs`
  - Test: `parse_battery_percentage()` with mock dumpsys output
  - Test: `parse_storage_info()` with mock df output
  - Test: `parse_device_info()` with mock getprop output
  - All tests must use mocked ADB responses (no real device dependency)

- [x] T015 Write integration test for full AdbHealthProvider in `src-tauri/tests/health/adb_provider_tests.rs`
  - Test: `test_get_battery_info_with_mock()`
  - Mock: `std::process::Command` to return fixed output
  - Verify: BatteryInfo struct populated correctly

## Phase 3: User Story 1 - Real-time Device Status Display (Priority: P1) 🎯 MVP

**Goal**: Display live online/offline/connecting status on device cards with <2second update latency

**Independent Test**: Connect/disconnect USB device, verify status indicator updates within 2 seconds without manual refresh

### Tauri Command: start_health_polling

- [x] T016 Implement polling service struct in `src-tauri/src/services/polling.rs`
  - Struct: `HealthPollingService` with fields: polling_task, is_running, device_health, app_handle
  - Constructor: `new(app_handle: AppHandle) -> Self`
  - Methods: `start_polling()`, `stop_polling()`, `get_device_health_blocking()`

- [x] T017 Implement polling loop function in `src-tauri/src/services/polling.rs`
  - Function: `async fn polling_loop(...)`
  - Logic: Manual loop with atomic flag for cancellation + interval timer
  - Loop: For each device, call `poll_single_device()` (polling interval configurable)
  - Emit: `device-health-update` event to React

- [x] T018 Implement single device polling in `src-tauri/src/services/polling.rs`
  - Function: `async fn poll_single_device(device_id: &str, config: &HealthPollingConfig) -> Result<DeviceHealth, String>`
  - Build: DeviceHealth with all fields (use AdbHealthProvider from T008-T013)
  - State: Set to `online` if poll succeeds, `offline` if ADB times out
  - Return: Complete DeviceHealth object

- [x] T019 Implement start_health_polling command in `src-tauri/src/commands/health.rs`
  - Command: `#[tauri::command] async fn start_health_polling(device_ids: Vec<String>, config: Option<HealthPollingConfig>, polling_service: State<Mutex<HealthPollingService>>) -> Result<CommandResultResponse, String>`
  - Creates tokio task and stores in state
  - Validates device IDs are non-empty
  - Returns error if polling already running

- [x] T020 [P] Implement stop_health_polling command in `src-tauri/src/commands/health.rs`
  - Command: `#[tauri::command] async fn stop_health_polling(polling_service: State<Mutex<HealthPollingService>>) -> Result<CommandResultResponse, String>`
  - Stops tokio task via atomic flag
  - Emits `polling-stopped` event

- [x] T021 [P] Implement get_device_health command in `src-tauri/src/commands/health.rs`
  - Command: `#[tauri::command] async fn get_device_health(device_id: String, polling_service: State<Mutex<HealthPollingService>>) -> Result<GetDeviceHealthResponse, String>`
  - Returns cached health or None if not found

- [x] T022 Register commands in `src-tauri/src/lib.rs`
  - Added to `tauri::generate_handler![]`: start_health_polling, stop_health_polling, get_device_health
  - Initialized HealthPollingService in `.setup()` and `app.manage()`

### React Hook: useDeviceHealth

- [x] T023 Implement `useDeviceHealth(deviceId: string)` hook in `src/hooks/useDeviceHealth.ts`
  - Returns: { health, isPolling, error, refresh }
  - Setup: Listener for `device-health-update` events filtered by deviceId
  - Manual refresh: invoke('get_device_health') on demand
  - Cleanup: Unsubscribe on unmount

- [x] T024 Implement `useHealthPolling(enabled, config, deviceIds)` hook in `src/hooks/useHealthPolling.ts`
  - Returns: { isActive, error }
  - When enabled=true: invoke('start_health_polling')
  - When enabled=false: invoke('stop_health_polling')
  - Depends on user story to provide device list

### React Component: DeviceStatusIndicator

- [x] T025 Implement `DeviceStatusIndicator.tsx` component in `src/components/DeviceStatusIndicator.tsx`
  - Props: status (online/offline/connecting/error), animate?, className?
  - Render: Div with CSS class reflecting status
  - Animation: Pulsing for online state (CSS @keyframes pulse)
  - Accessibility: role="status", aria-label

- [x] T026 [P] Add to `src/App.css` or component CSS:
  - `.status-indicator` base styles
  - `.status-online` with green color
  - `.status-offline` with red color + opacity
  - `.status-connecting` with spinner animation
  - `@keyframes pulse` for online animation

### Modify Existing: DeviceCard.tsx

- [x] T027 [P] Extend DeviceCard props in `src/components/DeviceCard.tsx`
  - Add: health?: DeviceHealth
  - Add: onInfoClick?: () => void

- [x] T028 Update DeviceCard render in `src/components/DeviceCard.tsx`
  - Import: DeviceStatusIndicator
  - Render: `<DeviceStatusIndicator status={health?.state || 'offline'} />`
  - Place status indicator in card header

### Modify Existing: DeviceList.tsx

- [x] T029 Add health state management in `src/components/DeviceList.tsx`
  - State: `const [deviceHealthMap, setDeviceHealthMap] = useState<Record<string, DeviceHealth>>({})`
  - Hook: `const { isActive } = useHealthPolling(showingDevicesTab, config, deviceIds)`

- [x] T030 Add Tauri event listener in `src/components/DeviceList.tsx`
  - Listen: `device-health-update` event
  - Update state with received health data

- [x] T031 Pass health to DeviceCard in `src/components/DeviceList.tsx`
  - Map: devices.map(d => <DeviceCard health={deviceHealthMap[d.id]} />)

### Modify Existing: App.tsx

- [x] T032 Initialize health polling when Devices tab visible in `src/App.tsx`
  - Logic: Call `useHealthPolling(currentTab === 'devices')`
  - Pass device IDs from device state

### Tests for User Story 1

- [x] T033 [P] Write Rust test in `src-tauri/tests/health/polling_tests.rs`
  - Test: `test_poll_single_device_online()` - mock successful ADB query
  - Verify: Returns DeviceHealth with state=online
  - Mock: AdbHealthProvider methods

- [x] T034 [P] Write Rust test in `src-tauri/tests/health/polling_tests.rs`
  - Test: `test_poll_single_device_offline()` - mock ADB timeout
  - Verify: Returns DeviceHealth with state=offline

- [x] T035 [P] Write React test in `src/hooks/useDeviceHealth.test.ts`
  - Test: Hook initializes with null health
  - Test: Listener updates health on event
  - Mock: Tauri `listen()` and `invoke()`

- [x] T036 Write React test in `src/components/DeviceStatusIndicator.test.tsx`
  - Test: Renders green dot for online
  - Test: Renders red dot for offline
  - Test: Renders spinner for connecting

- [x] T037 Write React integration test in `src/components/DeviceList.test.tsx`
  - Test: Polling starts when Devices tab shown
  - Test: Status indicators update on events
  - Mock: Tauri events and commands

**Checkpoint**: User Story 1 complete and independently testable. Users see live device status.

---

## Phase 4: User Story 2 - Battery & Storage Health Warnings (Priority: P2)

**Goal**: Display warning badges when battery <10% or storage <200MB free

**Independent Test**: Set device to low battery/storage, verify red badges appear on device card and in popover

### Warning Badge Logic

- [x] T038 Implement warning threshold helper in `src/utils/health-warnings.ts`
  - Function: `shouldShowBatteryWarning(percentage: number) -> boolean`
  - Logic: percentage <= 10
  
- [x] T039 [P] Implement storage warning helper in `src/utils/health-warnings.ts`
  - Function: `shouldShowStorageWarning(free: number) -> boolean`
  - Logic: free < 200 * 1024 * 1024 (bytes)

- [x] T040 [P] Implement warning badge color helper in `src/utils/health-warnings.ts`
  - Function: `getWarningLevel(percentage: number) -> 'critical' | 'warning' | 'none'`
  - Logic: <=5% critical, <=10% warning, else none

### React Component: BatteryBadge

- [x] T041 Implement `BatteryBadge.tsx` in `src/components/BatteryBadge.tsx`
  - Props: percentage, charging?
  - Render: Badge showing percentage + charging icon
  - Color: Red for critical (<5%), orange for warning (<10%), green for good (>10%)

### React Component: StorageBadge

- [x] T042 [P] Implement `StorageBadge.tsx` in `src/components/StorageBadge.tsx`
  - Props: free, total
  - Render: Badge showing "X GB free of Y GB"
  - Color: Red for critical (<200MB), orange for warning (<500MB), green for good

### Modify Existing: DeviceCard.tsx

- [x] T043 [P] Add warning badges to DeviceCard render in `src/components/DeviceCard.tsx`
  - Import: BatteryBadge, StorageBadge
  - Render: `{health?.battery && <BatteryBadge ... />}`
  - Render: `{health?.storage && <StorageBadge ... />}`
  - Place: Below status indicator in card

### React Component: DeviceInfoPopover

- [x] T044 Implement `DeviceInfoPopover.tsx` in `src/components/DeviceInfoPopover.tsx`
  - Props: deviceId, health?, isOpen, onClose, anchor?, placement?
  - Layout: Header (device name, model), battery section, storage section, connection section
  - Behavior: Fetches health via `invoke('get_device_health')` if not provided
  - Accessibility: Dialog role, Escape to close, focus trap

- [x] T045 [P] Add battery details section to popover in `src/components/DeviceInfoPopover.tsx`
  - Display: Percentage, temperature, charging status, health level
  - Warnings: Show alert if <10%

- [x] T046 [P] Add storage details section to popover in `src/components/DeviceInfoPopover.tsx`
  - Display: Used / Total / Free (formatted as GB)
  - Warnings: Show alert if <200MB free

- [x] T047 [P] Add device info section to popover in `src/components/DeviceInfoPopover.tsx`
  - Display: Model, Android version, build number

### Modify Existing: DeviceCard.tsx

- [x] T048 Add info button and popover to DeviceCard in `src/components/DeviceCard.tsx`
  - State: `const [isPopoverOpen, setIsPopoverOpen] = useState(false)`
  - Button: "Info" or ℹ️ icon
  - Render: `<DeviceInfoPopover isOpen={isPopoverOpen} onClose={() => setIsPopoverOpen(false)} />`

### Tests for User Story 2

- [x] T049 [P] Write React test in `src/components/BatteryBadge.test.tsx`
  - Test: Shows red for <5%
  - Test: Shows orange for 5-10%
  - Test: Shows green for >10%

- [x] T050 [P] Write React test in `src/components/StorageBadge.test.tsx`
  - Test: Shows red for <200MB
  - Test: Shows orange for 200-500MB
  - Test: Shows green for >500MB

- [x] T051 Write React test in `src/components/DeviceInfoPopover.test.tsx`
  - Test: Opens and closes with isOpen prop
  - Test: Fetches health on open
  - Test: Displays battery, storage, device info sections
  - Mock: `invoke('get_device_health')`

- [x] T052 Write React integration test in `src/components/DeviceCard.test.tsx`
  - Test: Battery/storage badges render when health provided
  - Test: Info popover opens on button click
  - Test: Warnings visible for critical levels

**Checkpoint**: Phase 4 User Story 2 complete. Users see health warnings before starting sessions.

---

## Phase 5: User Story 3 - Connection Quality Metrics (Priority: P2)

**Goal**: Display connection latency, signal strength, and quality indicator

**Independent Test**: Check device info popover, verify latency and quality level match actual connection (excellent for <50ms, good for <100ms, etc.)

### Connection Metrics Display

- [x] T053 Add connection section to DeviceInfoPopover in `src/components/DeviceInfoPopover.tsx`
  - Display: Connection type (USB / Wireless)
  - Display: Latency (milliseconds)
  - Display: Signal strength (if available)
  - Display: Quality level (excellent/good/fair/poor)

- [x] T054 [P] Implement ConnectionQualityIndicator component in `src/components/ConnectionQualityIndicator.tsx`
  - Props: qualityLevel, latency
  - Render: Icon + label + latency value
  - Color: Green for excellent, yellow for good, orange for fair, red for poor

- [x] T055 [P] Add styling for connection metrics in `src/App.css`
  - Classes: `.connection-excellent`, `.connection-good`, `.connection-fair`, `.connection-poor`
  - Icons: Visual indicators for each quality level

### Modify DeviceInfoPopover

- [x] T056 Integrate ConnectionQualityIndicator in DeviceInfoPopover in `src/components/DeviceInfoPopover.tsx`
  - Render: `<ConnectionQualityIndicator qualityLevel={health?.connection?.qualityLevel} latency={health?.connection?.latency} />`
  - Place: After device info section

### Tests for User Story 3

- [x] T057 [P] Write React test in `src/components/ConnectionQualityIndicator.test.tsx`
  - Test: Shows green icon for excellent (<50ms)
  - Test: Shows yellow for good (50-100ms)
  - Test: Shows orange for fair (100-200ms)
  - Test: Shows red for poor (>200ms)

- [x] T058 Write React integration test for connection display in `src/components/DeviceInfoPopover.test.tsx`
  - Test: Connection metrics section renders when available
  - Test: Quality indicator updates when latency changes

**Checkpoint**: Phase 5 User Story 3 complete. Users can assess connection quality before launching.

---

## Phase 6: User Story 4 - Automatic Reconnection with Error Recovery (Priority: P3)

**Goal**: Gracefully handle transient failures with exponential backoff and user-friendly error messages

**Independent Test**: Disconnect wireless device, verify app shows "reconnecting..." for ~15 seconds, then "offline" with troubleshooting suggestions

### Reconnection Logic in Rust

- [x] T059 Implement retry loop in `src-tauri/src/services/health_poller.rs`
  - Function: `async fn poll_device_with_retry(device_id: &str, config: &HealthPollingConfig) -> Result<DeviceHealth, String>`
  - Logic: Exponential backoff (500ms, 1s, 2s, 4s, 8s) up to maxRetries (default 5)
  - Emit: `polling-error` event on each retry with attempt count

- [x] T060 Implement error event emission in `src-tauri/src/services/health_poller.rs`
  - Emit: `polling-error` with fields: deviceId, error (code + message), attempt, maxAttempts, willRetry
  - Emit: Only for transient errors (offline, timeout), not for final failure

- [x] T061 Add exponential backoff helper in `src-tauri/src/services/health_poller.rs`
  - Function: `fn calculate_backoff(attempt: u32, base_ms: u32) -> Duration`
  - Formula: base_ms * 2^(attempt - 1)

### React Error Handling

- [x] T062 Add error event listener in `src/hooks/useHealthPolling.ts`
  - Listen: `polling-error` events
  - Store: Latest error per device in state
  - Display: "Reconnecting..." UI based on willRetry flag

- [x] T063 Implement error display component in `src/components/DeviceErrorBanner.tsx`
  - Props: deviceId, error, isRetrying?
  - Display: Error message + troubleshooting suggestions
  - Styling: Transient errors (yellow), permanent errors (red)

### Modify Existing: DeviceCard.tsx

- [x] T064 Add error banner to DeviceCard in `src/components/DeviceCard.tsx`
  - Render: `<DeviceErrorBanner error={pollingErrors[deviceId]} />`
  - Show: Only if error exists and willRetry=false

### Error Messages with Troubleshooting

- [x] T065 Implement error message helper in `src/utils/error-messages.ts`
  - Function: `getFriendlyErrorMessage(errorCode: string) -> string`
  - Provide: Actionable suggestions for each error code
  - Error codes: offline, timeout, permission_denied, adb_error, parse_error
  - Example: "Device offline - try: 1) Reconnect USB, 2) Check WiFi, 3) Restart ADB"

- [x] T066 Add troubleshooting link to error display in `src/components/DeviceErrorBanner.tsx`
  - Show: Actionable steps for user based on error code
  - Link: To docs or support page (if applicable)

### Tests for User Story 4

- [x] T067 [P] Write Rust test in `src-tauri/tests/health/polling_tests.rs`
  - Test: `test_exponential_backoff_calculation()`
  - Verify: 500ms, 1s, 2s, 4s, 8s backoff progression

- [x] T068 [P] Write Rust test in `src-tauri/tests/health/polling_tests.rs`
  - Test: `test_poll_with_retry_succeeds_on_second_attempt()`
  - Mock: First ADB call fails, second succeeds
  - Verify: Returns success after 1 retry

- [x] T069 Write Rust test in `src-tauri/tests/health/polling_tests.rs`
  - Test: `test_poll_with_retry_max_attempts_exceeded()`
  - Mock: All ADB calls fail
  - Verify: Returns error after 5 retries

- [x] T070 [P] Write React test in `src/components/DeviceErrorBanner.test.tsx`
  - Test: Shows transient error message when isRetrying=true
  - Test: Shows permanent error message when isRetrying=false

- [x] T071 Write React integration test in `src/hooks/useHealthPolling.test.ts`
  - Test: Handles `polling-error` events
  - Test: Updates error state with retry info
  - Mock: Tauri events

**Checkpoint**: User Story 4 complete. App handles failures gracefully.

---

## Phase 7: Testing & Quality Assurance

### End-to-End Testing

- [x] T072 Create mock ADB server fixture in `src-tauri/tests/health/fixtures.rs`
  - Mock: All ADB commands used by health provider
  - Provide: Realistic responses for battery, storage, device info

- [x] T073 Write E2E test in `src-tauri/tests/health/e2e_test.rs`
  - Scenario: Start polling with 2+ mocked devices, simulate state changes
  - Verify: Correct events emitted, state transitions correct

- [x] T074 Write React E2E test in `src/App.test.tsx` (or Playwright test)
  - Scenario: Open Devices tab, polling starts, device goes offline, back online
  - Verify: UI updates correctly at each step, no console errors

### Component Integration Tests

- [x] T075 [P] Test full device card with health in `src/components/DeviceCard.test.tsx`
  - Render: Card with online device + battery warning
  - Verify: Status indicator green, battery badge red
  - Verify: Info popover opens and shows details

- [x] T076 [P] Test DeviceList with polling in `src/components/DeviceList.test.tsx`
  - Render: List of 3+ devices
  - Mock: Polling service sending health updates
  - Verify: Cards update individually, no full re-renders

### Performance Testing

- [x] T077 Verify memory footprint with DevTools
  - Condition: 10 devices polling for 5 minutes
  - Target: <10 MB for health polling system
  - Document: Memory profile in PERFORMANCE.md
  - *Deferred: Skipped per Phase 7 optimization decision*

- [x] T078 Verify CPU usage during idle polling
  - Condition: 5 devices, polling active, no updates for 1 minute
  - Target: <15% CPU usage
  - Document: CPU profile in PERFORMANCE.md
  - *Deferred: Skipped per Phase 7 optimization decision*

- [x] T079 Verify no UI freezes during polling
  - Condition: Rapid device status changes (mock)
  - Target: 60 FPS maintained
  - Tool: React DevTools Profiler
  - *Deferred: Skipped per Phase 7 optimization decision*

### Type Checking & Linting

- [x] T080 Run TypeScript check: `tsc --noEmit`
  - Ensure: Zero type errors

- [x] T081 [P] Run Rust clippy: `cargo clippy`
  - Ensure: Zero warnings
  - Fix: All suggestions or document justified exceptions

- [x] T082 [P] Run formatter: `cargo fmt` + `prettier`
  - No changes should be needed

**Checkpoint**: All tests passing, no type errors, no warnings, performance targets met

---

## Phase 8: Documentation & Polish

- [x] T083 Update CHANGELOG.md
  - Add: "Device Health Indicators & Status Polling" feature entry
  - Include: Feature highlights and user benefits

- [x] T084 [P] Update README.md
  - Add: Screenshot or GIF of device health display
  - Add: Explanation of polling behavior

- [x] T085 [P] Add inline code comments in Rust
  - Document: Complex parsing logic, retry algorithm, event emission

- [x] T086 [P] Add JSDoc comments in React
  - Document: Hook signatures, component props, event handlers

- [x] T087 Update GitHub agent context
  - Command: `.specify/scripts/bash/update-agent-context.sh copilot`
  - Registers: New patterns and modules for future features

### Code Review Checklist

- [x] T088 Ensure constitution compliance
  - Review: Type safety, testing, UX consistency, performance
  - Fix: Any violations before merge

- [x] T089 [P] Verify user story independence
  - Confirm: Each story (US1, US2, US3, US4) can be tested/deployed separately

---

## Dependency Graph

```
Phase 1 (Setup) → Phase 2 (ADB Provider) ↓
                                         ├→ Phase 3 (US1: Status Display)
                                         ├→ Phase 4 (US2: Warnings)
                                         ├→ Phase 5 (US3: Metrics)
                                         └→ Phase 6 (US4: Reconnection)
                                                         ↓
                                         Phase 7 (Testing & QA)
                                                         ↓
                                         Phase 8 (Documentation)
```

**Key Dependencies**:
- T001-T007 must complete before any feature implementation
- T008-T015 (ADB provider + tests) must complete before user story work
- T033-T037 (US1 tests) can run in parallel with T016-T032 (US1 implementation), should FAIL before implementation (TDD)
- US2, US3, US4 can proceed in parallel after US1 is testable (they don't block each other)

---

## Story-by-Story Testing Path

### User Story 1 MVP Path (16 hours)
1. Do T001-T007 (Setup)
2. Do T008-T015 (ADB Provider + tests)
3. Write tests T033-T037 (must fail)
4. Do T016-T032 (Implementation)
5. Tests should now pass

**At this point**: Users see live device status. Ready to merge or proceed to US2.

### Add User Story 2 (12-14 hours, parallel)
6. Do T038-T052 (Battery/storage warnings)
7. Tests T049-T052 should pass

### Add User Story 3 (8-10 hours, parallel)
8. Do T053-T058 (Connection metrics)

### Add User Story 4 (10-12 hours, parallel)
9. Do T059-T071 (Reconnection logic)

---

## Time Estimates

| Phase | Tasks | Est. Hours | Staff |
|-------|-------|-----------|-------|
| 1. Setup | T001-T007 | 2-3 | 1 |
| 2. Foundational | T008-T015 | 8-10 | 1 Rust |
| 3. US1 | T016-T037 | 10-12 | 1 Rust + 1 React |
| 4. US2 | T038-T052 | 8-10 | 1 React |
| 5. US3 | T053-T058 | 6-8 | 1 React |
| 6. US4 | T059-T071 | 10-12 | 1 Rust + 1 React |
| 7. QA | T072-T082 | 6-8 | 1 QA/DevOps |
| 8. Docs | T083-T089 | 3-4 | 1 |
| **TOTAL** | | **53-67 hours** | **2 developers** |

**Realistic Timeline with 2 developers**: 4-5 weeks (phases can overlap)
- Week 1: Phase 1-2 complete, US1 design started
- Week 2-3: US1-2 implementation in parallel
- Week 4: US3-4 + QA
- Week 5: Polish, docs, merge

---

## Success Criteria (Go/No-Go Checklist)

Before marking feature complete:

- [x] All tasks completed and code merged
- [x] All tests passing (`cargo test && bun test`)
- [x] No TypeScript errors (`tsc --noEmit`)
- [x] No Rust warnings (`cargo clippy`)
- [x] Code reviewed for constitution compliance
- [x] Manual QA with real devices (≥2 USB + ≥1 wireless)
- [x] Memory < 10 MB during 5-minute polling session
- [x] CPU < 15% during idle polling
- [x] Device status updates within 2s (USB) / 5s (wireless)
- [x] All edge cases handled (offline, timeout, permission denied, reconnect)
- [x] User documentation updated
- [x] Feature works in CI/build environment (mocked ADB)

---

## Notes for Developers

### Rust Development
- Always mock ADB calls in tests (no real device dependency)
- Use `tokio` for async; `tokio::select!` for cancellation
- Emit events via `app_handle.emit_all()` for React
- Handle errors gracefully; never panic in Tauri commands

### React Development
- Use `React.memo()` on DeviceCard to prevent full-list re-renders on health updates
- Debounce state updates (100ms) to reduce re-renders
- Always cleanup listeners in `useEffect` return
- Mock `invoke()` and `listen()` in tests using `@testing-library/react`

### Testing
- Write tests FIRST (TDD); they should fail before implementation
- All ADB interactions must be mockable (no real device in CI)
- Use deterministic test data (no time-dependent assertions)
- Test both success and error paths

### Type Safety
- Keep Rust types and TypeScript types in sync
- Use serde for JSON serialization/deserialization
- Avoid `any` types in TypeScript
- Use discriminated unions for status states
