/** Device information returned from ADB */
export interface Device {
  serial: string;
  status: string;
  model?: string;
  android_version?: string;
  battery_level?: number;
  is_wireless: boolean;
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
