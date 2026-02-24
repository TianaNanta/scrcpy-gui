/**
 * useLogger Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLogger } from "./useLogger";
import type { LogEntry } from "../types/settings";

describe("useLogger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage manually
    try {
      localStorage.removeItem("scrcpy-logs");
    } catch {
      // Ignore errors
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("initializes with empty logs array", () => {
      const { result } = renderHook(() => useLogger());
      expect(result.current.logs).toEqual([]);
    });

    it("provides addLog function", () => {
      const { result } = renderHook(() => useLogger());
      expect(typeof result.current.addLog).toBe("function");
    });

    it("provides clearLogs function", () => {
      const { result } = renderHook(() => useLogger());
      expect(typeof result.current.clearLogs).toBe("function");
    });

    it("loads logs from localStorage on init", () => {
      const savedLogs: LogEntry[] = [
        {
          timestamp: "2024-01-01T00:00:00.000Z",
          level: "INFO",
          message: "Test",
        },
      ];
      localStorage.setItem("scrcpy-logs", JSON.stringify(savedLogs));

      const { result } = renderHook(() => useLogger());
      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0].message).toBe("Test");
    });

    it("handles invalid localStorage data gracefully", () => {
      localStorage.setItem("scrcpy-logs", "invalid-json");

      const { result } = renderHook(() => useLogger());
      expect(result.current.logs).toEqual([]);
    });
  });

  describe("addLog function", () => {
    it("adds a log entry with timestamp", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        result.current.addLog("Test message");
      });

      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0].message).toBe("Test message");
      expect(result.current.logs[0].timestamp).toBeDefined();
    });

    it("defaults log level to INFO", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        result.current.addLog("Test message");
      });

      expect(result.current.logs[0].level).toBe("INFO");
    });

    it("accepts custom log level", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        result.current.addLog("Error occurred", "ERROR");
      });

      expect(result.current.logs[0].level).toBe("ERROR");
    });

    it("accepts WARN level", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        result.current.addLog("Warning message", "WARN");
      });

      expect(result.current.logs[0].level).toBe("WARN");
    });

    it("accepts DEBUG level", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        result.current.addLog("Debug info", "DEBUG");
      });

      expect(result.current.logs[0].level).toBe("DEBUG");
    });

    it("appends to existing logs", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        result.current.addLog("First message");
        result.current.addLog("Second message");
      });

      expect(result.current.logs).toHaveLength(2);
      expect(result.current.logs[0].message).toBe("First message");
      expect(result.current.logs[1].message).toBe("Second message");
    });
  });

  describe("log count limiting", () => {
    it("limits logs to maxLogs count", () => {
      const { result } = renderHook(() => useLogger(5));

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addLog(`Message ${i}`);
        }
      });

      expect(result.current.logs).toHaveLength(5);
    });

    it("keeps most recent logs when limit exceeded", () => {
      const { result } = renderHook(() => useLogger(3));

      act(() => {
        result.current.addLog("Message 1");
        result.current.addLog("Message 2");
        result.current.addLog("Message 3");
        result.current.addLog("Message 4");
        result.current.addLog("Message 5");
      });

      expect(result.current.logs).toHaveLength(3);
      expect(result.current.logs[0].message).toBe("Message 3");
      expect(result.current.logs[2].message).toBe("Message 5");
    });

    it("uses default maxLogs of 100", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        for (let i = 0; i < 150; i++) {
          result.current.addLog(`Message ${i}`);
        }
      });

      expect(result.current.logs).toHaveLength(100);
    });
  });

  describe("persistence", () => {
    it("persists logs to localStorage", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        result.current.addLog("Persist me");
      });

      const saved = localStorage.getItem("scrcpy-logs");
      expect(saved).toBeDefined();
      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].message).toBe("Persist me");
    });

    it("updates localStorage on each log addition", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        result.current.addLog("First");
      });

      let saved = JSON.parse(localStorage.getItem("scrcpy-logs") || "[]");
      expect(saved).toHaveLength(1);

      act(() => {
        result.current.addLog("Second");
      });

      saved = JSON.parse(localStorage.getItem("scrcpy-logs") || "[]");
      expect(saved).toHaveLength(2);
    });
  });

  describe("clearLogs function", () => {
    it("clears all logs", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        result.current.addLog("Message 1");
        result.current.addLog("Message 2");
      });

      expect(result.current.logs).toHaveLength(2);

      act(() => {
        result.current.clearLogs();
      });

      expect(result.current.logs).toHaveLength(0);
    });

    it("persists cleared state to localStorage", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        result.current.addLog("Message");
        result.current.clearLogs();
      });

      const saved = localStorage.getItem("scrcpy-logs");
      expect(saved).toBe("[]");
    });
  });

  describe("edge cases", () => {
    it("handles rapid log additions", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addLog(`Rapid ${i}`);
        }
      });

      expect(result.current.logs).toHaveLength(100);
    });

    it("handles empty message", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        result.current.addLog("");
      });

      expect(result.current.logs).toHaveLength(1);
      expect(result.current.logs[0].message).toBe("");
    });

    it("handles special characters in message", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        result.current.addLog("Special: \n\t\"'<>&");
      });

      expect(result.current.logs[0].message).toBe("Special: \n\t\"'<>&");
    });

    it("handles long messages", () => {
      const { result } = renderHook(() => useLogger());
      const longMessage = "A".repeat(10000);

      act(() => {
        result.current.addLog(longMessage);
      });

      expect(result.current.logs[0].message).toBe(longMessage);
    });

    it("generates valid ISO timestamp", () => {
      const { result } = renderHook(() => useLogger());

      act(() => {
        result.current.addLog("Test");
      });

      const timestamp = result.current.logs[0].timestamp;
      const date = new Date(timestamp);
      expect(date.toISOString()).toBe(timestamp);
    });
  });
});
