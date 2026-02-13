/**
 * DeviceList Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DeviceList from "./DeviceList";
import type { Device } from "../types/device";
import type { LogEntry } from "../types/settings";

vi.mock("./DeviceCard", () => ({
  DeviceCard: ({
    deviceName,
    device,
  }: {
    deviceName: string;
    device: Device;
  }) => (
    <div data-testid="device-card" data-serial={device.serial}>
      {deviceName}
    </div>
  ),
}));

describe("DeviceList", () => {
  const devices: Device[] = [
    {
      serial: "USB-1",
      status: "device",
      model: "Pixel 6",
      android_version: "14",
      battery_level: 85,
      is_wireless: false,
      last_seen: null,
      first_seen: new Date().toISOString(),
    },
    {
      serial: "WIFI-1",
      status: "device",
      model: "Pixel 7",
      android_version: "13",
      battery_level: 70,
      is_wireless: true,
      last_seen: null,
      first_seen: new Date().toISOString(),
    },
  ];

  const dependencies = { adb: true, scrcpy: true };
  const logs: LogEntry[] = [];

  it("renders device cards for all devices", () => {
    render(
      <DeviceList
        devices={devices}
        dependencies={dependencies}
        activeDevices={[]}
        deviceNames={
          new Map([
            ["USB-1", "USB Device"],
            ["WIFI-1", "Wireless Device"],
          ])
        }
        loading={false}
        refreshing={false}
        wirelessConnecting={false}
        deviceSearch=""
        deviceFilter="all"
        logs={logs}
        onSearchChange={vi.fn()}
        onFilterChange={vi.fn()}
        onRefreshDevices={vi.fn()}
        onStartScrcpy={vi.fn()}
        onStopScrcpy={vi.fn()}
        onDisconnectWireless={vi.fn()}
        onOpenDeviceSettings={vi.fn()}
        onOpenPairModal={vi.fn()}
        onForgetDevice={vi.fn()}
      />,
    );

    const cards = screen.getAllByTestId("device-card");
    expect(cards).toHaveLength(2);
    expect(screen.getByText("USB Device")).toBeInTheDocument();
    expect(screen.getByText("Wireless Device")).toBeInTheDocument();
  });

  it("filters devices based on deviceFilter", () => {
    render(
      <DeviceList
        devices={devices}
        dependencies={dependencies}
        activeDevices={[]}
        deviceNames={
          new Map([
            ["USB-1", "USB Device"],
            ["WIFI-1", "Wireless Device"],
          ])
        }
        loading={false}
        refreshing={false}
        wirelessConnecting={false}
        deviceSearch=""
        deviceFilter="wireless"
        logs={logs}
        onSearchChange={vi.fn()}
        onFilterChange={vi.fn()}
        onRefreshDevices={vi.fn()}
        onStartScrcpy={vi.fn()}
        onStopScrcpy={vi.fn()}
        onDisconnectWireless={vi.fn()}
        onOpenDeviceSettings={vi.fn()}
        onOpenPairModal={vi.fn()}
        onForgetDevice={vi.fn()}
      />,
    );

    const cards = screen.getAllByTestId("device-card");
    expect(cards).toHaveLength(1);
    expect(screen.getByText("Wireless Device")).toBeInTheDocument();
  });
});
