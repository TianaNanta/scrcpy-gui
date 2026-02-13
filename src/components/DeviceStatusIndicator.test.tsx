/**
 * DeviceStatusIndicator Component Tests
 *
 * Tests for status display, state rendering, and user interactions
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeviceStatusIndicator } from "./DeviceStatusIndicator";
import { DeviceHealth, DeviceState, StalenessLevel } from "../types/health";

describe("DeviceStatusIndicator", () => {
  // Mock device health data
  const mockOnlineHealth: DeviceHealth = {
    deviceId: "device-1",
    state: "online" as DeviceState,
    battery: {
      percentage: 85,
      temperature: 32,
      isCharging: true,
      health: "good",
    },
    storage: {
      used: 20_000_000_000, // 20GB
      total: 100_000_000_000, // 100GB
      free: 80_000_000_000, // 80GB
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
    lastSeen: Date.now() - 1000,
    lastUpdated: Date.now() - 1000,
    errorReason: undefined,
  };

  const mockOfflineHealth: DeviceHealth = {
    deviceId: "device-2",
    state: "offline" as DeviceState,
    battery: undefined,
    storage: undefined,
    connection: undefined,
    device: undefined,
    staleness: "offline" as StalenessLevel,
    lastSeen: Date.now() - 60000,
    lastUpdated: Date.now() - 60000,
    errorReason: "Device offline for 60+ seconds",
  };

  const mockLowBatteryHealth: DeviceHealth = {
    ...mockOnlineHealth,
    battery: {
      percentage: 8,
      temperature: 38,
      isCharging: false,
      health: "warm",
    },
  };

  const mockLowStorageHealth: DeviceHealth = {
    ...mockOnlineHealth,
    storage: {
      used: 95_000_000_000, // 95GB
      total: 100_000_000_000, // 100GB
      free: 5_000_000_000, // 5GB
    },
  };

  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<DeviceStatusIndicator />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders online device status correctly", () => {
      render(<DeviceStatusIndicator health={mockOnlineHealth} />);
      const status = screen.getByRole("status");
      expect(status).toHaveClass("status-online");
      expect(screen.getByText("Online")).toBeInTheDocument();
    });

    it("renders offline device status correctly", () => {
      render(<DeviceStatusIndicator health={mockOfflineHealth} />);
      const status = screen.getByRole("status");
      expect(status).toHaveClass("status-offline");
      expect(screen.getByText("Offline")).toBeInTheDocument();
    });

    it("renders unknown state when health is null", () => {
      render(<DeviceStatusIndicator health={null} />);
      const status = screen.getByRole("status");
      expect(status).toHaveClass("status-unknown");
      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });

    it("renders compact mode as a simple dot", () => {
      const { container } = render(
        <DeviceStatusIndicator health={mockOnlineHealth} compact={true} />,
      );
      const indicator = container.querySelector(
        ".device-status-indicator.compact",
      );
      expect(indicator).toBeInTheDocument();
      expect(screen.queryByText("Online")).not.toBeInTheDocument();
    });
  });

  describe("Details Display", () => {
    it("shows battery info when available", () => {
      render(
        <DeviceStatusIndicator health={mockOnlineHealth} showDetails={true} />,
      );
      expect(screen.getByText("85%")).toBeInTheDocument();
      expect(screen.getByText("charging")).toBeInTheDocument();
    });

    it("hides details when showDetails is false", () => {
      render(
        <DeviceStatusIndicator health={mockOnlineHealth} showDetails={false} />,
      );
      expect(screen.queryByText("85%")).not.toBeInTheDocument();
    });

    it("shows storage info with usage percentage", () => {
      render(
        <DeviceStatusIndicator health={mockOnlineHealth} showDetails={true} />,
      );
      const usagePercent = 20; // 20GB used / 100GB total = 20%
      expect(screen.getByText(`${usagePercent}%`)).toBeInTheDocument();
    });

    it("shows connection latency", () => {
      render(
        <DeviceStatusIndicator health={mockOnlineHealth} showDetails={true} />,
      );
      expect(screen.getByText("25ms")).toBeInTheDocument();
    });

    it("displays update time when showLastUpdate is true", () => {
      render(
        <DeviceStatusIndicator
          health={mockOnlineHealth}
          showLastUpdate={true}
        />,
      );
      expect(screen.getByText(/just now/i)).toBeInTheDocument();
    });

    it("hides update time when showLastUpdate is false", () => {
      render(
        <DeviceStatusIndicator
          health={mockOnlineHealth}
          showLastUpdate={false}
        />,
      );
      expect(screen.queryByText(/just now/i)).not.toBeInTheDocument();
    });
  });

  describe("Warning Indicators", () => {
    it("shows low battery warning (5-10%)", () => {
      render(
        <DeviceStatusIndicator
          health={mockLowBatteryHealth}
          showDetails={true}
        />,
      );
      const batterySection = screen.getByText("8%").closest(".battery");
      expect(batterySection).toHaveClass("warning-low");
    });

    it("shows low storage warning", () => {
      render(
        <DeviceStatusIndicator
          health={mockLowStorageHealth}
          showDetails={true}
        />,
      );
      const storageSection = screen.getByText("95%").closest(".storage");
      expect(storageSection).toHaveClass("warning-low");
    });
  });

  describe("Error States", () => {
    it("displays error message for error state devices", () => {
      const errorHealth: DeviceHealth = {
        ...mockOfflineHealth,
        state: "error" as DeviceState,
        errorReason: "ADB connection failed",
      };
      render(<DeviceStatusIndicator health={errorHealth} showDetails={true} />);
      expect(screen.getByText("ADB connection failed")).toBeInTheDocument();
    });

    it("does not show error message if state is not error", () => {
      render(
        <DeviceStatusIndicator health={mockOnlineHealth} showDetails={true} />,
      );
      expect(
        screen.queryByText(/ADB connection failed/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Interactivity", () => {
    it("has pointer cursor when clickable", () => {
      const { container } = render(
        <DeviceStatusIndicator health={mockOnlineHealth} onClick={() => {}} />,
      );
      const indicator = container.querySelector(".device-status-indicator");
      expect(indicator).toHaveStyle("cursor: pointer");
    });

    it("has default cursor when not clickable", () => {
      const { container } = render(
        <DeviceStatusIndicator health={mockOnlineHealth} />,
      );
      const indicator = container.querySelector(".device-status-indicator");
      expect(indicator).toHaveStyle("cursor: default");
    });
  });

  describe("Styling", () => {
    it("applies correct CSS classes for online state", () => {
      const { container } = render(
        <DeviceStatusIndicator health={mockOnlineHealth} />,
      );
      const indicator = container.querySelector(".device-status-indicator");
      expect(indicator).toHaveClass("status-online");
    });

    it("applies correct CSS classes for offline state", () => {
      const { container } = render(
        <DeviceStatusIndicator health={mockOfflineHealth} />,
      );
      const indicator = container.querySelector(".device-status-indicator");
      expect(indicator).toHaveClass("status-offline");
    });

    it("applies compact class in compact mode", () => {
      const { container } = render(
        <DeviceStatusIndicator health={mockOnlineHealth} compact={true} />,
      );
      const indicator = container.querySelector(".device-status-indicator");
      expect(indicator).toHaveClass("compact");
    });
  });

  describe("Staleness Display", () => {
    it("displays freshness level", () => {
      const freshHealth: DeviceHealth = {
        ...mockOnlineHealth,
        staleness: "fresh" as StalenessLevel,
      };
      render(<DeviceStatusIndicator health={freshHealth} />);
      expect(screen.getByText(/Fresh/)).toBeInTheDocument();
    });

    it("displays stale indicator", () => {
      const staleHealth: DeviceHealth = {
        ...mockOnlineHealth,
        staleness: "stale" as StalenessLevel,
      };
      render(<DeviceStatusIndicator health={staleHealth} />);
      expect(screen.getByText(/Stale/)).toBeInTheDocument();
    });

    it("displays offline indicator when truly offline", () => {
      const offlineHealth: DeviceHealth = {
        ...mockOnlineHealth,
        staleness: "offline" as StalenessLevel,
      };
      render(<DeviceStatusIndicator health={offlineHealth} />);
      expect(screen.getByText(/Offline/)).toBeInTheDocument();
    });
  });
});
