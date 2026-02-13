# Data Model: Device Health System

**Phase**: 1 - Design  
**Date**: 2026-02-13  
**Feature**: Device Health Indicators & Status Polling

---

## 1. Core Entity: DeviceHealth

Represents the complete health state of a single connected device.

```typescript
interface DeviceHealth {
  // Identity & State
  deviceId: string;                    // ADB serial number (unique identifier)
  state: 'online' | 'offline' | 'connecting' | 'error';
  lastSeen: number;                    // Unix timestamp when last confirmed online
  lastUpdated: number;                 // Unix timestamp of last successful poll
  
  // Battery Information
  battery?: {
    percentage: number;                // 0-100, null if unavailable
    temperature?: number;               // Celsius, optional
    isCharging?: boolean;              // true/false/null
    health?: 'good' | 'warm' | 'overheat'; // Phone's reported health
  };
  
  // Storage & Memory
  storage?: {
    used: number;                      // Bytes
    total: number;                     // Bytes
    free: number;                      // Bytes (total - used)
  };
  
  // Connection Metrics
  connection?: {
    type: 'usb' | 'wireless';         // Connection medium
    latency: number;                   // Milliseconds (ping time)
    signalStrength?: number;           // dBm (WiFi) or speed (USB), null if unavailable
    qualityLevel: 'excellent' | 'good' | 'fair' | 'poor';  // Derived from latency + signal
    estimatedBandwidth?: number;       // Mbps (optional, future)
  };
  
  // Device Information
  device?: {
    modelName: string;                 // e.g., "Pixel 6"
    androidVersion: string;            // e.g., "14"
    buildNumber: string;               // e.g., "TP1A.220624.014"
  };
  
  // Cache/Staleness Tracking
  staleness: 'fresh' | 'stale' | 'offline';  // Indicates cache freshness
  errorReason?: string;                // If state === 'error', why (e.g., "offline", "timeout", "permission denied")
}
```

### State Transitions

```
[Not Yet Polled]
    ↓
[connecting] → [online] → [offline] → [connecting] → [online] ...
    ↓               ↓            ↓
[error]  ← ← ← ← ← ← ← ← ← ← ← ← 
```

- **connecting**: Device found but health data not yet fetched
- **online**: Last poll succeeded; data is fresh
- **offline**: Device not responding to ADB queries
- **error**: Unrecoverable error (permission denied, invalid device)

---

## 2. Polling Configuration

Controls behavior of the health polling system.

```typescript
interface HealthPollingConfig {
  // Intervals
  pollingIntervalUsb: number;          // Default 1000ms (1 second)
  pollingIntervalWireless: number;     // Default 3000ms (3 seconds, accounts for WiFi latency)
  
  // Thresholds
  offlineThreshold: number;            // Default 5000ms (mark offline if no response for 5s)
  staleThreshold: number;              // Default 30000ms (mark data stale if >30s old)
  
  // Retry Logic
  maxRetries: number;                  // Default 5; max reconnection attempts
  retryBackoffMs: number;              // Default 500; initial backoff (exponential)
  retryBackoffMultiplier: number;      // Default 2.0; backoff growth rate
  
  // Feature Flags
  enabled: boolean;                    // Global enable/disable for polling
  collectBattery: boolean;             // Default true
  collectStorage: boolean;             // Default true
  collectConnectionMetrics: boolean;   // Default true
  collectDeviceInfo: boolean;          // Default true
  
  // Performance
  batchSize: number;                   // Default 1; poll N devices in parallel (limited to 1 for ADB server single-thread safety)
  queryTimeout: number;                // Default 500ms; timeout for single ADB command
}

// Preset configurations
const POLLING_PRESETS = {
  disabled: { enabled: false },
  minimal: { collectBattery: true, collectStorage: false, pollingIntervalUsb: 5000 },
  normal: { /* defaults */ },
  aggressive: { pollingIntervalUsb: 500, pollingIntervalWireless: 1000 },
};
```

---

## 3. Reconnection State

Tracks retry attempts for devices that have failed.

```typescript
interface ReconnectionState {
  deviceId: string;
  attempt: number;                     // Current attempt (1-N)
  maxAttempts: number;
  nextRetryAt: number;                 // Unix timestamp of next retry
  lastError: {
    code: string;                      // e.g., "offline", "timeout", "permission_denied"
    message: string;                   // Human-readable error
  };
  startedAt: number;                   // When retry sequence started
}
```

---

## 4. Polling Service Internal State

Managed by the Rust `HealthPollingService`.

```rust
struct HealthPollingService {
    // Configuration
    config: RwLock<HealthPollingConfig>,
    
    // Current Health Data
    device_health: RwLock<HashMap<String, DeviceHealth>>,
    
    // Retry Management
    reconnection_states: RwLock<HashMap<String, ReconnectionState>>,
    
    // Control
    enabled: Arc<AtomicBool>,
    shutdown_signal: Arc<Mutex<Option<CancellationToken>>>,
    
    // Event Emission
    app_handle: AppHandle,
    
    // Dependencies
    adb_provider: Arc<AdbHealthProvider>,
}
```

---

## 5. Quality Level Derivation

How `qualityLevel` is computed:

```typescript
function deriveQualityLevel(
  latency: number,
  signalStrength?: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  // Primary factor: latency (milliseconds)
  // Latency thresholds based on real-world mirroring experience:
  // - <50ms: responsive, no perceptible lag
  // - <100ms: good, minor lag in fast interactions
  // - <200ms: fair, noticeable lag in typing/games
  // - >200ms: poor, frustrating lag
  
  if (latency < 50) return 'excellent';
  if (latency < 100) return 'good';
  if (latency < 200) return 'fair';
  return 'poor';
  
  // Secondary factor: WiFi signal (if available)
  // If signal very weak, downgrade one level
  // (future optimization)
}
```

---

## 6. Warning Thresholds

When to display warning badges on device cards:

```typescript
const WARNING_THRESHOLDS = {
  battery: {
    critical: 5,      // >=5% → show red badge
    warning: 10,      // 5-10% → show orange badge
    low: 20,          // 10-20% → show yellow tooltip
  },
  storage: {
    critical: 200,    // <200 MB free → show red badge
    warning: 500,     // 200-500 MB free → show orange tooltip
  },
  connection: {
    poor: 'poor',     // qualityLevel === 'poor' → show warning icon
  },
};
```

---

## 7. Event Payloads

Data emitted from Rust → React via Tauri events.

### Event: `device-health-update`

Fired whenever health data is refreshed for a device.

```typescript
interface DeviceHealthUpdateEvent {
  deviceId: string;
  health: DeviceHealth;
  reason: 'poll' | 'retry' | 'manual_refresh';  // Why this update occurred
  timestamp: number;                            // When emitted (useful for de-duping)
}
```

### Event: `polling-error`

Fired when a poll fails and retry logic is engaged.

```typescript
interface PollingErrorEvent {
  deviceId: string;
  error: {
    code: string;      // e.g., "offline", "timeout", "adb_error"
    message: string;   // Human-readable
  };
  attempt: number;     // Current attempt number
  maxAttempts: number; // Total allowed attempts
  nextRetryAt: number; // Unix timestamp of next retry (null if giving up)
  willRetry: boolean;  // true if more retries coming, false if final failure
}
```

### Event: `polling-started` / `polling-stopped`

Lifecycle events for polling service.

```typescript
interface PollingStartedEvent {
  timestamp: number;
  config: HealthPollingConfig;
}

interface PollingStoppedEvent {
  timestamp: number;
  reason: 'user' | 'app_shutdown' | 'error';
}
```

---

## 8. React Component State Shape

How health state is managed in React components.

```typescript
// In DeviceList.tsx or App.tsx
interface AppHealthState {
  // Map of device ID → its health
  deviceHealthMap: Record<string, DeviceHealth>;
  
  // Track which devices are currently retrying
  retryingDevices: Map<string, ReconnectionState>;
  
  // Polling service status
  pollingEnabled: boolean;
  pollingConfig: HealthPollingConfig;
  
  // Errors and warnings
  pollingErrors: Map<string, PollingErrorEvent>;  // Latest error per device
}

// Per-component hooks (see `contracts/`)
function useDeviceHealth(deviceId: string) {
  // Returns: health, isPolling, error
}
```

---

## 9. Type-Safe Command Serialization

Tauri command arguments and return types (ensure JSON serialization).

```typescript
// Input to Tauri command
interface StartHealthPollingRequest {
  config: HealthPollingConfig;
  devices: Array<{ deviceId: string; connectionType: 'usb' | 'wireless' }>;
}

// Return from Tauri command
interface HealthCommandResult {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

// Output from health query command
interface GetDeviceHealthResponse {
  health: DeviceHealth | null;
  isCached: boolean;
  cacheAge: number;  // Milliseconds since last update
}
```

---

## Validation Rules

### DeviceHealth Entity

- `deviceId`: Non-empty string (ADB serial format: alphanumeric + special chars)
- `state`: One of 4 enum values (strictly enforced in TypeScript)
- `battery.percentage`: 0-100 range (or null/undefined)
- `battery.temperature`: Reasonable range (-20 to 60°C) or null
- `storage.free`: Must be ≤ `storage.total`; both must be ≥ 0
- `connection.latency`: ≥ 0 milliseconds
- `qualityLevel`: Must correspond to latency range (deterministic)

### HealthPollingConfig

- Intervals must be ≥ 100ms (prevent ADB server saturation)
- `maxRetries`: 1-10 range
- `retryBackoffMs`: ≥ 100ms
- `queryTimeout`: ≥ 200ms

---

## Migration Path

If DeviceHealth schema changes in future:

1. Add new field with `?` (optional) to maintain backward compatibility
2. Provide default/fallback value in code
3. Update deserialization to handle missing field gracefully
4. Version the event schema: `device-health-update-v2` (if breaking change)

Current version: **v1** (initial release)
