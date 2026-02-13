# Tauri Commands Contract: Device Health Polling

**Feature**: Device Health Indicators & Status Polling  
**Date**: 2026-02-13  
**Interface**: IPC between React (TypeScript) and Rust

---

## Command: `start_health_polling`

**Purpose**: Initialize and start the background health polling service for all connected devices.

### Rust Signature

```rust
#[tauri::command]
async fn start_health_polling(
    config: HealthPollingConfig,
    device_ids: Vec<String>,  // List of device IDs to poll
) -> Result<(), String>
```

### TypeScript Invoke

```typescript
import { invoke } from '@tauri-apps/api/core';
import type { HealthPollingConfig } from '@/types/health';

const result = await invoke<void>(
  'start_health_polling',
  {
    config: { 
      pollingIntervalUsb: 1000,
      pollingIntervalWireless: 3000,
      offlineThreshold: 5000,
      maxRetries: 5,
      retryBackoffMs: 500,
      enabled: true,
      collectBattery: true,
      collectStorage: true,
      collectConnectionMetrics: true,
      collectDeviceInfo: true,
    },
    device_ids: ['emulator-5554', 'device-serial-123'],
  }
);
```

### Success Response

- Returns `Ok(())` without value
- Rust service spawns tokio task in background
- Polling begins immediately; first results arrive via `device-health-update` events

### Error Responses

```rust
Err("polling already running")
Err("invalid device ID: emulator-5554")
Err("failed to spawn polling task: ...")
Err("configuration invalid: pollingIntervalUsb must be >= 100ms")
```

---

## Command: `stop_health_polling`

**Purpose**: Stop the background health polling service gracefully.

### Rust Signature

```rust
#[tauri::command]
async fn stop_health_polling() -> Result<(), String>
```

### TypeScript Invoke

```typescript
await invoke<void>('stop_health_polling');
```

### Success Response

- Returns `Ok(())`
- Cancels all pending ADB queries
- Emits `polling-stopped` event with reason `'user'`

### Error Responses

```rust
Err("polling not running")
Err("failed to stop polling: timeout")
```

---

## Command: `get_device_health`

**Purpose**: Manually fetch health data for a single device (useful for forced refresh).

### Rust Signature

```rust
#[tauri::command]
async fn get_device_health(
    device_id: String,
) -> Result<GetDeviceHealthResponse, String>
```

### TypeScript Invoke

```typescript
import type { DeviceHealth, GetDeviceHealthResponse } from '@/types/health';

const response = await invoke<GetDeviceHealthResponse>(
  'get_device_health',
  { device_id: 'emulator-5554' }
);

console.log(response.health);        // DeviceHealth or null
console.log(response.isCached);      // boolean
console.log(response.cacheAge);      // number (milliseconds)
```

### Success Response

```typescript
{
  health: {
    deviceId: 'emulator-5554',
    state: 'online',
    lastSeen: 1708951234567,
    lastUpdated: 1708951234567,
    battery: {
      percentage: 85,
      temperature: 32,
      isCharging: true,
      health: 'good'
    },
    storage: {
      used: 52428800,     // 50 GB
      total: 107374182400, // 100 GB
      free: 54945382400   // 50 GB
    },
    connection: {
      type: 'usb',
      latency: 23,
      signalStrength: null,
      qualityLevel: 'excellent'
    },
    device: {
      modelName: 'Pixel 6',
      androidVersion: '14',
      buildNumber: 'TP1A.220624.014'
    },
    staleness: 'fresh',
    errorReason: null
  },
  isCached: false,     // Fresh query (not from cache)
  cacheAge: 0
}
```

### Error Responses

```rust
Err("device not found: invalid-id")
Err("device offline: emulator-5554")
Err("permission denied: enable USB debugging")
Err("query timeout: exceeded 500ms")
Err("failed to parse ADB response")
```

---

## Command: `set_polling_config`

**Purpose**: Update polling configuration at runtime without restarting the service.

### Rust Signature

```rust
#[tauri::command]
async fn set_polling_config(
    config: HealthPollingConfig,
) -> Result<(), String>
```

### TypeScript Invoke

```typescript
await invoke<void>(
  'set_polling_config',
  {
    config: {
      pollingIntervalUsb: 500,  // More aggressive polling
      pollingIntervalWireless: 2000,
      // ... other fields from HealthPollingConfig
    }
  }
);
```

### Validation

- New intervals must be >= 100ms
- Existing polling state preserved
- New intervals apply to next polling cycle

---

## Event: `device-health-update`

**Emitted from**: Rust polling service  
**Received in**: React components via `listen()`

### TypeScript Handler

```typescript
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { DeviceHealthUpdateEvent } from '@/types/health';

const unsubscribe = await listen<DeviceHealthUpdateEvent>(
  'device-health-update',
  (event) => {
    console.log(`Device ${event.payload.deviceId} health updated:`, event.payload.health);
    
    // Update React state
    setDeviceHealth(prev => ({
      ...prev,
      [event.payload.deviceId]: event.payload.health
    }));
  }
);

// Later: cleanup
// unsubscribe();
```

### Event Payload Schema

```typescript
interface DeviceHealthUpdateEvent {
  deviceId: string;
  health: DeviceHealth;  // Full health object (see data-model.md)
  reason: 'poll' | 'retry' | 'manual_refresh';
  timestamp: number;     // Unix ms
}
```

### Emission Frequency

- Initial: Within 100ms of `start_health_polling` (per device)
- Polling: Every `pollingIntervalUsb` (USB) or `pollingIntervalWireless` (wireless) milliseconds
- Retries: Per backoff schedule (500ms, 1s, 2s, etc.)
- Max events: ~1/second per device at minimum polling interval

---

## Event: `polling-error`

**Emitted from**: Rust polling service  
**Received in**: React components (info UI, retry state)

### TypeScript Handler

```typescript
import { listen } from '@tauri-apps/api/event';
import type { PollingErrorEvent } from '@/types/health';

const unsubscribe = await listen<PollingErrorEvent>(
  'polling-error',
  (event) => {
    if (event.payload.willRetry) {
      console.log(`Device ${event.payload.deviceId} failed, retrying...`);
      // Show transient "reconnecting..." indicator
    } else {
      console.error(`Device ${event.payload.deviceId} failed permanently:`, event.payload.error.message);
      // Show persistent error to user
    }
  }
);
```

### Event Payload Schema

```typescript
interface PollingErrorEvent {
  deviceId: string;
  error: {
    code: string;  // 'offline', 'timeout', 'permission_denied', 'adb_error'
    message: string;
  };
  attempt: number;
  maxAttempts: number;
  nextRetryAt: number | null;
  willRetry: boolean;
  timestamp: number;
}
```

### Error Codes

- **`offline`**: Device marked offline (no response after `offlineThreshold`)
- **`timeout`**: ADB query exceeded 500ms timeout
- **`permission_denied`**: USB debugging not enabled or ADB permission missing
- **`invalid_device`**: Device ID not recognized by ADB
- **`adb_error`**: Unexpected ADB command error
- **`parse_error`**: Failed to parse ADB response

---

## Event: `polling-started` / `polling-stopped`

**Lifecycle events** for when polling service starts/stops.

### TypeScript Handlers

```typescript
await listen<PollingStartedEvent>('polling-started', (event) => {
  console.log('Health polling started with config:', event.payload.config);
});

await listen<PollingStoppedEvent>('polling-stopped', (event) => {
  console.log('Health polling stopped:', event.payload.reason);
});
```

### Payload Schemas

```typescript
interface PollingStartedEvent {
  timestamp: number;
  config: HealthPollingConfig;
}

interface PollingStoppedEvent {
  timestamp: number;
  reason: 'user' | 'app_shutdown' | 'critical_error';
}
```

---

## Security & Validation

### Input Validation

**All commands must validate inputs:**
- Device IDs: Match ADB serial format (alphanumeric + hyphens/colons)
- Polling intervals: ≥ 100ms, ≤ 60000ms
- Configuration: All required fields present

### Error Messages

- **User-facing**: Friendly, actionable (e.g., "Enable USB debugging on device")
- **Logs**: Full error details for debugging

### Permissions

- No special Tauri permissions required (ADB querying is local)
- Assumes `adb` binary available in PATH

---

## Backward Compatibility

**Version**: 1.0

If future changes are needed:
- Add new optional fields to `HealthPollingConfig` (don't remove existing ones)
- New events can be emitted alongside old ones (e.g., v1 + v2 events)
- Clients must handle unknown event types gracefully (ignore)

---

## Example: Full Integration in React

```typescript
import { invoke, listen } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

function DeviceListWithHealth() {
  const [deviceHealth, setDeviceHealth] = useState<Record<string, DeviceHealth>>({});
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    const initializePolling = async () => {
      // Start polling
      await invoke('start_health_polling', {
        config: { /* defaults */ },
        device_ids: ['emulator-5554', 'device-serial-123']
      });
      setIsPolling(true);

      // Listen for updates
      const unsubUpdate = await listen('device-health-update', (event: any) => {
        setDeviceHealth(prev => ({
          ...prev,
          [event.payload.deviceId]: event.payload.health
        }));
      });

      const unsubError = await listen('polling-error', (event: any) => {
        console.warn(`${event.payload.deviceId}: ${event.payload.error.message}`);
      });

      return () => {
        unsubUpdate();
        unsubError();
      };
    };

    const cleanup = initializePolling();
    return cleanup;
  }, []);

  return (
    <>
      {Object.entries(deviceHealth).map(([deviceId, health]) => (
        <DeviceCard key={deviceId} deviceId={deviceId} health={health} />
      ))}
    </>
  );
}
```
