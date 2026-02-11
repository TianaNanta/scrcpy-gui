/** Connection status as reported by ADB or synthesized by the app */
export type DeviceStatus = "device" | "offline" | "unauthorized" | "disconnected";

/** Device information returned from the persistent registry */
export interface Device {
  serial: string;
  status: DeviceStatus;
  model: string | null;
  android_version: string | null;
  battery_level: number | null;
  is_wireless: boolean;
  last_seen: string | null;
  first_seen: string;
}

/** Device health information */
export interface DeviceHealth {
  battery_level?: number;
}

/** ADB/scrcpy dependency status */
export interface Dependencies {
  adb: boolean;
  scrcpy: boolean;
}
