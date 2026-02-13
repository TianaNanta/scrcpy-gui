/**
 * DeviceInfoPopover Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { DeviceInfoPopover } from "./DeviceInfoPopover";
import { DeviceHealth, DeviceState, StalenessLevel } from "../types/health";

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async (command, params: { deviceId: string }) => {
    if (command === "get_device_health") {
      return {
        health: {
          deviceId: params.deviceId,
          state: "online" as DeviceState,
          battery: {
            percentage: 75,
            temperature: 32,
            isCharging: true,
            health: "good",
          },
          storage: {
            used: 50 * 1024 * 1024 * 1024,
            total: 100 * 1024 * 1024 * 1024,
            free: 50 * 1024 * 1024 * 1024,
          },
          connection: {
            type: "usb",
            latency: 25,
            qualityLevel: "excellent",
          },
          device: {
            modelName: "Pixel 6",
            androidVersion: "14",
            buildNumber: "TP1A.220624.014",
          },
          staleness: "fresh" as StalenessLevel,
          lastSeen: Date.now(),
          lastUpdated: Date.now(),
        } as DeviceHealth,
      };
    }
    return null;
  }),
}));

describe("DeviceInfoPopover", () => {
  const mockHealth: DeviceHealth = {
    deviceId: "device-1",
    state: "online" as DeviceState,
    battery: {
      percentage: 85,
      temperature: 32,
      isCharging: true,
      health: "good",
    },
    storage: {
      used: 30 * 1024 * 1024 * 1024,
      total: 100 * 1024 * 1024 * 1024,
      free: 70 * 1024 * 1024 * 1024,
    },
    connection: {
      type: "usb",
      latency: 25,
      qualityLevel: "excellent",
    },
    device: {
      modelName: "Pixel 6",
      androidVersion: "14",
      buildNumber: "TP1A.220624.014",
    },
    staleness: "fresh" as StalenessLevel,
    lastSeen: Date.now(),
    lastUpdated: Date.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when closed", () => {
    const { container } = render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={mockHealth}
        isOpen={false}
        onClose={() => {}}
      />,
    );
    expect(
      container.querySelector(".device-info-popover"),
    ).not.toBeInTheDocument();
  });

  it("renders when open with health provided", () => {
    render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={mockHealth}
        isOpen={true}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Device Information")).toBeInTheDocument();
  });

  it("displays device information", () => {
    render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={mockHealth}
        isOpen={true}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Pixel 6")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
  });

  it("displays battery information", () => {
    render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={mockHealth}
        isOpen={true}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText(/Charging/)).toBeInTheDocument();
  });

  it("displays storage information", () => {
    render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={mockHealth}
        isOpen={true}
        onClose={() => {}}
      />,
    );
    const content = screen.getByText(/Free:/);
    expect(content).toBeInTheDocument();
    const contentContainer = content.closest(".info-section");
    expect(contentContainer?.textContent).toContain("70.0 GB");
  });

  it("displays connection information", () => {
    render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={mockHealth}
        isOpen={true}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/USB/)).toBeInTheDocument();
    expect(screen.getByText(/Excellent/)).toBeInTheDocument();
    expect(screen.getByText("25ms")).toBeInTheDocument();
  });

  it("closes when close button is clicked", async () => {
    const handleClose = vi.fn();
    render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={mockHealth}
        isOpen={true}
        onClose={handleClose}
      />,
    );
    const closeButton = screen.getByLabelText("Close");
    closeButton.click();
    expect(handleClose).toHaveBeenCalled();
  });

  it("closes when backdrop is clicked", async () => {
    const handleClose = vi.fn();
    const { container } = render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={mockHealth}
        isOpen={true}
        onClose={handleClose}
      />,
    );
    const backdrop = container.querySelector(".popover-backdrop");
    if (backdrop) {
      backdrop.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }
    expect(handleClose).toHaveBeenCalled();
  });

  it("closes on Escape key", async () => {
    const handleClose = vi.fn();
    render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={mockHealth}
        isOpen={true}
        onClose={handleClose}
      />,
    );

    fireEvent.keyDown(document, {
      key: "Escape",
      code: "Escape",
      charCode: 27,
    });

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("shows battery warning for low battery", () => {
    const lowBatteryHealth = {
      ...mockHealth,
      battery: { ...mockHealth.battery!, percentage: 5 },
    };
    render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={lowBatteryHealth}
        isOpen={true}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Critical battery/i)).toBeInTheDocument();
  });

  it("shows storage warning for low storage", () => {
    const lowStorageHealth = {
      ...mockHealth,
      storage: {
        used: 90 * 1024 * 1024 * 1024,
        total: 100 * 1024 * 1024 * 1024,
        free: 10 * 1024 * 1024, // Only 10MB
      },
    };
    render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={lowStorageHealth}
        isOpen={true}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Critical storage/i)).toBeInTheDocument();
  });

  it("displays error message if provided", () => {
    const errorHealth: DeviceHealth = {
      ...mockHealth,
      state: "error" as DeviceState,
      errorReason: "ADB connection timeout",
    };
    render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={errorHealth}
        isOpen={true}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/ADB connection timeout/i)).toBeInTheDocument();
  });

  it("has proper dialog role for accessibility", () => {
    render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={mockHealth}
        isOpen={true}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("renders all sections when data is available", () => {
    render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={mockHealth}
        isOpen={true}
        onClose={() => {}}
      />,
    );
    // Check that all major sections are rendered by looking for key data
    expect(screen.getByText("Pixel 6")).toBeInTheDocument(); // Device section
    expect(screen.getByText("85%")).toBeInTheDocument(); // Battery section
    expect(screen.getByText(/Free:/)).toBeInTheDocument(); // Storage section
    expect(screen.getByText(/usb/i)).toBeInTheDocument(); // Connection section
  });

  it("displays connection metrics when available", () => {
    render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={mockHealth}
        isOpen={true}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/USB/)).toBeInTheDocument();
    expect(screen.getByText(/Excellent/)).toBeInTheDocument();
    expect(screen.getByText("25ms")).toBeInTheDocument();
  });

  it("displays signal strength when available", () => {
    const healthWithSignal: DeviceHealth = {
      ...mockHealth,
      connection: {
        ...mockHealth.connection!,
        signalStrength: -40,
      },
    };
    render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={healthWithSignal}
        isOpen={true}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("-40 dBm")).toBeInTheDocument();
  });

  it("quality indicator updates with different latency values", () => {
    const { rerender } = render(
      <DeviceInfoPopover
        deviceId="device-1"
        health={mockHealth}
        isOpen={true}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Excellent")).toBeInTheDocument();

    // Change latency to poor range
    const poorHealth: DeviceHealth = {
      ...mockHealth,
      connection: {
        ...mockHealth.connection!,
        latency: 500,
        qualityLevel: "poor",
      },
    };

    rerender(
      <DeviceInfoPopover
        deviceId="device-1"
        health={poorHealth}
        isOpen={true}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Poor")).toBeInTheDocument();
  });
});
