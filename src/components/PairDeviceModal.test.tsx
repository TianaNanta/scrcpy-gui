/**
 * PairDeviceModal Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PairDeviceModal from "./PairDeviceModal";
import type { Device } from "../types/device";

describe("PairDeviceModal", () => {
  const mockUsbDevices: Device[] = [
    {
      serial: "usb-device-1",
      status: "device",
      model: "Pixel 6",
      android_version: "14",
      battery_level: 85,
      is_wireless: false,
      last_seen: new Date().toISOString(),
      first_seen: new Date().toISOString(),
    },
    {
      serial: "usb-device-2",
      status: "device",
      model: "Galaxy S23",
      android_version: "13",
      battery_level: 90,
      is_wireless: false,
      last_seen: new Date().toISOString(),
      first_seen: new Date().toISOString(),
    },
  ];

  const defaultProps = {
    availableUsbDevices: mockUsbDevices,
    usbLoading: false,
    deviceName: "",
    deviceIp: "",
    devicePort: 5555,
    pairMode: null,
    selectedUsbDevice: "",
    onClose: vi.fn(),
    onSetPairMode: vi.fn(),
    onSetDeviceName: vi.fn(),
    onSetDeviceIp: vi.fn(),
    onSetDevicePort: vi.fn(),
    onSetSelectedUsbDevice: vi.fn(),
    onAddUsbDevice: vi.fn().mockResolvedValue(true),
    onAddWirelessDevice: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("pair mode options rendering", () => {
    it("renders without crashing", () => {
      render(<PairDeviceModal {...defaultProps} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("displays pair mode buttons when pairMode is null", () => {
      render(<PairDeviceModal {...defaultProps} />);
      expect(screen.getByText("Connect via USB")).toBeInTheDocument();
      expect(screen.getByText("Connect via Wireless")).toBeInTheDocument();
    });

    it("displays modal title", () => {
      render(<PairDeviceModal {...defaultProps} />);
      expect(screen.getByText("Pair New Device")).toBeInTheDocument();
    });

    it("has correct aria attributes", () => {
      render(<PairDeviceModal {...defaultProps} />);
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("calls onSetPairMode with 'usb' when USB button clicked", () => {
      const onSetPairMode = vi.fn();
      render(
        <PairDeviceModal {...defaultProps} onSetPairMode={onSetPairMode} />,
      );

      fireEvent.click(screen.getByText("Connect via USB"));
      expect(onSetPairMode).toHaveBeenCalledWith("usb");
    });

    it("calls onSetPairMode with 'wireless' when Wireless button clicked", () => {
      const onSetPairMode = vi.fn();
      render(
        <PairDeviceModal {...defaultProps} onSetPairMode={onSetPairMode} />,
      );

      fireEvent.click(screen.getByText("Connect via Wireless"));
      expect(onSetPairMode).toHaveBeenCalledWith("wireless");
    });
  });

  describe("USB device pairing flow", () => {
    it("shows USB device selection when pairMode is 'usb'", () => {
      render(<PairDeviceModal {...defaultProps} pairMode="usb" />);
      expect(
        screen.getByText(/select a usb device to add/i),
      ).toBeInTheDocument();
    });

    it("displays device name input", () => {
      render(<PairDeviceModal {...defaultProps} pairMode="usb" />);
      expect(screen.getByPlaceholderText("My Phone")).toBeInTheDocument();
    });

    it("displays USB device dropdown", () => {
      render(<PairDeviceModal {...defaultProps} pairMode="usb" />);
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("lists available USB devices", () => {
      render(<PairDeviceModal {...defaultProps} pairMode="usb" />);
      expect(screen.getByText(/usb-device-1/)).toBeInTheDocument();
      expect(screen.getByText(/usb-device-2/)).toBeInTheDocument();
    });

    it("calls onSetSelectedUsbDevice when selecting a device", () => {
      const onSetSelectedUsbDevice = vi.fn();
      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="usb"
          onSetSelectedUsbDevice={onSetSelectedUsbDevice}
        />,
      );

      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "usb-device-1" } });

      expect(onSetSelectedUsbDevice).toHaveBeenCalledWith("usb-device-1");
    });

    it("calls onSetDeviceName when name is changed", () => {
      const onSetDeviceName = vi.fn();
      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="usb"
          onSetDeviceName={onSetDeviceName}
        />,
      );

      const nameInput = screen.getByPlaceholderText("My Phone");
      fireEvent.change(nameInput, { target: { value: "Test Phone" } });

      expect(onSetDeviceName).toHaveBeenCalledWith("Test Phone");
    });

    it("disables Add Device button when no device selected", () => {
      render(<PairDeviceModal {...defaultProps} pairMode="usb" />);
      const addButton = screen.getByText("Add Device");
      expect(addButton).toBeDisabled();
    });

    it("enables Add Device button when device is selected", () => {
      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="usb"
          selectedUsbDevice="usb-device-1"
        />,
      );
      const addButton = screen.getByText("Add Device");
      expect(addButton).not.toBeDisabled();
    });

    it("calls onAddUsbDevice when Add Device clicked", async () => {
      const onAddUsbDevice = vi.fn().mockResolvedValue(true);
      const onClose = vi.fn();
      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="usb"
          selectedUsbDevice="usb-device-1"
          deviceName="Test Phone"
          onAddUsbDevice={onAddUsbDevice}
          onClose={onClose}
        />,
      );

      fireEvent.click(screen.getByText("Add Device"));

      await waitFor(() => {
        expect(onAddUsbDevice).toHaveBeenCalledWith(
          "usb-device-1",
          "Test Phone",
        );
      });
    });

    it("closes modal after successful USB device add", async () => {
      const onClose = vi.fn();
      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="usb"
          selectedUsbDevice="usb-device-1"
          onClose={onClose}
        />,
      );

      fireEvent.click(screen.getByText("Add Device"));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe("wireless pairing flow", () => {
    it("shows wireless form when pairMode is 'wireless'", () => {
      render(<PairDeviceModal {...defaultProps} pairMode="wireless" />);
      expect(screen.getByLabelText(/device ip address/i)).toBeInTheDocument();
    });

    it("displays device name input for wireless", () => {
      render(<PairDeviceModal {...defaultProps} pairMode="wireless" />);
      expect(
        screen.getByPlaceholderText("Living Room Phone"),
      ).toBeInTheDocument();
    });

    it("displays IP address input", () => {
      render(<PairDeviceModal {...defaultProps} pairMode="wireless" />);
      expect(screen.getByPlaceholderText("192.168.1.100")).toBeInTheDocument();
    });

    it("displays port input", () => {
      render(<PairDeviceModal {...defaultProps} pairMode="wireless" />);
      expect(screen.getByLabelText(/port/i)).toBeInTheDocument();
    });

    it("calls onSetDeviceIp when IP is changed", () => {
      const onSetDeviceIp = vi.fn();
      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="wireless"
          onSetDeviceIp={onSetDeviceIp}
        />,
      );

      const ipInput = screen.getByPlaceholderText("192.168.1.100");
      fireEvent.change(ipInput, { target: { value: "192.168.1.50" } });

      expect(onSetDeviceIp).toHaveBeenCalledWith("192.168.1.50");
    });

    it("calls onSetDevicePort when port is changed", () => {
      const onSetDevicePort = vi.fn();
      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="wireless"
          onSetDevicePort={onSetDevicePort}
        />,
      );

      const portInput = screen.getByLabelText(/port/i);
      fireEvent.change(portInput, { target: { value: "5556" } });

      expect(onSetDevicePort).toHaveBeenCalledWith(5556);
    });

    it("shows connecting state when adding", async () => {
      const onAddWirelessDevice = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(true), 100)),
        );

      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="wireless"
          deviceIp="192.168.1.100"
          onAddWirelessDevice={onAddWirelessDevice}
        />,
      );

      fireEvent.click(screen.getByText("Add Device"));

      await waitFor(() => {
        expect(screen.getByText("Adding...")).toBeInTheDocument();
      });
    });

    it("calls onAddWirelessDevice when Add Device clicked", async () => {
      const onAddWirelessDevice = vi.fn().mockResolvedValue(true);
      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="wireless"
          deviceIp="192.168.1.100"
          deviceName="Test Wireless"
          onAddWirelessDevice={onAddWirelessDevice}
        />,
      );

      fireEvent.click(screen.getByText("Add Device"));

      await waitFor(() => {
        expect(onAddWirelessDevice).toHaveBeenCalledWith("Test Wireless");
      });
    });
  });

  describe("IP address validation", () => {
    it("shows error for empty IP address", async () => {
      render(
        <PairDeviceModal {...defaultProps} pairMode="wireless" deviceIp="" />,
      );

      fireEvent.click(screen.getByText("Add Device"));

      await waitFor(() => {
        expect(screen.getByText(/ip address is required/i)).toBeInTheDocument();
      });
    });

    it("shows error for invalid IP address format", async () => {
      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="wireless"
          deviceIp="invalid-ip"
        />,
      );

      fireEvent.click(screen.getByText("Add Device"));

      await waitFor(() => {
        expect(screen.getByText(/invalid ipv4 address/i)).toBeInTheDocument();
      });
    });

    it("shows error for IP with wrong number of octets", async () => {
      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="wireless"
          deviceIp="192.168.1"
        />,
      );

      fireEvent.click(screen.getByText("Add Device"));

      await waitFor(() => {
        expect(screen.getByText(/invalid ipv4 address/i)).toBeInTheDocument();
      });
    });

    it("shows error for IP with octet > 255", async () => {
      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="wireless"
          deviceIp="192.168.1.300"
        />,
      );

      fireEvent.click(screen.getByText("Add Device"));

      await waitFor(() => {
        expect(screen.getByText(/invalid ipv4 address/i)).toBeInTheDocument();
      });
    });

    it("accepts valid IP address", async () => {
      const onAddWirelessDevice = vi.fn().mockResolvedValue(true);
      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="wireless"
          deviceIp="192.168.1.100"
          onAddWirelessDevice={onAddWirelessDevice}
        />,
      );

      fireEvent.click(screen.getByText("Add Device"));

      await waitFor(() => {
        expect(onAddWirelessDevice).toHaveBeenCalled();
      });
    });
  });

  describe("close behavior", () => {
    it("closes when clicking overlay", () => {
      const onClose = vi.fn();
      const { container } = render(
        <PairDeviceModal {...defaultProps} onClose={onClose} />,
      );

      const overlay = container.querySelector(".modal-overlay");
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(onClose).toHaveBeenCalled();
    });

    it("does not close when clicking modal content", () => {
      const onClose = vi.fn();
      const { container } = render(
        <PairDeviceModal {...defaultProps} onClose={onClose} />,
      );

      const modalContent = container.querySelector(".modal-content");
      if (modalContent) {
        fireEvent.click(modalContent);
      }

      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on Escape key", () => {
      const onClose = vi.fn();
      render(<PairDeviceModal {...defaultProps} onClose={onClose} />);

      const dialog = screen.getByRole("dialog");
      fireEvent.keyDown(dialog, { key: "Escape" });

      expect(onClose).toHaveBeenCalled();
    });

    it("closes when Cancel button clicked", () => {
      const onClose = vi.fn();
      render(<PairDeviceModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByText("Cancel"));

      expect(onClose).toHaveBeenCalled();
    });

    it("closes when close button clicked", () => {
      const onClose = vi.fn();
      render(<PairDeviceModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByLabelText("Close"));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles empty USB device list", () => {
      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="usb"
          availableUsbDevices={[]}
        />,
      );
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("handles USB loading state", () => {
      render(
        <PairDeviceModal {...defaultProps} pairMode="usb" usbLoading={true} />,
      );
      expect(screen.getByText(/detecting usb devices/i)).toBeInTheDocument();
    });

    it("disables inputs during wireless connection", () => {
      const onAddWirelessDevice = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(true), 100)),
        );

      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="wireless"
          deviceIp="192.168.1.100"
          onAddWirelessDevice={onAddWirelessDevice}
        />,
      );

      fireEvent.click(screen.getByText("Add Device"));

      const ipInput = screen.getByPlaceholderText("192.168.1.100");
      expect(ipInput).toBeDisabled();
    });

    it("handles wireless connection error", async () => {
      const onAddWirelessDevice = vi
        .fn()
        .mockRejectedValue(new Error("Connection failed"));
      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="wireless"
          deviceIp="192.168.1.100"
          onAddWirelessDevice={onAddWirelessDevice}
        />,
      );

      fireEvent.click(screen.getByText("Add Device"));

      await waitFor(() => {
        expect(screen.getByText(/add failed/i)).toBeInTheDocument();
      });
    });

    it("handles device with null model", () => {
      const devicesWithNullModel: Device[] = [
        {
          ...mockUsbDevices[0],
          model: null,
        },
      ];

      render(
        <PairDeviceModal
          {...defaultProps}
          pairMode="usb"
          availableUsbDevices={devicesWithNullModel}
        />,
      );
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });
});
