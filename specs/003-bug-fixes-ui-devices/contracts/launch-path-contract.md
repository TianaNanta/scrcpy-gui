# Launch Path Contract: Settings Consistency at Launch Time

**Feature**: `003-bug-fixes-ui-devices` (Session 3) | **Date**: 2026-02-12

## Overview

Documents the behavioral contract for how device settings reach `buildArgs()` at launch time, ensuring the executed command always matches the user's current configuration.

---

## `startScrcpy()` — Settings Source

### Contract

`startScrcpy` in `src/App.tsx` MUST accept an optional `settingsOverride` parameter:

```typescript
async function startScrcpy(serial?: string, settingsOverride?: DeviceSettings)
```

### Settings Resolution

| Call Site | `settingsOverride` Provided? | Settings Source | Why |
|---|---|---|---|
| `handleLaunchFromModal` | Yes — `currentSettings` | Parameter directly | Avoids stale React state from batched `setAllDeviceSettings` |
| `DeviceList` onStart | No | `allDeviceSettings.get(serial)` | State is current — no concurrent `setState` in flight |
| `PairDeviceModal` onStartMirroringUsb | No | `allDeviceSettings.get(serial)` | State is current — no concurrent `setState` in flight |

### Implementation

```typescript
async function startScrcpy(serial?: string, settingsOverride?: DeviceSettings) {
  const deviceSerial = serial || selectedDevice;
  if (!deviceSerial) return;
  
  // ... device test ...

  const settings: DeviceSettings = settingsOverride ?? {
    ...DEFAULT_DEVICE_SETTINGS,
    ...allDeviceSettings.get(deviceSerial),
  };
  
  const args = buildArgs(deviceSerial, settings);
  await invoke("start_scrcpy", { serial: deviceSerial, args });
  // ...
}
```

### `handleLaunchFromModal` — Updated

```typescript
const handleLaunchFromModal = useCallback(() => {
  handleSaveSettings(currentSettings);
  startScrcpy(selectedDeviceForSettings, currentSettings);  // ← pass settings directly
  setShowDeviceModal(false);
}, [selectedDeviceForSettings, currentSettings, handleSaveSettings]);
```

---

## Invariant

> The settings object passed to `buildArgs()` MUST always reflect the user's most recent configuration at the moment they clicked "Launch". It MUST NOT read from a React state variable that was updated in the same synchronous block via a batched `setState` call.

## Non-Goals

- This contract does NOT require refactoring to use `useScrcpyProcess` hook (deferred to future cleanup).
- This contract does NOT change the `onStartScrcpy` prop signature passed to child components (`(serial?: string) => void` is unchanged).
