/**
 * Error Messages & Troubleshooting Suggestions
 *
 * Provides user-friendly error messages and actionable troubleshooting steps
 * for common device connection failures.
 */

/**
 * Context identifiers for different error scenarios
 */
export type ErrorContext =
  | "device-connect"
  | "device-disconnect"
  | "device-register"
  | "wireless-pair"
  | "wireless-connect"
  | "adb-command"
  | "scrcpy-launch"
  | "scrcpy-exit"
  | "settings-load"
  | "settings-save"
  | "preset-load"
  | "preset-save"
  | "health-poll"
  | "unknown";

/**
 * Error context constants for consistent error handling across the application
 */
export const ERROR_CONTEXTS: Record<ErrorContext, string> = {
  "device-connect": "Device connection",
  "device-disconnect": "Device disconnection",
  "device-register": "Device registration",
  "wireless-pair": "Wireless pairing",
  "wireless-connect": "Wireless connection",
  "adb-command": "ADB command",
  "scrcpy-launch": "Scrcpy launch",
  "scrcpy-exit": "Scrcpy process",
  "settings-load": "Settings load",
  "settings-save": "Settings save",
  "preset-load": "Preset load",
  "preset-save": "Preset save",
  "health-poll": "Health polling",
  unknown: "Unknown operation",
};

export interface ErrorSuggestion {
  title: string;
  steps: string[];
  docLink?: string;
}

const ERROR_SUGGESTIONS: Record<string, ErrorSuggestion> = {
  offline: {
    title: "Device is offline or disconnected",
    steps: [
      "Check if the device USB cable is properly connected",
      "Enable USB debugging on the device (Settings > Developer Options > USB Debugging)",
      "Restart the device and try again",
      "If using WiFi connection, ensure device and computer are on the same network",
      "Restart ADB server: Run 'adb kill-server' then reconnect",
    ],
    docLink: "https://developer.android.com/studio/command-line/adb",
  },

  timeout: {
    title: "Connection timeout - device is not responding",
    steps: [
      "Check if the device is awake and unlocked",
      "Reduce network latency (move closer for WiFi connections)",
      "Check device system logs for errors",
      "Restart the device",
      "Try reconnecting via USB instead of WiFi",
    ],
  },

  permission_denied: {
    title: "Permission denied - cannot access device",
    steps: [
      "Enable USB Debugging: Settings > Developer Options > USB Debugging",
      "Accept the USB authorization dialog on the device",
      "Revoke USB debugging authorization and reconnect (if previously authorized)",
      "Check that ADB has proper system permissions",
    ],
  },

  adb_error: {
    title: "ADB communication error",
    steps: [
      "Ensure ADB is properly installed and in your system PATH",
      "Restart the ADB server: 'adb kill-server'",
      "Check for ADB process conflicts (close other Android tools)",
      "Update ADB to the latest version",
    ],
  },

  parse_error: {
    title: "Failed to parse device information",
    steps: [
      "This is often a temporary issue - try again in a few seconds",
      "Update the device's OS to the latest version",
      "Check device system logs for corruption",
      "Factory reset device if problem persists (warning: data loss)",
    ],
  },

  network_error: {
    title: "Network connectivity issue",
    steps: [
      "For WiFi devices: Check network connection and try moving closer to router",
      "Ensure device and computer are on the same network",
      "Disable VPN if using one, as it may interfere with local connection",
      "Check firewall settings - ensure ADB port (5555) is not blocked",
      "Restart both device and computer networking",
    ],
  },
};

/**
 * Get a friendly error message with troubleshooting suggestions
 *
 * @param errorCode - The error code from PollingErrorEvent
 * @returns Suggestion object with title and action steps
 */
export function getFriendlyErrorMessage(errorCode: string): ErrorSuggestion {
  const normalized = errorCode.toLowerCase().replace(/[_-]/g, "_");

  return (
    ERROR_SUGGESTIONS[normalized] || {
      title: "Connection error",
      steps: [
        "Verify device is connected and powered on",
        "Check USB cable connection or WiFi network",
        "Restart the device",
        "Restart ADB: 'adb kill-server'",
        "Check system logs for more details",
      ],
    }
  );
}

/**
 * Get a brief error description for display
 */
export function getErrorDescription(errorCode: string): string {
  const suggestion = getFriendlyErrorMessage(errorCode);
  return suggestion.title;
}

/**
 * Extract a user-friendly error message from any error type
 *
 * @param error - The error to extract message from (Error, string, or unknown)
 * @param context - Optional context describing the operation that failed
 * @returns A user-friendly error message string
 * @example
 * try {
 *   await connectDevice();
 * } catch (error) {
 *   const message = getErrorMessage(error, "device-connect");
 *   addLog(message, "ERROR");
 * }
 */
export function getErrorMessage(
  error: unknown,
  context?: ErrorContext,
): string {
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = "An unknown error occurred";
  }

  if (context && context !== "unknown") {
    const contextLabel = ERROR_CONTEXTS[context];
    return `${contextLabel} failed: ${message}`;
  }

  return message;
}

/**
 * Check if an error indicates a network-related failure
 *
 * @param error - The error to check
 * @returns True if the error appears to be network-related
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error) && typeof error !== "string") {
    return false;
  }

  const message = error instanceof Error ? error.message : error;
  const lowerMessage = message.toLowerCase();

  return (
    lowerMessage.includes("network") ||
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("connection refused") ||
    lowerMessage.includes("econnrefused") ||
    lowerMessage.includes("enotfound") ||
    lowerMessage.includes("etimedout") ||
    lowerMessage.includes("socket hang up")
  );
}

/**
 * Check if an error indicates a permission-related failure
 *
 * @param error - The error to check
 * @returns True if the error appears to be permission-related
 */
export function isPermissionError(error: unknown): boolean {
  if (!(error instanceof Error) && typeof error !== "string") {
    return false;
  }

  const message = error instanceof Error ? error.message : error;
  const lowerMessage = message.toLowerCase();

  return (
    lowerMessage.includes("permission") ||
    lowerMessage.includes("unauthorized") ||
    lowerMessage.includes("access denied") ||
    lowerMessage.includes("eacces")
  );
}
