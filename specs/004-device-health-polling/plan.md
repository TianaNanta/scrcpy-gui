# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: Rust 1.75+ (backend), React 18.3+, TypeScript 5.6+ (frontend)  
**Primary Dependencies**: 
- Tauri 2.x (app framework)
- `Command` API for ADB execution (Tauri)  
- `tokio` async runtime for background polling (Rust)
- React hooks (`useState`, `useEffect`, `useCallback`) for state management  
- Heroicons (existing icon library in project)

**Storage**: Local state in React `useState` and Tauri state management; device health data cached in memory per session (not persisted to disk)  
**Testing**: 
- Rust: `cargo test` with mock ADB command output
- React: Vitest (already in project) for component tests  
- Integration tests use mock ADB queries to avoid device dependency

**Target Platform**: Desktop (Windows, macOS, Linux) via Tauri  
**Project Type**: Tauri desktop app with separate frontend (React) and backend (Rust) layers  
**Performance Goals**: 
- Device status updated within 2 seconds of state change (USB) / 5 seconds (wireless)
- No UI thread blocking during ADB polling (all background operations)
- <15% CPU usage during idle polling with 5 connected devices
- <10 MB memory footprint for polling system

**Constraints**: 
- Depends on `adb` binary being installed and available in PATH
- Devices must have USB debugging enabled
- ADB queries must complete within 500ms per device
- No persistent storage between app sessions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Code Quality & Type Safety
- **TypeScript**: Component props MUST use strict interfaces; polling state will use discriminated unions for device status
- **Rust**: Tauri commands for health polling will have full type definitions; zero warnings required
- **IPC contracts**: Device health JSON schema will be defined and validated on both sides

**Status**: ✅ PASS — Strict typing enforced on both layers

### ✅ Testing Standards
- Rust tests: ADB command mocks for battery, storage, signal strength queries
- React tests: Device card components with mocked polling responses
- All ADB interactions must be mockable (dependency injection pattern)
- Tab-level integration tests: device list updates on mock status changes

**Status**: ✅ PASS — Deterministic tests possible with command mocks

### ✅ User Experience Consistency
- Status updates will trigger visual feedback (animated indicators, no freezes)
- Error messages include troubleshooting (e.g., "Check WiFi, restart ADB")
- Respects existing theme system (green/red status colors)
- Keyboard accessible status popover

**Status**: ✅ PASS — No conflicts with existing UX patterns

### ✅ Performance Requirements
- Polling runs on tokio background task (non-blocking Rust)
- React updates debounced (100ms) to prevent excessive re-renders
- Cold start unaffected (polling starts only when device tab viewed)
- No full-tree re-renders; only affected device cards update

**Status**: ✅ PASS — Architecture maintains 3-second startup + responsive UI

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src-tauri/src/
├── commands/
│   ├── device_health.rs          # NEW: Tauri commands for health polling
│   ├── mod.rs                    # Update to export new commands
│   └── ...                       # existing commands
│
├── services/
│   ├── health_poller.rs          # NEW: Core polling logic (async, tokio-based)
│   ├── adb_health_provider.rs    # NEW: ADB command execution for metrics
│   ├── mod.rs                    # Update to export services
│   └── ...                       # existing services
│
└── lib.rs                        # Update to initialize health polling on app startup

src/
├── components/
│   ├── DeviceCard.tsx            # MODIFY: Add health status indicator + warning badges
│   ├── DeviceStatusIndicator.tsx # NEW: Reusable status display component
│   ├── DeviceInfoPopover.tsx     # NEW: Popover with detailed health metrics
│   ├── DeviceList.tsx            # MODIFY: Pass health state to device cards
│   └── ...                       # existing components
│
├── hooks/
│   ├── useDeviceHealth.ts        # NEW: Hook for subscribing to health updates
│   ├── useHealthPolling.ts       # NEW: Hook for managing polling lifecycle
│   └── ...                       # existing hooks
│
├── types/
│   ├── health.ts                 # NEW: TypeScript types for health data
│   ├── device.ts                 # MODIFY: Extend Device type with health fields
│   └── ...                       # existing types
│
└── App.tsx                       # MODIFY: Initialize health polling listener

tests/ (new directory or expanded)
├── rust/
│   ├── health_poller_tests.rs    # Tests for polling logic
│   └── adb_provider_tests.rs     # Tests for ADB command mocks
│
└── react/
    ├── DeviceStatusIndicator.test.tsx
    ├── DeviceInfoPopover.test.tsx
    └── useDeviceHealth.test.ts
```

**Structure Decision**: Expanding existing Tauri structure to add backend health polling service + frontend React components and hooks. No new top-level directories created; changes are additive to current layout.

## Complexity Tracking

**No constitution violations identified.** ✅ PASSED

---

## Phase 0: Research & Unknowns Resolution

### Research Tasks

Before proceeding to design, resolve the following technical questions:

1. **ADB Command Performance Profiling**
   - Measure exact latency of each ADB query: `adb shell dumpsys battery`, `adb shell df`, `adb shell getprop`
   - Determine safe polling intervals that don't saturate ADB server
   - Research: Are there faster alternatives to shell commands (e.g., via logcat, sockets)?

2. **Tauri State Management for Long-Running Tasks**
   - Best practices for tokio background tasks in Tauri 2.x
   - How to safely manage polling lifecycle (start on app init, pause in background, resume on focus)
   - Reference existing `useScrcpyProcess` hook pattern for consistency

3. **React Event Distribution Patterns**
   - Tauri's event system for broadcasting health updates from Rust → React
   - Debouncing/coalescing updates to prevent excessive re-renders
   - Memory efficiency of event listeners for 10+ devices

4. **WiFi Signal Strength on Different Platforms**
   - How to query WiFi signal in Rust on Windows/macOS/Linux (may require platform-specific calls)
   - Fallback if unavailable: use ADB latency as proxy

5. **Error Recovery & ADB Server Restarts**
   - How to detect `adb kill-server` and automatically reconnect
   - Reconnection logic best practices (exponential backoff implementation)

### Output: `research.md`

After completing research, document findings in `/specs/004-device-health-polling/research.md` with:
- Decision made
- Rationale
- Alternatives considered
- Links to reference implementations (if any)

---

## Phase 1: Design & Data Contracts

### 1. Data Model (`data-model.md`)

**Entities:**

```typescript
// Device health state
interface DeviceHealth {
  deviceId: string;
  status: 'online' | 'offline' | 'connecting' | 'error';
  lastSeen: number; // Unix timestamp
  battery?: {
    percentage: number; // 0-100
    temperature?: number; // Celsius
    isCharging?: boolean;
  };
  storage?: {
    used: number; // Bytes
    total: number; // Bytes
    free: number; // Bytes
  };
  connection?: {
    type: 'usb' | 'wireless';
    latency: number; // ms
    signalStrength?: number; // dBm or speed
    qualityLevel: 'excellent' | 'good' | 'fair' | 'poor';
  };
  lastUpdated: number; // Timestamp of last health poll
  staleness?: 'fresh' | 'stale' | 'offline'; // Cache staleness indicator
}

// Polling configuration
interface HealthPollingConfig {
  pollingIntervalUsb: number; // Default 1000ms
  pollingIntervalWireless: number; // Default 3000ms
  offlineThreshold: number; // Default 5000ms
  maxRetries: number; // Default 5
  retryBackoffMs: number; // Default 500ms
  enabled: boolean;
}

// Error recovery state
interface ReconnectionState {
  attempt: number;
  nextRetryAt: number; // Unix timestamp
  lastError?: string;
}
```

### 2. API Contracts (`contracts/tauri-health-commands.md`)

**Tauri Commands:**

```rust
// Rust signature (src-tauri/src/commands/device_health.rs)
#[tauri::command]
async fn start_health_polling(config: HealthPollingConfig) -> Result<(), String>

#[tauri::command]
async fn stop_health_polling() -> Result<(), String>

#[tauri::command]
async fn get_device_health(device_id: String) -> Result<DeviceHealth, String>
```

**Events:**

```typescript
// Emitted from Rust → React (via Tauri event system)
listen('device-health-update', (event: { deviceId: string; health: DeviceHealth }) => {
  // Handle health update
})

listen('polling-error', (event: { deviceId: string; error: string; attempt: number }) => {
  // Handle transient error
})
```

### 3. Component Contracts (`contracts/component-health-contracts.md`)

**New React Components:**

```typescript
// src/components/DeviceStatusIndicator.tsx
interface DeviceStatusIndicatorProps {
  status: DeviceHealth['status'];
  isConnecting?: boolean;
  animate?: boolean;
}

// src/components/DeviceInfoPopover.tsx
interface DeviceInfoPopoverProps {
  deviceId: string;
  health: DeviceHealth;
  isOpen: boolean;
  onClose: () => void;
}

// Modified: DeviceCard.tsx
// Add: health?: DeviceHealth prop
// Add: showWarnings?: boolean prop
```

**Hooks:**

```typescript
// src/hooks/useDeviceHealth.ts
function useDeviceHealth(deviceId: string): {
  health: DeviceHealth | null;
  isPolling: boolean;
  error?: string;
}

// src/hooks/useHealthPolling.ts
function useHealthPolling(enabled: boolean, config?: HealthPollingConfig): {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  isActive: boolean;
}
```

### 4. Quick Start Guide (`quickstart.md`)

**For developers implementing this feature:**

1. **Rust backend (ADB health provider)**
   - Copy `src-tauri/src/services/adb_health_provider.rs` template
   - Implement `get_battery_info(device_id)`, `get_storage_info(device_id)`, etc.
   - Use `std::process::Command` to invoke ADB with timeout handling

2. **Rust polling service**
   - Copy `src-tauri/src/services/health_poller.rs` template
   - Set up tokio task for periodic polling
   - Emit Tauri events on health updates

3. **React hooks**
   - Use `invoke()` from `@tauri-apps/api` to call health polling commands
   - Set up listener for `device-health-update` events
   - Debounce updates with `useCallback` + timer

4. **Test setup**
   - Mock `HealthProvider::get_battery_info()` to return fixed values
   - Mock Tauri event emission for React tests
   - Use `vitest` with `@testing-library/react`

**Key patterns to follow:**
- All ADB calls must have 500ms timeout
- Debounce React state updates to 100ms intervals
- Use discriminated unions for status state
- Emit errors as events; never panic in Tauri commands

---

## Phase 2: Task Breakdown (Next Step)

After Phase 1 design is approved, run `/speckit.tasks` to generate:

- **`tasks.md`**: Detailed task list with dependencies and story points
- Individual atomic tasks for each component/hook/Rust module
- Dependency graph (e.g., ADB provider must complete before polling service)
- Estimated effort (small/medium/large tasks)
- Testing checklist per task

---

## Next Actions

1. ✅ Approve Phase 1 design (this document)
2. ✅ Update Copilot agent context: `.specify/scripts/bash/update-agent-context.sh copilot`
3. Generate tasks: `.specify/tasks 004-device-health-polling`
4. Begin implementation: Start with Rust ADB provider → polling service → React hooks

