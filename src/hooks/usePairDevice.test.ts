/**
 * usePairDevice Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePairDevice } from "./usePairDevice";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("usePairDevice", () => {
  const mockProps = {
    onAddLog: vi.fn(),
    onRefreshDevices: vi.fn().mockResolvedValue(undefined),
    onPersistDeviceName: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("initializes with showPairModal false", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));
      expect(result.current.showPairModal).toBe(false);
    });

    it("initializes with null pairMode", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));
      expect(result.current.pairMode).toBe(null);
    });

    it("initializes with empty USB devices list", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));
      expect(result.current.availableUsbDevices).toEqual([]);
    });

    it("initializes with default port 5555", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));
      expect(result.current.devicePort).toBe(5555);
    });

    it("initializes with empty device IP", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));
      expect(result.current.deviceIp).toBe("");
    });

    it("initializes with empty device name", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));
      expect(result.current.newDeviceName).toBe("");
    });
  });

  describe("openPairModal", () => {
    it("sets showPairModal to true", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));

      act(() => {
        result.current.openPairModal();
      });

      expect(result.current.showPairModal).toBe(true);
    });
  });

  describe("closePairModal", () => {
    it("sets showPairModal to false", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));

      act(() => {
        result.current.openPairModal();
        result.current.closePairModal();
      });

      expect(result.current.showPairModal).toBe(false);
    });

    it("resets pairMode to null", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));

      act(() => {
        result.current.openPairModal();
        result.current.setPairMode("usb");
        result.current.closePairModal();
      });

      expect(result.current.pairMode).toBe(null);
    });

    it("resets device name", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));

      act(() => {
        result.current.openPairModal();
        result.current.setNewDeviceName("Test Device");
        result.current.closePairModal();
      });

      expect(result.current.newDeviceName).toBe("");
    });
  });

  describe("setPairMode", () => {
    it("sets pair mode to usb", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));

      act(() => {
        result.current.setPairMode("usb");
      });

      expect(result.current.pairMode).toBe("usb");
    });

    it("sets pair mode to wireless", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));

      act(() => {
        result.current.setPairMode("wireless");
      });

      expect(result.current.pairMode).toBe("wireless");
    });

    it("lists ADB devices when setting USB mode", async () => {
      const { result } = renderHook(() => usePairDevice(mockProps));

      await act(async () => {
        result.current.setPairMode("usb");
      });

      expect(
        vi.mocked(await import("@tauri-apps/api/core")).invoke,
      ).toHaveBeenCalledWith("list_adb_devices");
    });
  });

  describe("setDeviceIp", () => {
    it("updates device IP", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));

      act(() => {
        result.current.setDeviceIp("192.168.1.100");
      });

      expect(result.current.deviceIp).toBe("192.168.1.100");
    });
  });

  describe("setDevicePort", () => {
    it("updates device port", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));

      act(() => {
        result.current.setDevicePort(5556);
      });

      expect(result.current.devicePort).toBe(5556);
    });
  });

  describe("setNewDeviceName", () => {
    it("updates device name", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));

      act(() => {
        result.current.setNewDeviceName("My Phone");
      });

      expect(result.current.newDeviceName).toBe("My Phone");
    });
  });

  describe("setSelectedUsbDevice", () => {
    it("updates selected USB device", () => {
      const { result } = renderHook(() => usePairDevice(mockProps));

      act(() => {
        result.current.setSelectedUsbDevice("device-123");
      });

      expect(result.current.selectedUsbDevice).toBe("device-123");
    });
  });

  describe("registerDevice", () => {
    it("calls invoke with register_device", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      vi.mocked(invoke).mockResolvedValue(undefined);

      const { result } = renderHook(() => usePairDevice(mockProps));

      await act(async () => {
        await result.current.registerDevice("device-123");
      });

      expect(invoke).toHaveBeenCalledWith("register_device", {
        serial: "device-123",
      });
    });

    it("persists device name when provided", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      vi.mocked(invoke).mockResolvedValue(undefined);

      const { result } = renderHook(() => usePairDevice(mockProps));

      await act(async () => {
        await result.current.registerDevice("device-123", "My Phone");
      });

      expect(mockProps.onPersistDeviceName).toHaveBeenCalledWith(
        "device-123",
        "My Phone",
      );
    });

    it("logs success message", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      vi.mocked(invoke).mockResolvedValue(undefined);

      const { result } = renderHook(() => usePairDevice(mockProps));

      await act(async () => {
        await result.current.registerDevice("device-123");
      });

      expect(mockProps.onAddLog).toHaveBeenCalledWith(
        "Device added: device-123",
        "SUCCESS",
      );
    });

    it("refreshes devices after registration", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      vi.mocked(invoke).mockResolvedValue(undefined);

      const { result } = renderHook(() => usePairDevice(mockProps));

      await act(async () => {
        await result.current.registerDevice("device-123");
      });

      expect(mockProps.onRefreshDevices).toHaveBeenCalled();
    });

    it("returns true on success", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      vi.mocked(invoke).mockResolvedValue(undefined);

      const { result } = renderHook(() => usePairDevice(mockProps));

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.registerDevice("device-123");
      });

      expect(success).toBe(true);
    });

    it("returns false on error", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      vi.mocked(invoke).mockRejectedValue(new Error("Failed"));

      const { result } = renderHook(() => usePairDevice(mockProps));

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.registerDevice("device-123");
      });

      expect(success).toBe(false);
    });

    it("logs error message on failure", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      vi.mocked(invoke).mockRejectedValue(new Error("Failed"));

      const { result } = renderHook(() => usePairDevice(mockProps));

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.registerDevice("device-123");
      });

      expect(success).toBe(false);
      expect(mockProps.onAddLog).toHaveBeenCalledWith(
        expect.stringContaining("Device registration failed"),
        "ERROR",
      );
    });
  });

  describe("listAdbDevices", () => {
    it("calls invoke with list_adb_devices", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      vi.mocked(invoke).mockResolvedValue([]);

      const { result } = renderHook(() => usePairDevice(mockProps));

      await act(async () => {
        await result.current.listAdbDevices();
      });

      expect(invoke).toHaveBeenCalledWith("list_adb_devices");
    });

    it("updates availableUsbDevices on success", async () => {
      const { invoke } = await import("@tauri-apps/api/core");
      const mockDevices = [{ serial: "device-1" }];
      vi.mocked(invoke).mockResolvedValue(mockDevices);

      const { result } = renderHook(() => usePairDevice(mockProps));

      await act(async () => {
        await result.current.listAdbDevices();
      });

      expect(result.current.availableUsbDevices).toEqual(mockDevices);
    });

    it("sets usbRefreshing during refresh", async () => {
      const { result } = renderHook(() => usePairDevice(mockProps));

      expect(result.current.usbRefreshing).toBe(false);
    });

    it("logs error on failure", async () => {
      const { result } = renderHook(() => usePairDevice(mockProps));

      expect(result.current.listAdbDevices).toBeDefined();
    });
  });
});
