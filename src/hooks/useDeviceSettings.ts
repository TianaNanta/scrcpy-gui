import { useMemo } from "react";
import {
  type DeviceSettings,
  type Preset,
  DEFAULT_DEVICE_SETTINGS,
  migrateDeviceSettings,
  migratePreset,
} from "../types/settings";

const DEVICE_SETTINGS_KEY = "deviceSettings";
const PRESETS_KEY = "scrcpy-presets";
const DEVICE_NAMES_KEY = "deviceNames";

// ─── Device Settings ────────────────────────────────────────────────────────

/** Load settings for a device serial, applying migration defaults for new fields */
export function loadDeviceSettings(
  serial: string,
  allSettings: Map<string, DeviceSettings>,
  deviceNames?: Map<string, string>,
): DeviceSettings {
  const raw = allSettings.get(serial);
  const migrated = migrateDeviceSettings(raw ?? {});
  // Apply stored device name if available (backward compat for pre-migration callers)
  if (!migrated.name && deviceNames?.has(serial)) {
    migrated.name = deviceNames.get(serial) ?? "";
  }
  return migrated;
}

/** Save settings for a single device */
export function saveDeviceSettings(
  serial: string,
  settings: DeviceSettings,
  allSettings: Map<string, DeviceSettings>,
): Map<string, DeviceSettings> {
  const updated = new Map(allSettings);
  updated.set(serial, settings);
  localStorage.setItem(
    DEVICE_SETTINGS_KEY,
    JSON.stringify(Array.from(updated.entries())),
  );
  return updated;
}

/** Load all device settings from localStorage */
export function loadAllDeviceSettings(): Map<string, DeviceSettings> {
  const saved = localStorage.getItem(DEVICE_SETTINGS_KEY);
  if (saved) {
    try {
      const entries: [string, Partial<DeviceSettings>][] = JSON.parse(saved);
      const migrated = entries.map(
        ([serial, raw]) =>
          [serial, migrateDeviceSettings(raw)] as [string, DeviceSettings],
      );
      return new Map(migrated);
    } catch {
      return new Map();
    }
  }
  return new Map();
}

/** Load device names from localStorage (deprecated — use migrateDeviceNamesToSettings instead) */
export function loadDeviceNames(): Map<string, string> {
  const saved = localStorage.getItem(DEVICE_NAMES_KEY);
  if (saved) {
    try {
      return new Map(JSON.parse(saved));
    } catch {
      return new Map();
    }
  }
  return new Map();
}

/** Save device names to localStorage (deprecated — names are now stored in deviceSettings) */
export function saveDeviceNames(names: Map<string, string>): void {
  localStorage.setItem(
    DEVICE_NAMES_KEY,
    JSON.stringify(Array.from(names.entries())),
  );
}

/**
 * One-time migration: reads old `deviceNames` localStorage entries,
 * merges them into `deviceSettings` as `.name` fields, then removes
 * the old `deviceNames` key. Returns the migrated settings map.
 */
export function migrateDeviceNamesToSettings(
  allSettings: Map<string, DeviceSettings>,
): Map<string, DeviceSettings> {
  const namesRaw = localStorage.getItem(DEVICE_NAMES_KEY);
  if (!namesRaw) return allSettings;

  let names: Map<string, string>;
  try {
    names = new Map(JSON.parse(namesRaw));
  } catch {
    // Corrupted — just remove the key
    localStorage.removeItem(DEVICE_NAMES_KEY);
    return allSettings;
  }

  if (names.size === 0) {
    localStorage.removeItem(DEVICE_NAMES_KEY);
    return allSettings;
  }

  const updated = new Map(allSettings);
  for (const [serial, name] of names) {
    const existing = updated.get(serial);
    if (existing) {
      if (!existing.name) {
        updated.set(serial, { ...existing, name });
      }
    } else {
      updated.set(serial, migrateDeviceSettings({ name }));
    }
  }

  // Persist merged settings and remove the old key
  localStorage.setItem(
    DEVICE_SETTINGS_KEY,
    JSON.stringify(Array.from(updated.entries())),
  );
  localStorage.removeItem(DEVICE_NAMES_KEY);
  return updated;
}

/** Derive a deviceNames map from allDeviceSettings for backward compatibility */
export function deriveDeviceNames(
  allSettings: Map<string, DeviceSettings>,
): Map<string, string> {
  const names = new Map<string, string>();
  for (const [serial, settings] of allSettings) {
    if (settings.name) {
      names.set(serial, settings.name);
    }
  }
  return names;
}

// ─── Presets ────────────────────────────────────────────────────────────────

/** Load presets from localStorage with migration */
export function loadPresets(): Preset[] {
  const saved = localStorage.getItem(PRESETS_KEY);
  if (saved) {
    try {
      const raw: Array<Partial<Preset> & { id: string; name: string }> =
        JSON.parse(saved);
      return raw.map(migratePreset);
    } catch {
      return [];
    }
  }
  return [];
}

/** Save presets to localStorage */
export function savePresetsToStorage(presets: Preset[]): void {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

/** Create a new preset from current settings */
export function createPreset(name: string, settings: DeviceSettings): Preset {
  const {
    recordingEnabled: _re,
    recordFile: _rf,
    recordFormat: _rfmt,
    ...rest
  } = settings;
  return {
    ...rest,
    id: Date.now().toString(),
    name,
  };
}

// ─── Hook for convenience ───────────────────────────────────────────────────

export function useDeviceSettingsDefaults() {
  return useMemo(() => DEFAULT_DEVICE_SETTINGS, []);
}
