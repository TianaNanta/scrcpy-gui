/**
 * DeviceSettingsModal Component Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DeviceSettingsModal from "./DeviceSettingsModal";
import type { Device } from "../types/device";
import type { DeviceSettings } from "../types/settings";
import { DEFAULT_DEVICE_SETTINGS } from "../types/settings";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("../utils/platform", () => ({
  isLinux: false,
}));

vi.mock("../hooks/useCommandValidation", () => ({
  useCommandValidation: vi.fn(() => ({
    config: { options: {} },
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
      optionStates: {},
    },
    updateOption: vi.fn(),
    validateConfig: vi.fn(),
    errors: [],
    warnings: [],
    isValid: true,
  })),
}));

describe("DeviceSettingsModal", () => {
  const mockDevice: Device = {
    serial: "test-device-123",
    status: "device",
    model: "Pixel 6",
    android_version: "14",
    battery_level: 85,
    is_wireless: false,
    last_seen: new Date().toISOString(),
    first_seen: new Date().toISOString(),
  };

  const mockSettings: DeviceSettings = {
    ...DEFAULT_DEVICE_SETTINGS,
    name: "Test Device",
  };

  const defaultProps = {
    device: mockDevice,
    serial: mockDevice.serial,
    settings: mockSettings,
    onSettingsChange: vi.fn(),
    onClose: vi.fn(),
    onLaunch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("modal rendering", () => {
    it("renders without crashing", () => {
      render(<DeviceSettingsModal {...defaultProps} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("has correct aria attributes", () => {
      render(<DeviceSettingsModal {...defaultProps} />);
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("renders as modal overlay", () => {
      const { container } = render(<DeviceSettingsModal {...defaultProps} />);
      expect(container.querySelector(".modal-overlay")).toBeInTheDocument();
    });

    it("renders modal content", () => {
      const { container } = render(<DeviceSettingsModal {...defaultProps} />);
      expect(container.querySelector(".modal-content")).toBeInTheDocument();
    });
  });

  describe("device name input", () => {
    it("displays device name input", () => {
      render(<DeviceSettingsModal {...defaultProps} />);
      expect(screen.getByLabelText(/device name/i)).toBeInTheDocument();
    });

    it("shows current device name", () => {
      render(<DeviceSettingsModal {...defaultProps} />);
      const nameInput = screen.getByLabelText(
        /device name/i,
      ) as HTMLInputElement;
      expect(nameInput.value).toBe("Test Device");
    });

    it("calls onSettingsChange when name is changed", () => {
      const onSettingsChange = vi.fn();
      render(
        <DeviceSettingsModal
          {...defaultProps}
          onSettingsChange={onSettingsChange}
        />,
      );

      const nameInput = screen.getByLabelText(/device name/i);
      fireEvent.change(nameInput, { target: { value: "New Device Name" } });

      expect(onSettingsChange).toHaveBeenCalledWith({
        name: "New Device Name",
      });
    });

    it("has placeholder text", () => {
      render(
        <DeviceSettingsModal
          {...defaultProps}
          settings={{ ...mockSettings, name: "" }}
        />,
      );
      const nameInput = screen.getByLabelText(/device name/i);
      expect(nameInput).toHaveAttribute("placeholder", "Device name");
    });
  });

  describe("settings panels", () => {
    it("displays settings panel container", () => {
      const { container } = render(<DeviceSettingsModal {...defaultProps} />);
      expect(container.querySelector(".modal-body")).toBeInTheDocument();
    });

    it("renders VideoSourcePanel", () => {
      const { container } = render(<DeviceSettingsModal {...defaultProps} />);
      // Check for video source panel content using a more specific selector
      expect(container.textContent?.toLowerCase()).toContain("video source");
    });

    it("renders DisplayPanel", () => {
      const { container } = render(<DeviceSettingsModal {...defaultProps} />);
      expect(container.textContent?.toLowerCase()).toContain("display");
    });

    it("renders WindowPanel", () => {
      const { container } = render(<DeviceSettingsModal {...defaultProps} />);
      expect(container.textContent?.toLowerCase()).toContain("window");
    });

    it("renders BehaviorPanel", () => {
      render(<DeviceSettingsModal {...defaultProps} />);
      expect(screen.getByText(/behavior/i)).toBeInTheDocument();
    });

    it("renders AudioPanel", () => {
      const { container } = render(<DeviceSettingsModal {...defaultProps} />);
      expect(container.textContent?.toLowerCase()).toContain("audio");
    });
  });

  describe("close on cancel", () => {
    it("closes when clicking overlay", () => {
      const onClose = vi.fn();
      const { container } = render(
        <DeviceSettingsModal {...defaultProps} onClose={onClose} />,
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
        <DeviceSettingsModal {...defaultProps} onClose={onClose} />,
      );

      const modalContent = container.querySelector(".modal-content");
      if (modalContent) {
        fireEvent.click(modalContent);
      }

      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes on Escape key", () => {
      const onClose = vi.fn();
      render(<DeviceSettingsModal {...defaultProps} onClose={onClose} />);

      const dialog = screen.getByRole("dialog");
      fireEvent.keyDown(dialog, { key: "Escape" });

      expect(onClose).toHaveBeenCalled();
    });

    it("calls onSave when closing", () => {
      const onSave = vi.fn();
      const onClose = vi.fn();
      render(
        <DeviceSettingsModal
          {...defaultProps}
          onSave={onSave}
          onClose={onClose}
        />,
      );

      const dialog = screen.getByRole("dialog");
      fireEvent.keyDown(dialog, { key: "Escape" });

      expect(onSave).toHaveBeenCalledWith(mockSettings);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("launch button", () => {
    it("displays Launch Mirroring button", () => {
      render(<DeviceSettingsModal {...defaultProps} />);
      expect(screen.getByText(/launch mirroring/i)).toBeInTheDocument();
    });

    it("calls onLaunch when clicked", () => {
      const onLaunch = vi.fn();
      render(<DeviceSettingsModal {...defaultProps} onLaunch={onLaunch} />);

      const launchButton = screen.getByText(/launch mirroring/i);
      fireEvent.click(launchButton);

      expect(onLaunch).toHaveBeenCalled();
    });

    it("is disabled when there are blocking errors", async () => {
      const { useCommandValidation } =
        await import("../hooks/useCommandValidation");
      vi.mocked(useCommandValidation).mockReturnValueOnce({
        config: { options: {} },
        validation: {
          isValid: false,
          errors: [{ option: "test", message: "Error", code: "ERR" }],
          warnings: [],
          optionStates: {},
        },
        updateOption: vi.fn(),
        validateConfig: vi.fn(),
        errors: [{ option: "test", message: "Error", code: "ERR" }],
        warnings: [],
        isValid: false,
      });

      render(<DeviceSettingsModal {...defaultProps} />);

      const launchButton = screen.getByText(/launch mirroring/i);
      expect(launchButton).toBeDisabled();
    });
  });

  describe("copy command button", () => {
    it("displays Copy Command button", () => {
      render(<DeviceSettingsModal {...defaultProps} />);
      expect(screen.getByText(/copy command/i)).toBeInTheDocument();
    });

    it("copies command to clipboard when clicked", async () => {
      const clipboardWrite = vi.fn();
      Object.assign(navigator, {
        clipboard: { writeText: clipboardWrite },
      });

      render(<DeviceSettingsModal {...defaultProps} />);

      const copyButton = screen.getByText(/copy command/i);
      fireEvent.click(copyButton);

      expect(clipboardWrite).toHaveBeenCalled();
    });
  });

  describe("wireless device", () => {
    it("shows wireless connection info for wireless devices", () => {
      const wirelessDevice: Device = {
        ...mockDevice,
        serial: "192.168.1.100:5555",
        is_wireless: true,
      };

      render(
        <DeviceSettingsModal
          {...defaultProps}
          device={wirelessDevice}
          serial={wirelessDevice.serial}
        />,
      );

      expect(screen.getByDisplayValue(/192.168.1.100/)).toBeInTheDocument();
    });

    it("shows port input for wireless devices", () => {
      const wirelessDevice: Device = {
        ...mockDevice,
        serial: "192.168.1.100:5555",
        is_wireless: true,
      };

      render(
        <DeviceSettingsModal
          {...defaultProps}
          device={wirelessDevice}
          serial={wirelessDevice.serial}
        />,
      );

      expect(screen.getByLabelText(/port/i)).toBeInTheDocument();
    });
  });

  describe("feature flags", () => {
    it("passes canUhidInput to InputControlPanel", () => {
      render(<DeviceSettingsModal {...defaultProps} canUhidInput={true} />);
      expect(screen.getByText(/input & control/i)).toBeInTheDocument();
    });

    it("passes canAudio to AudioPanel", () => {
      render(<DeviceSettingsModal {...defaultProps} canAudio={true} />);
      expect(screen.getByText(/audio/i)).toBeInTheDocument();
    });

    it("passes canCamera to VideoSourcePanel", () => {
      render(<DeviceSettingsModal {...defaultProps} canCamera={true} />);
      expect(screen.getByText(/video source/i)).toBeInTheDocument();
    });

    it("passes canVirtualDisplay to VirtualDisplayPanel", () => {
      render(
        <DeviceSettingsModal {...defaultProps} canVirtualDisplay={true} />,
      );
      expect(screen.getByText(/virtual display/i)).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles undefined device", () => {
      render(<DeviceSettingsModal {...defaultProps} device={undefined} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("handles device without model", () => {
      const deviceWithoutModel: Device = {
        ...mockDevice,
        model: null,
      };

      render(
        <DeviceSettingsModal {...defaultProps} device={deviceWithoutModel} />,
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("handles device without android version", () => {
      const deviceWithoutAndroid: Device = {
        ...mockDevice,
        android_version: null,
      };

      render(
        <DeviceSettingsModal {...defaultProps} device={deviceWithoutAndroid} />,
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("handles empty settings", () => {
      render(
        <DeviceSettingsModal
          {...defaultProps}
          settings={DEFAULT_DEVICE_SETTINGS}
        />,
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });
});
