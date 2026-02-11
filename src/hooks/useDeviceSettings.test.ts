import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadAllDeviceSettings,
  saveDeviceSettings,
  loadDeviceNames,
  saveDeviceNames,
  loadPresets,
  createPreset,
  buildInvokeConfig,
} from "./useDeviceSettings";
import { DEFAULT_DEVICE_SETTINGS } from "../types/settings";
import type { DeviceSettings } from "../types/settings";

/** Helper to create settings with overrides */
function settings(overrides: Partial<DeviceSettings> = {}): DeviceSettings {
  return { ...DEFAULT_DEVICE_SETTINGS, ...overrides };
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe("loadAllDeviceSettings", () => {
  it("returns empty map when localStorage is empty", () => {
    const result = loadAllDeviceSettings();
    expect(result.size).toBe(0);
  });

  it("loads and migrates saved device settings", () => {
    const entries: [string, Partial<DeviceSettings>][] = [
      ["dev1", { bitrate: 4000000 }],
      ["dev2", { maxFps: 60, keyboardMode: "uhid" }],
    ];
    localStorageMock.setItem("deviceSettings", JSON.stringify(entries));

    const result = loadAllDeviceSettings();
    expect(result.size).toBe(2);

    const dev1 = result.get("dev1")!;
    expect(dev1.bitrate).toBe(4000000);
    expect(dev1.otgMode).toBe(false); // migrated default

    const dev2 = result.get("dev2")!;
    expect(dev2.maxFps).toBe(60);
    expect(dev2.keyboardMode).toBe("uhid");
  });

  it("returns empty map on corrupt JSON", () => {
    localStorageMock.setItem("deviceSettings", "not-json");
    const result = loadAllDeviceSettings();
    expect(result.size).toBe(0);
  });
});

describe("saveDeviceSettings", () => {
  it("saves settings and returns updated map", () => {
    const allSettings = new Map<string, DeviceSettings>();
    const s = settings({ name: "Phone" });
    const result = saveDeviceSettings("dev1", s, allSettings);

    expect(result.get("dev1")).toEqual(s);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "deviceSettings",
      expect.any(String),
    );
  });
});

describe("loadDeviceNames / saveDeviceNames", () => {
  it("returns empty map by default", () => {
    expect(loadDeviceNames().size).toBe(0);
  });

  it("round-trips device names", () => {
    const names = new Map([["dev1", "My Phone"], ["dev2", "Tablet"]]);
    saveDeviceNames(names);

    const loaded = loadDeviceNames();
    expect(loaded.get("dev1")).toBe("My Phone");
    expect(loaded.get("dev2")).toBe("Tablet");
  });
});

describe("loadPresets / savePresetsToStorage", () => {
  it("returns empty array by default", () => {
    expect(loadPresets()).toEqual([]);
  });

  it("round-trips presets with migration", () => {
    const presets = [{ id: "1", name: "Gaming", maxFps: 120 }];
    localStorageMock.setItem("scrcpy-presets", JSON.stringify(presets));

    const loaded = loadPresets();
    expect(loaded.length).toBe(1);
    expect(loaded[0].name).toBe("Gaming");
    expect(loaded[0].maxFps).toBe(120);
    expect(loaded[0].keyboardMode).toBe("default"); // migrated
  });
});

describe("createPreset", () => {
  it("creates preset from settings, stripping recording fields", () => {
    const s = settings({
      name: "Test",
      recordingEnabled: true,
      recordFile: "/tmp/test.mp4",
      recordFormat: "mkv",
    });
    const preset = createPreset("MyPreset", s);

    expect(preset.name).toBe("MyPreset");
    expect(preset.id).toBeTruthy();
    expect("recordingEnabled" in preset).toBe(false);
    expect("recordFile" in preset).toBe(false);
    expect("recordFormat" in preset).toBe(false);
  });
});

describe("buildInvokeConfig", () => {
  it("maps defaults to minimal config", () => {
    const config = buildInvokeConfig("dev1", settings());
    expect(config.serial).toBe("dev1");
    // bitrate 8000000 > 0 → it gets included in config
    expect(config.bitrate).toBe(8000000);
    expect(config.noAudio).toBe(false); // audioForwarding=true, noAudio=false
    expect(config.noVideo).toBe(false);
    expect(config.otgMode).toBe(false);
  });

  it("sends videoSource only when camera", () => {
    const config = buildInvokeConfig("dev1", settings({ videoSource: "display" }));
    expect(config.videoSource).toBeUndefined();

    const config2 = buildInvokeConfig("dev1", settings({ videoSource: "camera", cameraFacing: "back" }));
    expect(config2.videoSource).toBe("camera");
    expect(config2.cameraFacing).toBe("back");
  });

  it("sets noAudio=true when audioForwarding is false", () => {
    const config = buildInvokeConfig("dev1", settings({ audioForwarding: false }));
    expect(config.noAudio).toBe(true);
  });

  it("sends audio codec only when not opus", () => {
    const config1 = buildInvokeConfig("dev1", settings({ audioCodec: "opus" }));
    expect(config1.audioCodec).toBeUndefined();

    const config2 = buildInvokeConfig("dev1", settings({ audioCodec: "aac" }));
    expect(config2.audioCodec).toBe("aac");
  });

  it("sends keyboard/mouse/gamepad only when not default/disabled", () => {
    const config = buildInvokeConfig("dev1", settings());
    expect(config.keyboardMode).toBeUndefined();
    expect(config.mouseMode).toBeUndefined();
    expect(config.gamepadMode).toBeUndefined();

    const config2 = buildInvokeConfig("dev1", settings({
      keyboardMode: "uhid",
      mouseMode: "aoa",
      gamepadMode: "uhid",
    }));
    expect(config2.keyboardMode).toBe("uhid");
    expect(config2.mouseMode).toBe("aoa");
    expect(config2.gamepadMode).toBe("uhid");
  });

  it("builds virtualDisplay string with resolution and DPI", () => {
    const config = buildInvokeConfig("dev1", settings({
      virtualDisplay: true,
      virtualDisplayResolution: "1920x1080",
      virtualDisplayDpi: 320,
    }));
    expect(config.virtualDisplay).toBe("1920x1080/320");
  });

  it("builds virtualDisplay as empty string when no resolution", () => {
    const config = buildInvokeConfig("dev1", settings({ virtualDisplay: true }));
    expect(config.virtualDisplay).toBe("");
  });

  it("does not send virtualDisplay when disabled", () => {
    const config = buildInvokeConfig("dev1", settings({ virtualDisplay: false }));
    expect(config.virtualDisplay).toBeUndefined();
  });

  it("sends recording fields correctly", () => {
    const config = buildInvokeConfig("dev1", settings({
      recordingEnabled: true,
      recordFile: "/tmp/output.mp4",
    }));
    expect(config.record).toBe(true);
    expect(config.recordFile).toBe("/tmp/output.mp4");

    const config2 = buildInvokeConfig("dev1", settings({ recordingEnabled: false }));
    expect(config2.record).toBe(false);
    expect(config2.recordFile).toBeUndefined();
  });

  it("sends v4l2 fields when set", () => {
    const config = buildInvokeConfig("dev1", settings({
      v4l2Sink: "/dev/video2",
      v4l2Buffer: 100,
    }));
    expect(config.v4l2Sink).toBe("/dev/video2");
    expect(config.v4l2Buffer).toBe(100);
  });

  it("sends lockVideoOrientation when >= 0", () => {
    const config = buildInvokeConfig("dev1", settings({ lockVideoOrientation: 0 }));
    expect(config.lockVideoOrientation).toBe(0);

    const config2 = buildInvokeConfig("dev1", settings({ lockVideoOrientation: -1 }));
    expect(config2.lockVideoOrientation).toBeUndefined();
  });
});
