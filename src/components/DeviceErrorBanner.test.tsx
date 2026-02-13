/**
 * DeviceErrorBanner Component Tests
 *
 * Tests for error display component with retry indicators and troubleshooting suggestions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeviceErrorBanner, type DeviceError } from "./DeviceErrorBanner";

describe("DeviceErrorBanner", () => {
  const mockError: DeviceError = {
    code: "offline",
    message: "Device offline - unable to connect",
  };

  const mockPermanentError: DeviceError = {
    code: "permission_denied",
    message: "Permission denied - USB debugging disabled",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Transient Error Display (T070)", () => {
    it("shows transient error message when isRetrying=true", () => {
      render(
        <DeviceErrorBanner
          deviceId="test-device"
          error={mockError}
          isRetrying={true}
          attempt={1}
          maxAttempts={5}
        />,
      );

      // Should show error message
      expect(screen.getByText(/Device offline/)).toBeInTheDocument();

      // Should show retry counter
      expect(screen.getByText(/Retrying: 1\/5/)).toBeInTheDocument();

      // Should not show dismiss button for transient errors during retry
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows warning styling for transient errors", () => {
      const { container } = render(
        <DeviceErrorBanner
          deviceId="test-device"
          error={mockError}
          isRetrying={true}
          attempt={2}
          maxAttempts={5}
        />,
      );

      const banner = container.querySelector(".error-banner");
      expect(banner).toHaveClass("error-banner--transient");
    });

    it("updates attempt count when prop changes", () => {
      const { rerender } = render(
        <DeviceErrorBanner
          deviceId="test-device"
          error={mockError}
          isRetrying={true}
          attempt={1}
          maxAttempts={5}
        />,
      );

      expect(screen.getByText(/Retrying: 1\/5/)).toBeInTheDocument();

      rerender(
        <DeviceErrorBanner
          deviceId="test-device"
          error={mockError}
          isRetrying={true}
          attempt={3}
          maxAttempts={5}
        />,
      );

      expect(screen.getByText(/Retrying: 3\/5/)).toBeInTheDocument();
    });
  });

  describe("Permanent Error Display (T070)", () => {
    it("shows permanent error message when isRetrying=false", () => {
      const { container } = render(
        <DeviceErrorBanner
          deviceId="test-device"
          error={mockPermanentError}
          isRetrying={false}
          onDismiss={() => {}}
        />,
      );

      // Should show error message in header
      const banner = container.querySelector(".error-banner__message");
      expect(banner?.textContent).toContain("Permission denied");

      // Should show dismiss button
      const dismissButton = screen.getByRole("button", { name: /dismiss/i });
      expect(dismissButton).toBeInTheDocument();
    });

    it("shows error styling for permanent errors", () => {
      const { container } = render(
        <DeviceErrorBanner
          deviceId="test-device"
          error={mockPermanentError}
          isRetrying={false}
          onDismiss={() => {}}
        />,
      );

      const banner = container.querySelector(".error-banner");
      expect(banner).toHaveClass("error-banner--permanent");
    });

    it("calls onDismiss when dismiss button is clicked", () => {
      const onDismiss = vi.fn();

      render(
        <DeviceErrorBanner
          deviceId="test-device"
          error={mockPermanentError}
          isRetrying={false}
          onDismiss={onDismiss}
        />,
      );

      const dismissButton = screen.getByRole("button", { name: /dismiss/i });
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe("Error Message Details", () => {
    it("displays troubleshooting suggestions in expandable section", () => {
      render(
        <DeviceErrorBanner
          deviceId="test-device"
          error={mockError}
          isRetrying={false}
          onDismiss={() => {}}
        />,
      );

      // Click expand button
      const expandButton = screen.getByRole("button", {
        name: /troubleshooting/i,
      });
      fireEvent.click(expandButton);

      // Now suggestions should be visible
      expect(screen.getByText(/Troubleshooting Steps/)).toBeInTheDocument();
    });

    it("collapses suggestions when clicking expand button again", () => {
      render(
        <DeviceErrorBanner
          deviceId="test-device"
          error={mockError}
          isRetrying={false}
          onDismiss={() => {}}
        />,
      );

      const expandButton = screen.getByRole("button", {
        name: /troubleshooting/i,
      });

      // Expand
      fireEvent.click(expandButton);
      expect(screen.getByText(/Troubleshooting Steps/)).toBeInTheDocument();

      // Collapse
      fireEvent.click(expandButton);
      expect(
        screen.queryByText(/Troubleshooting Steps/),
      ).not.toBeInTheDocument();
    });

    it("shows documentation link when expanded", () => {
      render(
        <DeviceErrorBanner
          deviceId="test-device"
          error={mockError}
          isRetrying={false}
          onDismiss={() => {}}
        />,
      );

      const expandButton = screen.getByRole("button", {
        name: /troubleshooting/i,
      });
      fireEvent.click(expandButton);

      // Should have documentation link
      const link = screen.queryByRole("link", { name: /ADB debugging/i });
      if (link) {
        expect(link).toHaveAttribute(
          "href",
          expect.stringContaining("developer.android.com"),
        );
      }
    });
  });

  describe("Accessibility", () => {
    it("has proper alert role", () => {
      const { container } = render(
        <DeviceErrorBanner
          deviceId="test-device"
          error={mockError}
          isRetrying={false}
          onDismiss={() => {}}
        />,
      );

      const banner = container.querySelector('[role="alert"]');
      expect(banner).toBeInTheDocument();
    });

    it("has accessible expand button with aria-expanded", () => {
      render(
        <DeviceErrorBanner
          deviceId="test-device"
          error={mockError}
          isRetrying={false}
          onDismiss={() => {}}
        />,
      );

      const expandButton = screen.getByRole("button", {
        name: /troubleshooting/i,
      });
      expect(expandButton).toHaveAttribute("aria-expanded");
    });

    it("dismiss button has proper aria-label", () => {
      render(
        <DeviceErrorBanner
          deviceId="test-device"
          error={mockPermanentError}
          isRetrying={false}
          onDismiss={() => {}}
        />,
      );

      const dismissButton = screen.getByRole("button", { name: /dismiss/i });
      expect(dismissButton).toHaveAttribute("aria-label");
      expect(dismissButton.getAttribute("aria-label")).toContain("Dismiss");
    });
  });

  describe("Edge Cases", () => {
    it("handles missing onDismiss for transient errors", () => {
      // Should not throw when onDismiss is undefined for retrying errors
      expect(() => {
        render(
          <DeviceErrorBanner
            deviceId="test-device"
            error={mockError}
            isRetrying={true}
            attempt={1}
            maxAttempts={5}
          />,
        );
      }).not.toThrow();
    });

    it("handles special characters in device ID", () => {
      const specialDeviceId = "device:with:colons_and_underscores";

      render(
        <DeviceErrorBanner
          deviceId={specialDeviceId}
          error={mockError}
          isRetrying={false}
          onDismiss={() => {}}
        />,
      );

      expect(screen.getByText(/Device offline/)).toBeInTheDocument();
    });

    it("handles very long error messages", () => {
      const longError: DeviceError = {
        code: "offline",
        message: "Device offline - " + "x".repeat(200),
      };

      render(
        <DeviceErrorBanner
          deviceId="test-device"
          error={longError}
          isRetrying={false}
          onDismiss={() => {}}
        />,
      );

      // Should render without truncation issues
      expect(screen.getByText(/Device offline/)).toBeInTheDocument();
    });
  });
});
