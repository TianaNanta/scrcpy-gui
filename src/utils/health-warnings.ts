/**
 * Health Warning Utilities
 *
 * Helper functions for determining when to show battery and storage warnings
 * based on device health thresholds.
 */

/**
 * Determine if battery percentage warrants a warning
 * @param percentage - Battery percentage (0-100)
 * @returns true if percentage <= 10
 */
export function shouldShowBatteryWarning(percentage: number): boolean {
  return percentage <= 10;
}

/**
 * Determine if available storage warrants a warning
 * @param free - Available storage in bytes
 * @returns true if free < 200MB
 */
export function shouldShowStorageWarning(free: number): boolean {
  const TWO_HUNDRED_MB = 200 * 1024 * 1024; // 200MB in bytes
  return free < TWO_HUNDRED_MB;
}

/**
 * Determine warning level for battery
 * @param percentage - Battery percentage (0-100)
 * @returns 'critical' if <=5%, 'warning' if <=10%, 'none' otherwise
 */
export function getBatteryWarningLevel(
  percentage: number,
): "critical" | "warning" | "none" {
  if (percentage <= 5) {
    return "critical";
  }
  if (percentage <= 10) {
    return "warning";
  }
  return "none";
}

/**
 * Determine warning level for storage
 * @param free - Available storage in bytes
 * @returns 'critical' if <200MB, 'warning' if <500MB, 'none' otherwise
 */
export function getStorageWarningLevel(
  free: number,
): "critical" | "warning" | "none" {
  const TWO_HUNDRED_MB = 200 * 1024 * 1024;
  const FIVE_HUNDRED_MB = 500 * 1024 * 1024;

  if (free < TWO_HUNDRED_MB) {
    return "critical";
  }
  if (free < FIVE_HUNDRED_MB) {
    return "warning";
  }
  return "none";
}

/**
 * Format bytes to human-readable GB string
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string like "25.3 GB"
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  const GB = 1024 * 1024 * 1024;
  const MB = 1024 * 1024;

  if (bytes >= GB) {
    return `${(bytes / GB).toFixed(decimals)} GB`;
  }
  return `${(bytes / MB).toFixed(decimals)} MB`;
}

/**
 * Format percentage as string with color class
 * @param percentage - Battery percentage
 * @returns Object with level, color, and CSS class
 */
export function getBatteryDisplay(percentage: number): {
  level: "critical" | "warning" | "good";
  color: string;
  cssClass: string;
} {
  const warningLevel = getBatteryWarningLevel(percentage);

  if (warningLevel === "critical") {
    return {
      level: "critical",
      color: "#f44336", // Red
      cssClass: "battery-critical",
    };
  }

  if (warningLevel === "warning") {
    return {
      level: "warning",
      color: "#ff9800", // Orange
      cssClass: "battery-warning",
    };
  }

  return {
    level: "good",
    color: "#4caf50", // Green
    cssClass: "battery-good",
  };
}

/**
 * Format storage warning level with color
 * @param free - Available storage in bytes
 * @returns Object with level, color, and CSS class
 */
export function getStorageDisplay(free: number): {
  level: "critical" | "warning" | "good";
  color: string;
  cssClass: string;
} {
  const warningLevel = getStorageWarningLevel(free);

  if (warningLevel === "critical") {
    return {
      level: "critical",
      color: "#f44336", // Red
      cssClass: "storage-critical",
    };
  }

  if (warningLevel === "warning") {
    return {
      level: "warning",
      color: "#ff9800", // Orange
      cssClass: "storage-warning",
    };
  }

  return {
    level: "good",
    color: "#4caf50", // Green
    cssClass: "storage-good",
  };
}
