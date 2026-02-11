import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { DeviceSettings, LogEntry } from "../types/settings";
import { buildArgs } from "../utils/command-builder";

interface ScrcpyProcessState {
  activeDevices: string[];
  loading: boolean;
  startScrcpy: (serial: string, settings: DeviceSettings, addLog: (msg: string, level?: string) => void) => Promise<void>;
  stopScrcpy: (serial: string, addLog: (msg: string, level?: string) => void) => Promise<void>;
}

export function useScrcpyProcess(): ScrcpyProcessState {
  const [activeDevices, setActiveDevices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const startScrcpy = useCallback(
    async (
      serial: string,
      settings: DeviceSettings,
      addLog: (msg: string, level?: string) => void,
    ) => {
      setLoading(true);
      addLog(`Testing device connection: ${serial}`);
      try {
        await invoke("test_device", { serial });
        addLog(`Device test passed for: ${serial}`, "SUCCESS");
      } catch (e) {
        addLog(`Device test failed: ${e}`, "ERROR");
        setLoading(false);
        return;
      }

      addLog(`Starting scrcpy for device: ${serial}`);
      try {
        const args = buildArgs(serial, settings);
        await invoke("start_scrcpy", { serial, args });
        setActiveDevices((prev) => [...prev, serial]);
        addLog(
          `Scrcpy started successfully${settings.recordingEnabled ? " (recording enabled)" : ""}`,
          "SUCCESS",
        );
      } catch (e) {
        addLog(`Failed to start scrcpy: ${e}`, "ERROR");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const stopScrcpy = useCallback(
    async (serial: string, addLog: (msg: string, level?: string) => void) => {
      try {
        await invoke("stop_scrcpy", { serial });
        setActiveDevices((prev) => prev.filter((s) => s !== serial));
        addLog(`Scrcpy stopped for device: ${serial}`, "SUCCESS");
      } catch (e) {
        addLog(`Failed to stop scrcpy: ${e}`, "ERROR");
      }
    },
    [],
  );

  return { activeDevices, loading, startScrcpy, stopScrcpy };
}

/**
 * Set up a listener for scrcpy-log events from the backend.
 * Returns a cleanup function. Call this once at the app level.
 */
export async function setupScrcpyLogListener(
  addLog: (entry: LogEntry) => void,
): Promise<() => void> {
  const unlisten = await listen<{ serial: string; line: string }>(
    "scrcpy-log",
    (event) => {
      const { serial, line } = event.payload;
      addLog({
        timestamp: new Date().toISOString(),
        level: line.toLowerCase().includes("error") ? "ERROR" : "INFO",
        message: `[${serial}] ${line}`,
      });
    },
  );
  return unlisten;
}
