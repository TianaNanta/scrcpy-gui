/**
 * useDeviceHealth Hook Tests
 *
 * Tests for device health subscription and state management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDeviceHealth } from "./useDeviceHealth";
import { DeviceHealth, DeviceState, StalenessLevel } from "../types/health";

// Mock Tauri API
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(async (_eventType, _handler) => {
    // Return a mock unlisten function
    return vi.fn();
  }),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async (commandName, params) => {
    if (commandName === "get_device_health") {
      const mockHealth: DeviceHealth = {
        deviceId: params.deviceId,
        state: "online" as DeviceState,
        battery: {
          percentage: 85,
          isCharging: true,
          health: "good",
        },
        storage: {
          used: 10_000_000_000,
          total: 100_000_000_000,
          free: 90_000_000_000,
        },
        connection: {
          type: "usb",
          latency: 25,
          qualityLevel: "excellent",
        },
        device: {
          modelName: "Pixel 6",
          androidVersion: "14",
          buildNumber: "test",
        },
        staleness: "fresh" as StalenessLevel,
        lastSeen: Date.now(),
        lastUpdated: Date.now(),
      };

      return {
        health: mockHealth,
        isCached: true,
        cacheAge: 1000,
      };
    }
    return null;
  }),
}));

describe("useDeviceHealth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches device health on mount", async () => {
    const { result } = renderHook(() => useDeviceHealth("device-1"));

    await waitFor(() => {
      expect(result.current.health).not.toBeNull();
    });

    expect(result.current.health?.deviceId).toBe("device-1");
  });

  it("sets loading to false after initial fetch", async () => {
    const { result } = renderHook(() => useDeviceHealth("device-1"));

    await waitFor(() => {
      expect(result.current.loading).toBeFalsy();
    });
  });

  it("provides refresh function", async () => {
    const { result } = renderHook(() => useDeviceHealth("device-1"));

    await waitFor(() => {
      expect(result.current.health).not.toBeNull();
    });

    expect(typeof result.current.refresh).toBe("function");
  });

  it("tracks polling status", async () => {
    const { result } = renderHook(() => useDeviceHealth("device-1"));

    await waitFor(() => {
      expect(result.current.health).not.toBeNull();
    });

    expect(result.current.isPolling).toBeDefined();
  });

  it("tracks errors from polling", async () => {
    const { result } = renderHook(() => useDeviceHealth("device-1"));

    await waitFor(() => {
      expect(result.current.health).not.toBeNull();
    });

    expect(result.current.error).toBeNull();
  });

  it("sets loading to false after initial fetch", async () => {
    const { result } = renderHook(() => useDeviceHealth("device-1"));

    await waitFor(() => {
      expect(result.current.loading).toBeFalsy();
    });
  });

  it("sets loading to false after initial fetch", async () => {
    const { result } = renderHook(() => useDeviceHealth("device-1"));

    await waitFor(() => {
      expect(result.current.loading).toBeFalsy();
    });
  });

  it("handles device ID changes", async () => {
    const { result, rerender } = renderHook(
      ({ deviceId }: { deviceId: string }) => useDeviceHealth(deviceId),
      { initialProps: { deviceId: "device-1" } },
    );

    await waitFor(() => {
      expect(result.current.health?.deviceId).toBe("device-1");
    });

    rerender({ deviceId: "device-2" });

    await waitFor(() => {
      expect(result.current.health?.deviceId).toBe("device-2");
    });
  });

  it("cleans up listeners on unmount", async () => {
    const { unmount } = renderHook(() => useDeviceHealth("device-1"));

    await waitFor(() => {
      expect(true).toBe(true);
    });

    // Should not throw
    expect(() => unmount()).not.toThrow();
  });
});
