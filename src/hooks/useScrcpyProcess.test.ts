import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrcpyProcess, setupScrcpyLogListener } from "./useScrcpyProcess";

// Mock Tauri APIs
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
const mockInvoke = vi.mocked(invoke);
const mockListen = vi.mocked(listen);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useScrcpyProcess", () => {
  describe("initial state", () => {
    it("starts with empty activeDevices and loading=false", () => {
      const { result } = renderHook(() => useScrcpyProcess());
      expect(result.current.activeDevices).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe("startScrcpy", () => {
    it("tests device, starts scrcpy, and adds to activeDevices on success", async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => useScrcpyProcess());
      const addLog = vi.fn();

      const { DEFAULT_DEVICE_SETTINGS } = await import("../types/settings");

      await act(async () => {
        await result.current.startScrcpy("DEVICE1", DEFAULT_DEVICE_SETTINGS, addLog);
      });

      // Should call test_device first, then start_scrcpy
      expect(mockInvoke).toHaveBeenCalledWith("test_device", { serial: "DEVICE1" });
      expect(mockInvoke).toHaveBeenCalledWith("start_scrcpy", expect.objectContaining({
        config: expect.objectContaining({ serial: "DEVICE1" }),
      }));

      expect(result.current.activeDevices).toContain("DEVICE1");
      expect(result.current.loading).toBe(false);

      // Should log test + start messages
      expect(addLog).toHaveBeenCalledWith(expect.stringContaining("Testing device"));
      expect(addLog).toHaveBeenCalledWith(expect.stringContaining("Device test passed"), "SUCCESS");
      expect(addLog).toHaveBeenCalledWith(expect.stringContaining("Scrcpy started"), "SUCCESS");
    });

    it("stops on device test failure and does not start scrcpy", async () => {
      mockInvoke.mockRejectedValueOnce("device not found");

      const { result } = renderHook(() => useScrcpyProcess());
      const addLog = vi.fn();
      const { DEFAULT_DEVICE_SETTINGS } = await import("../types/settings");

      await act(async () => {
        await result.current.startScrcpy("BAD_DEV", DEFAULT_DEVICE_SETTINGS, addLog);
      });

      expect(mockInvoke).toHaveBeenCalledTimes(1); // Only test_device
      expect(result.current.activeDevices).toEqual([]);
      expect(addLog).toHaveBeenCalledWith(expect.stringContaining("Device test failed"), "ERROR");
      expect(result.current.loading).toBe(false);
    });

    it("handles start_scrcpy failure gracefully", async () => {
      mockInvoke
        .mockResolvedValueOnce(undefined) // test_device succeeds
        .mockRejectedValueOnce("scrcpy crash");

      const { result } = renderHook(() => useScrcpyProcess());
      const addLog = vi.fn();
      const { DEFAULT_DEVICE_SETTINGS } = await import("../types/settings");

      await act(async () => {
        await result.current.startScrcpy("DEV1", DEFAULT_DEVICE_SETTINGS, addLog);
      });

      expect(result.current.activeDevices).toEqual([]);
      expect(addLog).toHaveBeenCalledWith(expect.stringContaining("Failed to start scrcpy"), "ERROR");
      expect(result.current.loading).toBe(false);
    });

    it("logs recording message when recording is enabled", async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => useScrcpyProcess());
      const addLog = vi.fn();
      const { DEFAULT_DEVICE_SETTINGS } = await import("../types/settings");

      const settings = {
        ...DEFAULT_DEVICE_SETTINGS,
        recordingEnabled: true,
        recordFile: "/tmp/out.mp4",
      };

      await act(async () => {
        await result.current.startScrcpy("DEV1", settings, addLog);
      });

      expect(addLog).toHaveBeenCalledWith(
        expect.stringContaining("recording enabled"),
        "SUCCESS",
      );
    });
  });

  describe("stopScrcpy", () => {
    it("removes device from activeDevices on success", async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { result } = renderHook(() => useScrcpyProcess());
      const addLog = vi.fn();
      const { DEFAULT_DEVICE_SETTINGS } = await import("../types/settings");

      // Start first
      await act(async () => {
        await result.current.startScrcpy("DEV1", DEFAULT_DEVICE_SETTINGS, addLog);
      });
      expect(result.current.activeDevices).toContain("DEV1");

      // Then stop
      await act(async () => {
        await result.current.stopScrcpy("DEV1", addLog);
      });
      expect(result.current.activeDevices).not.toContain("DEV1");
      expect(addLog).toHaveBeenCalledWith(expect.stringContaining("Scrcpy stopped"), "SUCCESS");
    });

    it("logs error when stop fails", async () => {
      mockInvoke.mockRejectedValueOnce("kill failed");

      const { result } = renderHook(() => useScrcpyProcess());
      const addLog = vi.fn();

      await act(async () => {
        await result.current.stopScrcpy("DEV1", addLog);
      });

      expect(addLog).toHaveBeenCalledWith(expect.stringContaining("Failed to stop scrcpy"), "ERROR");
    });
  });
});

describe("setupScrcpyLogListener", () => {
  it("registers a listener for scrcpy-log events", async () => {
    const unlisten = vi.fn();
    mockListen.mockResolvedValue(unlisten);

    const addLog = vi.fn();
    const cleanup = await setupScrcpyLogListener(addLog);

    expect(mockListen).toHaveBeenCalledWith("scrcpy-log", expect.any(Function));
    expect(cleanup).toBe(unlisten);
  });

  it("formats log entries with serial prefix and detects error level", async () => {
    let eventHandler: (event: { payload: { serial: string; line: string } }) => void = () => {};
    mockListen.mockImplementation(async (_event: unknown, handler: unknown) => {
      eventHandler = handler as typeof eventHandler;
      return () => {};
    });

    const addLog = vi.fn();
    await setupScrcpyLogListener(addLog);

    // Simulate a normal log
    eventHandler({ payload: { serial: "DEV1", line: "INFO: started" } });
    expect(addLog).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "INFO",
        message: "[DEV1] INFO: started",
      }),
    );

    // Simulate an error log
    eventHandler({ payload: { serial: "DEV1", line: "ERROR: connection failed" } });
    expect(addLog).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "ERROR",
        message: "[DEV1] ERROR: connection failed",
      }),
    );
  });
});
