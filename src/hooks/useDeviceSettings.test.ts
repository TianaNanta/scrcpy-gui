import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadAllDeviceSettings,
  saveDeviceSettings,
  loadDeviceNames,
  saveDeviceNames,
  loadPresets,
  createPreset,
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

describe("saveDeviceSettings persists to localStorage", () => {
  it("stores device settings via setItem with expected key", () => {
    const allSettings = new Map<string, DeviceSettings>();
    const s = settings({ name: "MyPhone", bitrate: 4000000 });
    saveDeviceSettings("dev-abc", s, allSettings);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "deviceSettings",
      expect.any(String),
    );

    // Verify the stored data is parseable and contains the device
    const storedJson = localStorageMock.setItem.mock.calls.find(
      (c: string[]) => c[0] === "deviceSettings",
    )?.[1];
    const parsed: [string, DeviceSettings][] = JSON.parse(storedJson as string);
    const entry = parsed.find(([key]) => key === "dev-abc");
    expect(entry).toBeTruthy();
    expect(entry![1].name).toBe("MyPhone");
    expect(entry![1].bitrate).toBe(4000000);
  });

  it("preserves existing device settings when adding a new one", () => {
    const existing = settings({ name: "Existing" });
    const allSettings = new Map<string, DeviceSettings>([["dev-1", existing]]);
    const newSettings = settings({ name: "New" });
    const result = saveDeviceSettings("dev-2", newSettings, allSettings);

    expect(result.get("dev-1")?.name).toBe("Existing");
    expect(result.get("dev-2")?.name).toBe("New");
  });
});