/**
 * Health Warning Utilities Tests
 */

import { describe, it, expect } from "vitest";
import {
  shouldShowBatteryWarning,
  shouldShowStorageWarning,
  getBatteryWarningLevel,
  getStorageWarningLevel,
  formatBytes,
  getBatteryDisplay,
  getStorageDisplay,
} from "./health-warnings";

describe("Health Warning Utilities", () => {
  describe("shouldShowBatteryWarning", () => {
    it("returns true for percentage <= 10", () => {
      expect(shouldShowBatteryWarning(10)).toBe(true);
      expect(shouldShowBatteryWarning(5)).toBe(true);
      expect(shouldShowBatteryWarning(0)).toBe(true);
    });

    it("returns false for percentage > 10", () => {
      expect(shouldShowBatteryWarning(11)).toBe(false);
      expect(shouldShowBatteryWarning(50)).toBe(false);
      expect(shouldShowBatteryWarning(100)).toBe(false);
    });
  });

  describe("shouldShowStorageWarning", () => {
    it("returns true for free < 200MB", () => {
      expect(shouldShowStorageWarning(100 * 1024 * 1024)).toBe(true);
      expect(shouldShowStorageWarning(1 * 1024 * 1024)).toBe(true);
      expect(shouldShowStorageWarning(0)).toBe(true);
    });

    it("returns false for free >= 200MB", () => {
      expect(shouldShowStorageWarning(200 * 1024 * 1024)).toBe(false);
      expect(shouldShowStorageWarning(500 * 1024 * 1024)).toBe(false);
      expect(shouldShowStorageWarning(1024 * 1024 * 1024)).toBe(false);
    });
  });

  describe("getBatteryWarningLevel", () => {
    it("returns critical for percentage <= 5", () => {
      expect(getBatteryWarningLevel(0)).toBe("critical");
      expect(getBatteryWarningLevel(3)).toBe("critical");
      expect(getBatteryWarningLevel(5)).toBe("critical");
    });

    it("returns warning for percentage 6-10", () => {
      expect(getBatteryWarningLevel(6)).toBe("warning");
      expect(getBatteryWarningLevel(8)).toBe("warning");
      expect(getBatteryWarningLevel(10)).toBe("warning");
    });

    it("returns none for percentage > 10", () => {
      expect(getBatteryWarningLevel(11)).toBe("none");
      expect(getBatteryWarningLevel(50)).toBe("none");
      expect(getBatteryWarningLevel(100)).toBe("none");
    });
  });

  describe("getStorageWarningLevel", () => {
    it("returns critical for free < 200MB", () => {
      expect(getStorageWarningLevel(100 * 1024 * 1024)).toBe("critical");
      expect(getStorageWarningLevel(0)).toBe("critical");
    });

    it("returns warning for free 200-500MB", () => {
      expect(getStorageWarningLevel(200 * 1024 * 1024)).toBe("warning");
      expect(getStorageWarningLevel(300 * 1024 * 1024)).toBe("warning");
      expect(getStorageWarningLevel(400 * 1024 * 1024)).toBe("warning");
    });

    it("returns none for free >= 500MB", () => {
      expect(getStorageWarningLevel(500 * 1024 * 1024)).toBe("none");
      expect(getStorageWarningLevel(600 * 1024 * 1024)).toBe("none");
      expect(getStorageWarningLevel(1024 * 1024 * 1024)).toBe("none");
    });
  });

  describe("formatBytes", () => {
    it("formats bytes to MB", () => {
      expect(formatBytes(100 * 1024 * 1024)).toBe("100.0 MB");
    });

    it("formats bytes to GB", () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GB");
      expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
    });

    it("respects decimal places parameter", () => {
      expect(formatBytes(2534 * 1024 * 1024, 2)).toBe("2.47 GB");
    });

    it("handles zero bytes", () => {
      expect(formatBytes(0)).toBe("0.0 MB");
    });
  });

  describe("getBatteryDisplay", () => {
    it("returns critical display for percentage <= 5", () => {
      const display = getBatteryDisplay(3);
      expect(display.level).toBe("critical");
      expect(display.color).toBe("#f44336");
      expect(display.cssClass).toBe("battery-critical");
    });

    it("returns warning display for percentage 6-10", () => {
      const display = getBatteryDisplay(8);
      expect(display.level).toBe("warning");
      expect(display.color).toBe("#ff9800");
      expect(display.cssClass).toBe("battery-warning");
    });

    it("returns good display for percentage > 10", () => {
      const display = getBatteryDisplay(50);
      expect(display.level).toBe("good");
      expect(display.color).toBe("#4caf50");
      expect(display.cssClass).toBe("battery-good");
    });
  });

  describe("getStorageDisplay", () => {
    it("returns critical display for free < 200MB", () => {
      const display = getStorageDisplay(100 * 1024 * 1024);
      expect(display.level).toBe("critical");
      expect(display.color).toBe("#f44336");
      expect(display.cssClass).toBe("storage-critical");
    });

    it("returns warning display for free 200-500MB", () => {
      const display = getStorageDisplay(300 * 1024 * 1024);
      expect(display.level).toBe("warning");
      expect(display.color).toBe("#ff9800");
      expect(display.cssClass).toBe("storage-warning");
    });

    it("returns good display for free > 500MB", () => {
      const display = getStorageDisplay(1024 * 1024 * 1024);
      expect(display.level).toBe("good");
      expect(display.color).toBe("#4caf50");
      expect(display.cssClass).toBe("storage-good");
    });
  });
});
