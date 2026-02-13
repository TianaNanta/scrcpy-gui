/**
 * Error Messages & Troubleshooting Suggestions
 *
 * Provides user-friendly error messages and actionable troubleshooting steps
 * for common device connection failures.
 */

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
