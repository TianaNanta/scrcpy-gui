import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import App from "./App";

// ─── Mock Tauri APIs ─────────────────────────────────────────────────

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock("@tauri-apps/plugin-os", () => ({
  platform: () => "linux",
}));

vi.mock("./hooks/useScrcpyVersion", () => ({
  useScrcpyVersion: () => ({
    version: { major: 3, minor: 0, patch: 0 },
    loading: false,
    error: null,
    canAudio: true,
    canNoVideo: true,
    canCamera: true,
    canUhidInput: false,
    canGamepad: false,
    canVirtualDisplay: false,
  }),
}));

import { invoke } from "@tauri-apps/api/core";
const mockInvoke = vi.mocked(invoke);

// Mock window.matchMedia for jsdom (used by theme detection)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const TEST_DEVICE = {
  serial: "TEST123",
  model: "TestDevice",
  status: "device",
  is_wireless: false,
  android_version: "14",
  battery_level: 85,
  first_seen: new Date().toISOString(),
  last_seen: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();

  // Default mock responses for App initialization
  mockInvoke.mockImplementation(async (cmd: string) => {
    switch (cmd) {
      case "check_dependencies":
        return { adb: true, scrcpy: true };
      case "list_devices":
        return [TEST_DEVICE];
      case "test_device":
        return undefined;
      case "start_scrcpy":
        return undefined;
      default:
        return undefined;
    }
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("App — modal launch settings override (T060)", () => {
  it("passes currentSettings directly to startScrcpy when launching from modal with camera mode", async () => {
    await act(async () => {
      render(<App />);
    });

    // Wait for App initialization (check_dependencies + list_devices)
    // Device card shows serial as primary text (no deviceName set in this test)
    await waitFor(() => {
      expect(screen.getByText("TEST123")).toBeInTheDocument();
    });

    // Open device settings modal by double-clicking the device card
    const deviceCard = screen.getByRole("button", {
      name: /Configure TestDevice/i,
    });
    await act(async () => {
      fireEvent.doubleClick(deviceCard);
    });

    // Modal should be open — verify "Launch Mirroring" button is visible
    await waitFor(() => {
      expect(screen.getByText("Launch Mirroring")).toBeInTheDocument();
    });

    // Change video source to camera by finding the VideoSourcePanel select
    const videoSourceSelect = screen.getByLabelText(
      /Video Source/i,
    ) as HTMLSelectElement;
    await act(async () => {
      fireEvent.change(videoSourceSelect, { target: { value: "camera" } });
    });

    // Clear previous invoke calls (from init) to isolate the launch call
    mockInvoke.mockClear();
    mockInvoke.mockImplementation(async (cmd: string) => {
      switch (cmd) {
        case "test_device":
          return undefined;
        case "start_scrcpy":
          return undefined;
        case "list_devices":
          return [TEST_DEVICE];
        default:
          return undefined;
      }
    });

    // Click "Launch Mirroring"
    const launchBtn = screen.getByText("Launch Mirroring");
    await act(async () => {
      fireEvent.click(launchBtn);
    });

    // Verify invoke("start_scrcpy") was called with args containing --video-source=camera
    await waitFor(() => {
      const startScrcpyCalls = mockInvoke.mock.calls.filter(
        ([cmd]) => cmd === "start_scrcpy",
      );
      expect(startScrcpyCalls).toHaveLength(1);

      const [, payload] = startScrcpyCalls[0] as [string, { serial: string; args: string[] }];
      expect(payload.serial).toBe("TEST123");
      expect(payload.args).toContain("--video-source=camera");
    });
  });

  it("reads settings from state map when startScrcpy is called without override (DeviceList Mirror button)", async () => {
    await act(async () => {
      render(<App />);
    });

    // Wait for device to appear
    await waitFor(() => {
      expect(screen.getByText("TEST123")).toBeInTheDocument();
    });

    // Clear init invoke calls
    mockInvoke.mockClear();
    mockInvoke.mockImplementation(async (cmd: string) => {
      switch (cmd) {
        case "test_device":
          return undefined;
        case "start_scrcpy":
          return undefined;
        case "list_devices":
          return [TEST_DEVICE];
        default:
          return undefined;
      }
    });

    // Click the "Mirror" button directly (no modal, no settingsOverride)
    const mirrorBtn = screen.getByText("Mirror");
    await act(async () => {
      fireEvent.click(mirrorBtn);
    });

    // Verify invoke("start_scrcpy") was called with default args (no --video-source=camera)
    await waitFor(() => {
      const startScrcpyCalls = mockInvoke.mock.calls.filter(
        ([cmd]) => cmd === "start_scrcpy",
      );
      expect(startScrcpyCalls).toHaveLength(1);

      const [, payload] = startScrcpyCalls[0] as [string, { serial: string; args: string[] }];
      expect(payload.serial).toBe("TEST123");
      // Default videoSource is "display", which means --video-source=camera should NOT be present
      expect(payload.args).not.toContain("--video-source=camera");
    });
  });
});
