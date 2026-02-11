# Tauri Command Contracts: Bug Fixes — UI Theming, Command Execution & Device Management

**Feature**: `003-bug-fixes-ui-devices`  
**Date**: 2026-02-11

## Overview

This document defines the Tauri IPC command contracts between the React frontend and the Rust backend. Changes are marked with `[MODIFIED]` or `[NEW]`.

---

## `list_devices` [MODIFIED]

Returns the merged device list (connected + previously-known disconnected devices) from the persistent registry.

### Invocation
```typescript
const devices: Device[] = await invoke("list_devices");
```

### Behavior (changed)
1. Load persistent device registry from `{app_data_dir}/devices.json`
2. Run `adb devices` to get currently-connected device serials + ADB statuses
3. **Three-way merge**:
   - Devices in ADB output but NOT in registry → add as new entry, fetch props, set `first_seen`
   - Devices in registry but NOT in ADB output → set `status = "disconnected"`, preserve cached metadata
   - Devices in both → update `status` to ADB value, update `last_seen`, re-fetch props only if `status == "device"`
4. Save updated registry to `devices.json`
5. Return the full merged list

### Response Type (changed)
```typescript
interface Device {
  serial: string;
  status: "device" | "offline" | "unauthorized" | "disconnected";
  model: string | null;
  android_version: string | null;
  battery_level: number | null;
  is_wireless: boolean;
  last_seen: string | null;   // NEW — ISO 8601
  first_seen: string;         // NEW — ISO 8601
}
```

### Rust Signature (changed)
```rust
#[tauri::command]
async fn list_devices(app: tauri::AppHandle) -> Result<Vec<DeviceInfo>, String>
```

**Note**: Now accepts `app: tauri::AppHandle` to resolve `app_data_dir()` for registry file access.

### Error Cases
- `adb` not found on PATH → `Err("ADB not found...")`
- `adb devices` exits non-zero → `Err("ADB error: {stderr}")`
- Registry file corrupt → log warning, treat as empty registry, rebuild from ADB output

---

## `start_scrcpy` [MODIFIED]

Starts a scrcpy mirroring session with pre-built command arguments.

### Invocation (changed)
```typescript
await invoke("start_scrcpy", { serial: string, args: string[] });
```

**Before**: Sent a `ScrcpyConfig` object with ~30 typed fields.  
**After**: Sends the device serial and a pre-built args array.

### Behavior (changed)
1. Validate `serial` is non-empty
2. Check if a session is already active for this serial
3. Build `Command::new("scrcpy")` with `.args(&args)` — no arg reconstruction logic
4. Spawn process, store in `ACTIVE_SCRCPY_PROCESSES` map keyed by serial
5. Stream stdout/stderr via `scrcpy-log` events
6. Emit `scrcpy-exit` event when process terminates

### Rust Signature (changed)
```rust
#[tauri::command]
async fn start_scrcpy(
    serial: String,
    args: Vec<String>,
    app: tauri::AppHandle,
) -> Result<(), String>
```

### Error Cases
- Empty serial → `Err("Device serial is required")`
- Session already active for serial → `Err("Mirroring session already active for {serial}")`
- `scrcpy` not found → `Err("scrcpy not found...")`
- Process spawn failure → `Err("Failed to start scrcpy: {error}")`

---

## `forget_device` [NEW]

Permanently removes a device from the persistent registry.

### Invocation
```typescript
await invoke("forget_device", { serial: string });
```

### Behavior
1. Load device registry from `devices.json`
2. Remove entry matching `serial`
3. Save updated registry
4. Return success

### Rust Signature
```rust
#[tauri::command]
async fn forget_device(serial: String, app: tauri::AppHandle) -> Result<(), String>
```

### Error Cases
- Serial not found in registry → `Ok(())` (idempotent, no error)
- Registry file I/O error → `Err("Failed to update device registry: {error}")`

### Frontend Follow-up
After successful `forget_device`, the frontend MUST also:
- Remove the device's settings from `localStorage["deviceSettings"]`
- Remove the device's name from `localStorage["deviceNames"]` (if still using legacy key)
- Remove the device from React state

---

## `stop_scrcpy` [NO CHANGE]

Stops an active mirroring session.

### Invocation
```typescript
await invoke("stop_scrcpy", { serial: string });
```

### Behavior
Unchanged. Kills the scrcpy process for the given serial from the active processes map.

---

## `connect_wireless_device` [NO CHANGE — frontend usage changes]

### Invocation
```typescript
const result: string = await invoke("connect_wireless_device", { ip: string, port: string });
```

### Frontend Changes
- Modal MUST NOT close until the invoke resolves or rejects.
- On success: show success message, then close after 1.5s delay or on user action.
- On error: show error message in modal, remain open for retry.
- Frontend MUST validate IP format before invoking.

---

## `disconnect_wireless_device` [NO CHANGE]

No changes to the command itself. Frontend may need to call `list_devices` after disconnect to trigger the merge (marking the device as "disconnected").

---

## Event Contracts

### `scrcpy-log` [NO CHANGE]
```typescript
interface ScrcpyLogEvent {
  serial: string;
  message: string;
}
```

### `scrcpy-exit` [NO CHANGE]
```typescript
interface ScrcpyExitEvent {
  serial: string;
  code: number | null;
}
```

---

## TypeScript → Rust Type Mapping Summary

| TypeScript | Rust | Notes |
|---|---|---|
| `string` | `String` | |
| `string[]` | `Vec<String>` | New for `start_scrcpy` args |
| `number \| null` | `Option<u32>` | Battery level |
| `string \| null` | `Option<String>` | Model, version, last_seen |
| `"device" \| "offline" \| "unauthorized" \| "disconnected"` | `String` | Serialized as string in Rust; no Rust enum needed for simplicity |

---

## Migration Notes

### Breaking Changes
- `start_scrcpy` signature changes from `ScrcpyConfig` to `(serial, args: Vec<String>)`. Frontend and backend must be updated together.
- `list_devices` now returns additional fields (`last_seen`, `first_seen`). Frontend TypeScript type must be updated.

### Backward Compatibility
- `devices.json` does not exist on first run → treated as empty registry (all devices from ADB are new).
- Existing `localStorage` device settings are unaffected.

### Deprecations
- `ScrcpyConfig` Rust struct → deleted
- `buildInvokeConfig()` TypeScript function → deleted
- `deviceNames` localStorage key → gradually deprecated; name sourced from device settings instead
