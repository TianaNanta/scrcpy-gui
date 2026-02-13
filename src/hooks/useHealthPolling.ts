/**
 * useHealthPolling Hook
 *
 * Manages the lifecycle of health polling service.
 * Starts polling when enabled, stops when disabled.
 *
 * Usage:
 * ```tsx
 * const { isActive, error, start, stop } = useHealthPolling({
 *   enabled: true,
 *   deviceIds: ['device1', 'device2'],
 *   config: DEFAULT_POLLING_CONFIG
 * });
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { HealthPollingConfig, PollingErrorEvent } from "../types/health";

interface UseHealthPollingParams {
  enabled: boolean;
  deviceIds: string[];
  config?: HealthPollingConfig;
}

interface UseHealthPollingReturn {
  isActive: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook to manage health polling service lifecycle
 */
export function useHealthPolling(
  params: UseHealthPollingParams,
): UseHealthPollingReturn {
  const { enabled, deviceIds, config } = params;

  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const start = useCallback(async () => {
    if (isActive || deviceIds.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      const resp = await invoke<{ success: boolean; message?: string }>(
        "start_health_polling",
        {
          deviceIds,
          config,
        },
      );

      if (resp.success) {
        setIsActive(true);
        setError(null);
      } else {
        setError(resp.message || "Failed to start polling");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
      console.error("Failed to start health polling:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isActive, deviceIds, config]);

  const stop = useCallback(async () => {
    if (!isActive) {
      return;
    }

    setIsLoading(true);
    try {
      const resp = await invoke<{ success: boolean; message?: string }>(
        "stop_health_polling",
        {},
      );

      if (resp.success) {
        setIsActive(false);
        setError(null);
      } else {
        setError(resp.message || "Failed to stop polling");
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
      console.error("Failed to stop health polling:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isActive]);

  // Auto start/stop based on enabled flag
  useEffect(() => {
    let unlistenError: UnlistenFn | null = null;

    const setupAutoControl = async () => {
      try {
        // Listen for polling errors to update state
        unlistenError = await listen<PollingErrorEvent>(
          "polling-error",
          (event) => {
            const payload = event.payload;
            // Only show error if this device is in our list
            if (deviceIds.includes(payload.deviceId)) {
              if (payload.willRetry) {
                // Keep current error showing "Reconnecting..." logic
                setError(
                  `Reconnecting... (attempt ${payload.attempt}/${payload.maxAttempts})`,
                );
              } else {
                // Final error after all retries exhausted
                setError(`Connection failed: ${payload.error.message}`);
              }
            }
          },
        );

        if (enabled && deviceIds.length > 0) {
          await start();
        } else if (!enabled && isActive) {
          await stop();
        }
      } catch (err) {
        console.error("Failed to setup auto polling control:", err);
      }
    };

    setupAutoControl();

    return () => {
      unlistenError?.();
    };
  }, [enabled, deviceIds, start, stop, isActive]);

  return {
    isActive,
    error,
    start,
    stop,
    isLoading,
  };
}
