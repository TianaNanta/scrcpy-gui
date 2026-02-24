/**
 * Error Messages Utility Tests
 */

import { describe, it, expect } from "vitest";
import {
  getFriendlyErrorMessage,
  getErrorDescription,
  getErrorMessage,
  isNetworkError,
  isPermissionError,
  ERROR_CONTEXTS,
  type ErrorSuggestion,
  type ErrorContext,
} from "./error-messages";

describe("error-messages", () => {
  describe("getFriendlyErrorMessage", () => {
    it("returns error suggestion for known error code", () => {
      const result = getFriendlyErrorMessage("offline");
      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("steps");
      expect(result.title).toBe("Device is offline or disconnected");
      expect(result.steps).toBeInstanceOf(Array);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it("returns error suggestion for error code with underscores", () => {
      const result = getFriendlyErrorMessage("permission_denied");
      expect(result.title).toBe("Permission denied - cannot access device");
    });

    it("returns error suggestion for error code with hyphens", () => {
      const result = getFriendlyErrorMessage("permission-denied");
      expect(result.title).toBe("Permission denied - cannot access device");
    });

    it("handles case-insensitive error codes", () => {
      const result = getFriendlyErrorMessage("OFFLINE");
      expect(result.title).toBe("Device is offline or disconnected");
    });

    it("returns fallback suggestion for unknown error code", () => {
      const result = getFriendlyErrorMessage("unknown_error_code");
      expect(result.title).toBe("Connection error");
      expect(result.steps).toContain(
        "Verify device is connected and powered on",
      );
    });

    it("returns fallback suggestion for empty string", () => {
      const result = getFriendlyErrorMessage("");
      expect(result.title).toBe("Connection error");
    });

    it("returns doc link for errors that have documentation", () => {
      const result = getFriendlyErrorMessage("offline");
      expect(result.docLink).toBeDefined();
    });

    it("returns suggestion for timeout error", () => {
      const result = getFriendlyErrorMessage("timeout");
      expect(result.title).toContain("timeout");
    });

    it("returns suggestion for adb_error", () => {
      const result = getFriendlyErrorMessage("adb_error");
      expect(result.title).toContain("ADB");
    });

    it("returns suggestion for network_error", () => {
      const result = getFriendlyErrorMessage("network_error");
      expect(result.title).toContain("Network");
    });

    it("returns suggestion for parse_error", () => {
      const result = getFriendlyErrorMessage("parse_error");
      expect(result.title).toContain("parse");
    });

    it("returns steps array with at least one step", () => {
      const errorCodes = [
        "offline",
        "timeout",
        "permission_denied",
        "adb_error",
        "parse_error",
        "network_error",
        "unknown",
      ];

      errorCodes.forEach((code) => {
        const result = getFriendlyErrorMessage(code);
        expect(result.steps.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("getErrorDescription", () => {
    it("returns title string for known error code", () => {
      const result = getErrorDescription("offline");
      expect(result).toBe("Device is offline or disconnected");
    });

    it("returns title string for unknown error code", () => {
      const result = getErrorDescription("unknown_code");
      expect(result).toBe("Connection error");
    });

    it("returns title string for error code with underscores", () => {
      const result = getErrorDescription("permission_denied");
      expect(result).toBe("Permission denied - cannot access device");
    });

    it("returns title string for empty error code", () => {
      const result = getErrorDescription("");
      expect(result).toBe("Connection error");
    });

    it("handles case-insensitive error codes", () => {
      const result = getErrorDescription("TIMEOUT");
      expect(result).toContain("timeout");
    });
  });

  describe("ErrorSuggestion type", () => {
    it("has required title and steps properties", () => {
      const suggestion: ErrorSuggestion = {
        title: "Test Error",
        steps: ["Step 1", "Step 2"],
      };

      expect(suggestion.title).toBe("Test Error");
      expect(suggestion.steps).toHaveLength(2);
    });

    it("can have optional docLink property", () => {
      const suggestion: ErrorSuggestion = {
        title: "Test Error",
        steps: ["Step 1"],
        docLink: "https://example.com/docs",
      };

      expect(suggestion.docLink).toBe("https://example.com/docs");
    });
  });

  describe("getErrorMessage", () => {
    it("extracts message from Error object", () => {
      const error = new Error("Test error message");
      const result = getErrorMessage(error);
      expect(result).toBe("Test error message");
    });

    it("returns string error as-is", () => {
      const result = getErrorMessage("String error");
      expect(result).toBe("String error");
    });

    it("returns fallback for unknown error type", () => {
      const result = getErrorMessage({ custom: "error" });
      expect(result).toBe("An unknown error occurred");
    });

    it("returns fallback for null", () => {
      const result = getErrorMessage(null);
      expect(result).toBe("An unknown error occurred");
    });

    it("returns fallback for undefined", () => {
      const result = getErrorMessage(undefined);
      expect(result).toBe("An unknown error occurred");
    });

    it("includes context when provided", () => {
      const error = new Error("Connection failed");
      const result = getErrorMessage(error, "device-connect");
      expect(result).toContain("Device connection failed:");
      expect(result).toContain("Connection failed");
    });

    it("does not include context for unknown context", () => {
      const error = new Error("Test error");
      const result = getErrorMessage(error, "unknown");
      expect(result).toBe("Test error");
    });
  });

  describe("isNetworkError", () => {
    it("returns true for network-related errors", () => {
      expect(isNetworkError(new Error("Network timeout"))).toBe(true);
      expect(isNetworkError(new Error("Connection refused"))).toBe(true);
      expect(isNetworkError("ECONNREFUSED")).toBe(true);
      expect(isNetworkError("ETIMEDOUT")).toBe(true);
      expect(isNetworkError("Socket hang up")).toBe(true);
      expect(isNetworkError("ENOTFOUND")).toBe(true);
    });

    it("returns false for non-network errors", () => {
      expect(isNetworkError(new Error("Permission denied"))).toBe(false);
      expect(isNetworkError("Something went wrong")).toBe(false);
    });

    it("returns false for non-Error/string types", () => {
      expect(isNetworkError(null)).toBe(false);
      expect(isNetworkError(undefined)).toBe(false);
      expect(isNetworkError({})).toBe(false);
    });
  });

  describe("isPermissionError", () => {
    it("returns true for permission-related errors", () => {
      expect(isPermissionError(new Error("Permission denied"))).toBe(true);
      expect(isPermissionError(new Error("Unauthorized access"))).toBe(true);
      expect(isPermissionError("Access denied")).toBe(true);
      expect(isPermissionError("EACCES")).toBe(true);
    });

    it("returns false for non-permission errors", () => {
      expect(isPermissionError(new Error("Network error"))).toBe(false);
      expect(isPermissionError("Timeout")).toBe(false);
    });

    it("returns false for non-Error/string types", () => {
      expect(isPermissionError(null)).toBe(false);
      expect(isPermissionError(undefined)).toBe(false);
      expect(isPermissionError({})).toBe(false);
    });
  });

  describe("ERROR_CONTEXTS", () => {
    it("has entries for all context types", () => {
      expect(ERROR_CONTEXTS["device-connect"]).toBe("Device connection");
      expect(ERROR_CONTEXTS["wireless-pair"]).toBe("Wireless pairing");
      expect(ERROR_CONTEXTS["scrcpy-launch"]).toBe("Scrcpy launch");
    });

    it("has unknown context fallback", () => {
      expect(ERROR_CONTEXTS["unknown"]).toBe("Unknown operation");
    });
  });

  describe("ErrorContext type", () => {
    it("allows valid context values", () => {
      const contexts: ErrorContext[] = [
        "device-connect",
        "wireless-pair",
        "unknown",
      ];
      expect(contexts.length).toBe(3);
    });
  });
});
