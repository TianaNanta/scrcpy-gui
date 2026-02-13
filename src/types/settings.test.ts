import { describe, it, expect } from "vitest";
import {
  DEFAULT_DEVICE_SETTINGS,
  migrateDeviceSettings,
  migratePreset,
  COLOR_SCHEMES,
} from "./settings";

describe("DEFAULT_DEVICE_SETTINGS", () => {
  it("has the expected number of fields (55)", () => {
    expect(Object.keys(DEFAULT_DEVICE_SETTINGS).length).toBe(55);
  });

  it("has sensible video defaults", () => {
    expect(DEFAULT_DEVICE_SETTINGS.bitrate).toBe(8000000);
    expect(DEFAULT_DEVICE_SETTINGS.maxSize).toBe(0);
    expect(DEFAULT_DEVICE_SETTINGS.maxFps).toBe(0);
    expect(DEFAULT_DEVICE_SETTINGS.videoCodec).toBe("h264");
    expect(DEFAULT_DEVICE_SETTINGS.videoSource).toBe("display");
  });

  it("has audio enabled by default", () => {
    expect(DEFAULT_DEVICE_SETTINGS.audioForwarding).toBe(true);
    expect(DEFAULT_DEVICE_SETTINGS.noAudio).toBe(false);
    expect(DEFAULT_DEVICE_SETTINGS.audioCodec).toBe("opus");
  });

  it("has all new feature fields set to disabled/off", () => {
    expect(DEFAULT_DEVICE_SETTINGS.otgMode).toBe(false);
    expect(DEFAULT_DEVICE_SETTINGS.virtualDisplay).toBe(false);
    expect(DEFAULT_DEVICE_SETTINGS.v4l2Sink).toBe("");
    expect(DEFAULT_DEVICE_SETTINGS.keyboardMode).toBe("default");
    expect(DEFAULT_DEVICE_SETTINGS.mouseMode).toBe("default");
    expect(DEFAULT_DEVICE_SETTINGS.gamepadMode).toBe("disabled");
  });

  it("has lockVideoOrientation set to -1 (unlocked)", () => {
    expect(DEFAULT_DEVICE_SETTINGS.lockVideoOrientation).toBe(-1);
  });
});

describe("migrateDeviceSettings", () => {
  it("returns full defaults when given empty object", () => {
    const result = migrateDeviceSettings({});
    expect(result).toEqual(DEFAULT_DEVICE_SETTINGS);
  });

  it("preserves existing fields and fills missing ones", () => {
    const result = migrateDeviceSettings({ bitrate: 4000000, maxFps: 60 });
    expect(result.bitrate).toBe(4000000);
    expect(result.maxFps).toBe(60);
    expect(result.otgMode).toBe(false); // filled from defaults
    expect(result.keyboardMode).toBe("default"); // filled
  });

  it("preserves all fields when given a complete settings object", () => {
    const custom = { ...DEFAULT_DEVICE_SETTINGS, name: "TestDevice", otgMode: true };
    const result = migrateDeviceSettings(custom);
    expect(result.name).toBe("TestDevice");
    expect(result.otgMode).toBe(true);
  });
});

describe("migratePreset", () => {
  it("fills missing fields with defaults (excluding recording)", () => {
    const result = migratePreset({ id: "1", name: "MyPreset" });
    expect(result.id).toBe("1");
    expect(result.name).toBe("MyPreset");
    expect(result.bitrate).toBe(8000000);
    expect(result.keyboardMode).toBe("default");
    // Recording fields should not appear on Preset
    expect("recordingEnabled" in result).toBe(false);
    expect("recordFile" in result).toBe(false);
  });

  it("preserves existing preset fields", () => {
    const result = migratePreset({
      id: "2",
      name: "Gaming",
      maxFps: 120,
      keyboardMode: "uhid",
    });
    expect(result.maxFps).toBe(120);
    expect(result.keyboardMode).toBe("uhid");
  });
});

describe("COLOR_SCHEMES", () => {
  it("contains at least 3 color schemes", () => {
    expect(COLOR_SCHEMES.length).toBeGreaterThanOrEqual(3);
  });

  it("each scheme has name, primary, and primaryHover", () => {
    for (const scheme of COLOR_SCHEMES) {
      expect(scheme.name).toBeTruthy();
      expect(scheme.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(scheme.primaryHover).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
