// ─── Enums ───────────────────────────────────────────────────────────────────

export type KeyboardMode = "default" | "sdk" | "uhid" | "aoa";
export type MouseMode = "default" | "sdk" | "uhid" | "aoa" | "disabled";
export type GamepadMode = "disabled" | "uhid" | "aoa";
export type VideoSource = "display" | "camera";
export type CameraFacing = "front" | "back" | "external";

// ─── Device Settings (52 fields) ────────────────────────────────────────────

export interface DeviceSettings {
  // Identity
  name: string;

  // Video
  bitrate: number;
  maxSize: number;
  maxFps: number;
  videoCodec: string;
  videoEncoder: string;
  videoBuffer: number;

  // Video Source (NEW)
  videoSource: VideoSource;
  cameraFacing: CameraFacing;
  cameraSize: string;
  cameraId: string;

  // Audio
  audioForwarding: boolean;
  audioBitrate: number;
  audioCodec: string;
  microphoneForwarding: boolean;
  noAudio: boolean;

  // Video toggles
  noVideo: boolean;
  noPlayback: boolean;

  // Display
  displayId: number;
  rotation: number;
  crop: string;
  lockVideoOrientation: number;
  displayBuffer: number;

  // Window
  windowX: number;
  windowY: number;
  windowWidth: number;
  windowHeight: number;
  alwaysOnTop: boolean;
  windowBorderless: boolean;
  fullscreen: boolean;
  windowTitle: string;

  // Behavior
  noControl: boolean;
  turnScreenOff: boolean;
  stayAwake: boolean;
  showTouches: boolean;
  powerOffOnClose: boolean;
  noPowerOn: boolean;

  // Recording
  recordingEnabled: boolean;
  recordFile: string;
  recordFormat: "mp4" | "mkv";

  // Input Modes (NEW)
  keyboardMode: KeyboardMode;
  mouseMode: MouseMode;
  gamepadMode: GamepadMode;

  // V4L2 (NEW)
  v4l2Sink: string;
  v4l2Buffer: number;

  // Virtual Display (NEW)
  virtualDisplay: boolean;
  virtualDisplayResolution: string;
  virtualDisplayDpi: number;
  startApp: string;

  // OTG (NEW)
  otgMode: boolean;

  // Network
  noCleanup: boolean;
  forceAdbForward: boolean;
  timeLimit: number;

  // Wireless Connection
  ipAddress: string;
  port: number;
}

/** Default values for all DeviceSettings fields */
export const DEFAULT_DEVICE_SETTINGS: DeviceSettings = {
  name: "",
  bitrate: 8000000,
  maxSize: 0,
  maxFps: 0,
  videoCodec: "h264",
  videoEncoder: "",
  videoBuffer: 0,
  videoSource: "display",
  cameraFacing: "front",
  cameraSize: "",
  cameraId: "",
  audioForwarding: true,
  audioBitrate: 128000,
  audioCodec: "opus",
  microphoneForwarding: false,
  noAudio: false,
  noVideo: false,
  noPlayback: false,
  displayId: 0,
  rotation: 0,
  crop: "",
  lockVideoOrientation: -1,
  displayBuffer: 0,
  windowX: 0,
  windowY: 0,
  windowWidth: 0,
  windowHeight: 0,
  alwaysOnTop: false,
  windowBorderless: false,
  fullscreen: false,
  windowTitle: "",
  noControl: false,
  turnScreenOff: false,
  stayAwake: false,
  showTouches: false,
  powerOffOnClose: false,
  noPowerOn: false,
  recordingEnabled: false,
  recordFile: "",
  recordFormat: "mp4",
  keyboardMode: "default",
  mouseMode: "default",
  gamepadMode: "disabled",
  v4l2Sink: "",
  v4l2Buffer: 0,
  virtualDisplay: false,
  virtualDisplayResolution: "",
  virtualDisplayDpi: 0,
  startApp: "",
  otgMode: false,
  noCleanup: false,
  forceAdbForward: false,
  timeLimit: 0,
  ipAddress: "",
  port: 5555,
};

// ─── Preset ─────────────────────────────────────────────────────────────────

/**
 * Preset omits session-specific fields (recording).
 * Has an `id` for identification.
 */
export interface Preset extends Omit<
  DeviceSettings,
  "recordingEnabled" | "recordFile" | "recordFormat"
> {
  id: string;
}

/** Apply defaults for new fields when loading old presets from localStorage */
export function migratePreset(
  raw: Partial<Preset> & { id: string; name: string },
): Preset {
  const {
    recordingEnabled: _re,
    recordFile: _rf,
    recordFormat: _rfmt,
    ...defaults
  } = DEFAULT_DEVICE_SETTINGS;
  return { ...defaults, ...raw } as Preset;
}

/** Apply defaults for new fields when loading old device settings from localStorage */
export function migrateDeviceSettings(
  raw: Partial<DeviceSettings>,
): DeviceSettings {
  return { ...DEFAULT_DEVICE_SETTINGS, ...raw };
}

// ─── Color Scheme ───────────────────────────────────────────────────────────

export interface ColorScheme {
  name: string;
  primary: string;
  primaryHover: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  { name: "Blue", primary: "#3b82f6", primaryHover: "#2563eb" },
  { name: "Green", primary: "#10b981", primaryHover: "#059669" },
  { name: "Purple", primary: "#8b5cf6", primaryHover: "#7c3aed" },
  { name: "Red", primary: "#ef4444", primaryHover: "#dc2626" },
  { name: "Orange", primary: "#f97316", primaryHover: "#ea580c" },
];

// ─── Log ────────────────────────────────────────────────────────────────────

export type LogLevel = "INFO" | "ERROR" | "WARN" | "SUCCESS" | "DEBUG";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

export type Tab = "devices" | "presets" | "logs" | "settings";
export type Theme = "light" | "dark" | "system";
