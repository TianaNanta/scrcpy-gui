/**
 * useLogger Hook
 *
 * Manages application logging with timestamps and persistence.
 * Logs are automatically persisted to localStorage and limited to a maximum count.
 *
 * @param maxLogs - Maximum number of logs to keep (default: 100)
 * @returns Object containing logs array and logging functions
 * @example
 * const { logs, addLog, clearLogs } = useLogger();
 * addLog("Device connected", "SUCCESS");
 * addLog("Connection failed", "ERROR");
 */

import { useState, useCallback, useEffect } from "react";
import type { LogEntry, LogLevel } from "../types/settings";

const MAX_LOGS = 100;
const STORAGE_KEY = "scrcpy-logs";

/**
 * Return type for useLogger hook
 */
export interface UseLoggerReturn {
  /** Array of log entries, most recent last */
  logs: LogEntry[];
  /** Add a new log entry */
  addLog: (message: string, level?: LogLevel) => void;
  /** Clear all logs */
  clearLogs: () => void;
}

export function useLogger(maxLogs: number = MAX_LOGS): UseLoggerReturn {
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.slice(-maxLogs);
        }
      }
    } catch {
      // Ignore parsing errors
    }
    return [];
  });

  const addLog = useCallback(
    (message: string, level: LogLevel = "INFO") => {
      setLogs((prev) => {
        const newLog: LogEntry = {
          timestamp: new Date().toISOString(),
          level,
          message,
        };
        const updated = [...prev, newLog];
        return updated.slice(-maxLogs);
      });
    },
    [maxLogs],
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Persist logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch {
      // Storage might be full or unavailable
    }
  }, [logs]);

  return {
    logs,
    addLog,
    clearLogs,
  };
}
