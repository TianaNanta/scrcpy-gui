/**
 * useDeviceHealth Hook
 *
 * Subscribes to device health updates and provides current health state
 * for a specific device.
 *
 * Usage:
 * ```tsx
 * const { health, isPolling, error, refresh } = useDeviceHealth(deviceId);
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import {
  DeviceHealth,
  DeviceHealthUpdateEvent,
  PollingErrorEvent,
} from "../types/health";

interface UseDeviceHealthReturn {
  health: DeviceHealth | null;
  isPolling: boolean;
  error: PollingErrorEvent | null;
  refresh: () => Promise<void>;
  loading: boolean;
}

/**
 * Hook to subscribe to health updates for a specific device
 */
export function useDeviceHealth(deviceId: string): UseDeviceHealthReturn {
  const [health, setHealth] = useState<DeviceHealth | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<PollingErrorEvent | null>(null);
  const [loading, setLoading] = useState(false);

  // Refresh health data on demand
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await invoke<{
        health: DeviceHealth | null;
        isCached: boolean;
        cacheAge: number;
      }>("get_device_health", { deviceId });

      if (response.health) {
        setHealth(response.health);
      }
    } catch (err) {
      console.error(`Failed to refresh health for ${deviceId}:`, err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    let unlistenUpdate: UnlistenFn | null = null;
    let unlistenError: UnlistenFn | null = null;
    let unlistenStarted: UnlistenFn | null = null;
    let unlistenStopped: UnlistenFn | null = null;

    const setupListeners = async () => {
      try {
        // Listen for health updates for this device
        unlistenUpdate = await listen<DeviceHealthUpdateEvent>(
          "device-health-update",
          (event) => {
            if (event.payload.deviceId === deviceId) {
              setHealth(event.payload.health);
              setError(null); // Clear error on successful update
            }
          },
        );

        // Listen for errors for this device
        unlistenError = await listen<PollingErrorEvent>(
          "polling-error",
          (event) => {
            if (event.payload.deviceId === deviceId) {
              setError(event.payload);
            }
          },
        );

        // Listen for polling start
        unlistenStarted = await listen("polling-started", () => {
          setIsPolling(true);
        });

        // Listen for polling stop
        unlistenStopped = await listen("polling-stopped", () => {
          setIsPolling(false);
        });

        // Initial refresh
        await refresh();
      } catch (err) {
        console.error("Failed to setup health listeners:", err);
      }
    };

    setupListeners();

    return () => {
      unlistenUpdate?.();
      unlistenError?.();
      unlistenStarted?.();
      unlistenStopped?.();
    };
  }, [deviceId, refresh]);

  return {
    health,
    isPolling,
    error,
    refresh,
    loading,
  };
}
