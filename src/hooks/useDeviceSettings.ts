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
  deviceNames: Map<string, string>,
): DeviceSettings {
  const raw = allSettings.get(serial);
  const migrated = migrateDeviceSettings(raw ?? {});
  // Apply stored device name if available
  if (!migrated.name && deviceNames.has(serial)) {
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
        ([serial, raw]) => [serial, migrateDeviceSettings(raw)] as [string, DeviceSettings],
      );
      return new Map(migrated);
    } catch {
      return new Map();
    }
  }
  return new Map();
}

/** Load device names from localStorage */
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

/** Save device names to localStorage */
export function saveDeviceNames(names: Map<string, string>): void {
  localStorage.setItem(DEVICE_NAMES_KEY, JSON.stringify(Array.from(names.entries())));
}

// ─── Presets ────────────────────────────────────────────────────────────────

/** Load presets from localStorage with migration */
export function loadPresets(): Preset[] {
  const saved = localStorage.getItem(PRESETS_KEY);
  if (saved) {
    try {
      const raw: Array<Partial<Preset> & { id: string; name: string }> = JSON.parse(saved);
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
  const { recordingEnabled: _re, recordFile: _rf, recordFormat: _rfmt, ...rest } = settings;
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

/**
 * Build a ScrcpyConfig object matching the Rust ScrcpyConfig struct,
 * ready to be passed to invoke("start_scrcpy", { config }).
 */
export function buildInvokeConfig(serial: string, settings: DeviceSettings) {
  return {
    serial,
    bitrate: settings.bitrate > 0 ? settings.bitrate : undefined,
    maxSize: settings.maxSize > 0 ? settings.maxSize : undefined,
    maxFps: settings.maxFps > 0 ? settings.maxFps : undefined,
    videoCodec: settings.videoCodec !== "h264" ? settings.videoCodec : undefined,
    videoEncoder: settings.videoEncoder || undefined,
    videoBuffer: settings.videoBuffer > 0 ? settings.videoBuffer : undefined,
    videoSource: settings.videoSource !== "display" ? settings.videoSource : undefined,
    cameraFacing: settings.videoSource === "camera" ? settings.cameraFacing : undefined,
    cameraSize: settings.videoSource === "camera" && settings.cameraSize ? settings.cameraSize : undefined,
    cameraId: settings.videoSource === "camera" && settings.cameraId ? settings.cameraId : undefined,
    noAudio: settings.noAudio || !settings.audioForwarding,
    audioForwarding: settings.audioForwarding,
    audioBitrate: settings.audioForwarding && settings.audioBitrate > 0 ? settings.audioBitrate : undefined,
    audioCodec: settings.audioForwarding && settings.audioCodec !== "opus" ? settings.audioCodec : undefined,
    microphoneForwarding: settings.microphoneForwarding,
    noVideo: settings.noVideo,
    noPlayback: settings.noPlayback,
    displayId: settings.displayId > 0 ? settings.displayId : undefined,
    rotation: settings.rotation > 0 ? settings.rotation : undefined,
    crop: settings.crop || undefined,
    lockVideoOrientation: settings.lockVideoOrientation >= 0 ? settings.lockVideoOrientation : undefined,
    displayBuffer: settings.displayBuffer > 0 ? settings.displayBuffer : undefined,
    windowX: settings.windowX > 0 ? settings.windowX : undefined,
    windowY: settings.windowY > 0 ? settings.windowY : undefined,
    windowWidth: settings.windowWidth > 0 ? settings.windowWidth : undefined,
    windowHeight: settings.windowHeight > 0 ? settings.windowHeight : undefined,
    alwaysOnTop: settings.alwaysOnTop,
    windowBorderless: settings.windowBorderless,
    fullscreen: settings.fullscreen,
    windowTitle: settings.windowTitle || undefined,
    noControl: settings.noControl,
    turnScreenOff: settings.turnScreenOff,
    stayAwake: settings.stayAwake,
    showTouches: settings.showTouches,
    powerOffOnClose: settings.powerOffOnClose,
    noPowerOn: settings.noPowerOn,
    record: settings.recordingEnabled,
    recordFile: settings.recordingEnabled ? settings.recordFile || undefined : undefined,
    keyboardMode: settings.keyboardMode !== "default" ? settings.keyboardMode : undefined,
    mouseMode: settings.mouseMode !== "default" ? settings.mouseMode : undefined,
    gamepadMode: settings.gamepadMode !== "disabled" ? settings.gamepadMode : undefined,
    v4l2Sink: settings.v4l2Sink || undefined,
    v4l2Buffer: settings.v4l2Buffer > 0 ? settings.v4l2Buffer : undefined,
    virtualDisplay: settings.virtualDisplay
      ? settings.virtualDisplayResolution
        ? settings.virtualDisplayDpi > 0
          ? `${settings.virtualDisplayResolution}/${settings.virtualDisplayDpi}`
          : settings.virtualDisplayResolution
        : ""
      : undefined,
    startApp: settings.virtualDisplay && settings.startApp ? settings.startApp : undefined,
    otgMode: settings.otgMode,
    noCleanup: settings.noCleanup,
    forceAdbForward: settings.forceAdbForward,
    timeLimit: settings.timeLimit > 0 ? settings.timeLimit : undefined,
  };
}
