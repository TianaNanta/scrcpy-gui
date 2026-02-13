/**
 * DeviceCard Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeviceCard } from "./DeviceCard";
import type { Device } from "../types/device";

// Mock child components
vi.mock("./BatteryBadge", () => ({
  BatteryBadge: ({ percentage }: { percentage: number }) => (
    <div>Battery: {percentage}%</div>
  ),
}));

vi.mock("./StorageBadge", () => ({
  StorageBadge: ({ free, total }: { free: number; total: number }) => (
    <div>
      Storage: {free} / {total}
    </div>
  ),
}));

vi.mock("./DeviceInfoPopover", () => ({
  DeviceInfoPopover: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div role="dialog">Device Info Popover</div> : null,
}));

describe("DeviceCard", () => {
  const mockDevice: Device = {
    serial: "device-1",
    status: "device",
    model: "Pixel 6",
    android_version: "14",
    battery_level: 85,
    is_wireless: false,
    last_seen: null,
    first_seen: new Date().toISOString(),
  };

  const mockDependencies = { adb: true, scrcpy: true };

  const mockHealth = {
    deviceId: "device-1",
    state: "online" as const,
    battery: {
      percentage: 85,
      temperature: 32,
      isCharging: true,
      health: "good" as const,
    },
    storage: {
      used: 30 * 1024 * 1024 * 1024,
      total: 100 * 1024 * 1024 * 1024,
      free: 70 * 1024 * 1024 * 1024,
    },
    connection: {
      type: "usb" as const,
      latency: 25,
      qualityLevel: "excellent" as const,
    },
    device: {
      modelName: "Pixel 6",
      androidVersion: "14",
      buildNumber: "TP1A.220624.014",
    },
    staleness: "fresh" as const,
    lastSeen: Date.now(),
    lastUpdated: Date.now(),
  };

  const mockCriticalHealth = {
    ...mockHealth,
    battery: {
      percentage: 3,
      temperature: 35,
      isCharging: false,
      health: "overheat" as const,
    },
    storage: {
      used: 99 * 1024 * 1024 * 1024,
      total: 100 * 1024 * 1024 * 1024,
      free: 100 * 1024 * 1024,
    },
  };

  it("renders device card with device information", () => {
    render(
      <DeviceCard
        device={mockDevice}
        deviceName="Pixel 6"
        isConnected={true}
        isDisconnected={false}
        statusLabel="connected"
        dependencies={mockDependencies}
        isActive={false}
        loading={false}
      />,
    );

    expect(screen.getByText("Pixel 6")).toBeInTheDocument();
    expect(screen.getByText("Model: Pixel 6")).toBeInTheDocument();
    expect(screen.getByText("Android: 14")).toBeInTheDocument();
  });

  it("displays battery and storage badges when health provided", () => {
    render(
      <DeviceCard
        device={mockDevice}
        deviceName="Test Device"
        isConnected={true}
        isDisconnected={false}
        statusLabel="connected"
        dependencies={mockDependencies}
        isActive={false}
        loading={false}
        health={mockHealth}
      />,
    );

    expect(screen.getByText("Battery: 85%")).toBeInTheDocument();
    expect(screen.getByText(/Storage:/)).toBeInTheDocument();
  });

  it("renders Mirror button when device not active", () => {
    render(
      <DeviceCard
        device={mockDevice}
        deviceName="Test Device"
        isConnected={true}
        isDisconnected={false}
        statusLabel="connected"
        dependencies={mockDependencies}
        isActive={false}
        loading={false}
        onStartScrcpy={vi.fn()}
      />,
    );

    const mirrorBtn = screen.getByText("Mirror");
    expect(mirrorBtn).toBeInTheDocument();
  });

  it("renders Stop button when device is active", () => {
    render(
      <DeviceCard
        device={mockDevice}
        deviceName="Test Device"
        isConnected={true}
        isDisconnected={false}
        statusLabel="connected"
        dependencies={mockDependencies}
        isActive={true}
        loading={false}
        onStopScrcpy={vi.fn()}
      />,
    );

    const stopBtn = screen.getByText("Stop");
    expect(stopBtn).toBeInTheDocument();
  });

  it("renders Forget button when device is disconnected", () => {
    render(
      <DeviceCard
        device={mockDevice}
        deviceName="Test Device"
        isConnected={false}
        isDisconnected={true}
        statusLabel="disconnected"
        dependencies={mockDependencies}
        isActive={false}
        loading={false}
      />,
    );

    const forgetBtn = screen.getByText("Forget");
    expect(forgetBtn).toBeInTheDocument();
  });

  it("shows status indicator for online devices", () => {
    render(
      <DeviceCard
        device={mockDevice}
        deviceName="Test Device"
        isConnected={true}
        isDisconnected={false}
        statusLabel="connected"
        dependencies={mockDependencies}
        isActive={false}
        loading={false}
      />,
    );

    expect(screen.getByText("connected")).toBeInTheDocument();
  });

  it("shows offline status for disconnected devices", () => {
    render(
      <DeviceCard
        device={{ ...mockDevice, status: "offline" }}
        deviceName="Test Device"
        isConnected={false}
        isDisconnected={false}
        statusLabel="offline"
        dependencies={mockDependencies}
        isActive={false}
        loading={false}
      />,
    );

    expect(screen.getByText("offline")).toBeInTheDocument();
  });

  it("shows wireless badge for wireless devices", () => {
    const wirelessDevice = { ...mockDevice, is_wireless: true };
    render(
      <DeviceCard
        device={wirelessDevice}
        deviceName="Test Device"
        isConnected={true}
        isDisconnected={false}
        statusLabel="connected"
        dependencies={mockDependencies}
        isActive={false}
        loading={false}
      />,
    );

    expect(screen.getByText("Wi-Fi")).toBeInTheDocument();
  });

  it("shows usb badge for usb devices", () => {
    render(
      <DeviceCard
        device={mockDevice}
        deviceName="Test Device"
        isConnected={true}
        isDisconnected={false}
        statusLabel="connected"
        dependencies={mockDependencies}
        isActive={false}
        loading={false}
      />,
    );

    expect(screen.getByText("USB")).toBeInTheDocument();
  });

  it("allows info button that opens popover", () => {
    render(
      <DeviceCard
        device={mockDevice}
        deviceName="Test Device"
        isConnected={true}
        isDisconnected={false}
        statusLabel="connected"
        dependencies={mockDependencies}
        isActive={false}
        loading={false}
        health={mockHealth}
      />,
    );

    const infoBtn = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("title")?.includes("details"));
    expect(infoBtn).toBeInTheDocument();
  });

  it("renders health warnings and opens popover", () => {
    render(
      <DeviceCard
        device={mockDevice}
        deviceName="Test Device"
        isConnected={true}
        isDisconnected={false}
        statusLabel="connected"
        dependencies={mockDependencies}
        isActive={false}
        loading={false}
        health={mockCriticalHealth}
      />,
    );

    expect(screen.getByText("Battery: 3%")).toBeInTheDocument();
    expect(screen.getByText(/Storage:/)).toBeInTheDocument();

    const infoBtn = screen
      .getAllByRole("button")
      .find((btn) => btn.getAttribute("title")?.includes("details"));
    expect(infoBtn).toBeInTheDocument();
    if (infoBtn) {
      fireEvent.click(infoBtn);
    }

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
