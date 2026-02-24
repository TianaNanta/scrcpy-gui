/**
 * usePairDevice Hook
 *
 * Manages device pairing state and operations for USB and wireless connections.
 * Provides modal state management, device listing, and connection functions.
 *
 * @param props - Configuration object with callback functions
 * @param props.onAddLog - Callback to add log entries
 * @param props.onRefreshDevices - Callback to refresh the device list
 * @param props.onPersistDeviceName - Callback to persist device names
 * @returns Object containing pairing state and functions
 * @example
 * const {
 *   showPairModal,
 *   openPairModal,
 *   registerDevice,
 *   setupWirelessConnection
 * } = usePairDevice({
 *   onAddLog: addLog,
 *   onRefreshDevices: listDevices,
 *   onPersistDeviceName: persistDeviceName,
 * });
 */

import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Device } from "../types/device";
import { getErrorMessage } from "../utils/error-messages";

export type PairMode = "usb" | "wireless" | null;

export interface UsePairDeviceProps {
  onAddLog: (
    message: string,
    level: "INFO" | "SUCCESS" | "ERROR" | "WARN",
  ) => void;
  onRefreshDevices: () => Promise<void>;
  onPersistDeviceName: (serial: string, name: string) => void;
}

export interface UsePairDeviceReturn {
  showPairModal: boolean;
  pairMode: PairMode;
  availableUsbDevices: Device[];
  selectedUsbDevice: string;
  deviceIp: string;
  devicePort: number;
  wirelessConnecting: boolean;
  usbRefreshing: boolean;
  newDeviceName: string;
  openPairModal: () => void;
  closePairModal: () => void;
  setPairMode: (mode: PairMode) => void;
  setSelectedUsbDevice: (serial: string) => void;
  setDeviceIp: (ip: string) => void;
  setDevicePort: (port: number) => void;
  setNewDeviceName: (name: string) => void;
  listAdbDevices: () => Promise<void>;
  registerDevice: (serial: string, name?: string) => Promise<boolean>;
  setupWirelessConnection: (name: string) => Promise<boolean>;
}

export function usePairDevice({
  onAddLog,
  onRefreshDevices,
  onPersistDeviceName,
}: UsePairDeviceProps): UsePairDeviceReturn {
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairMode, setPairMode] = useState<PairMode>(null);
  const [availableUsbDevices, setAvailableUsbDevices] = useState<Device[]>([]);
  const [selectedUsbDevice, setSelectedUsbDevice] = useState("");
  const [deviceIp, setDeviceIp] = useState("");
  const [devicePort, setDevicePort] = useState(5555);
  const [wirelessConnecting, setWirelessConnecting] = useState(false);
  const [usbRefreshing, setUsbRefreshing] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");

  const openPairModal = useCallback(() => {
    setShowPairModal(true);
  }, []);

  const closePairModal = useCallback(() => {
    setShowPairModal(false);
    setPairMode(null);
    setNewDeviceName("");
  }, []);

  const listAdbDevices = useCallback(async () => {
    setUsbRefreshing(true);
    try {
      const devs: Device[] = await invoke("list_adb_devices");
      setAvailableUsbDevices(devs);
    } catch (e) {
      const message = getErrorMessage(e, "adb-command");
      onAddLog(message, "ERROR");
    } finally {
      setUsbRefreshing(false);
    }
  }, [onAddLog]);

  const registerDevice = useCallback(
    async (serial: string, name?: string): Promise<boolean> => {
      try {
        await invoke("register_device", { serial });
        if (name) {
          onPersistDeviceName(serial, name);
        }
        onAddLog(`Device added: ${serial}`, "SUCCESS");
        await onRefreshDevices();
        return true;
      } catch (e) {
        const message = getErrorMessage(e, "device-register");
        onAddLog(message, "ERROR");
        return false;
      }
    },
    [onAddLog, onRefreshDevices, onPersistDeviceName],
  );

  const setupWirelessConnection = useCallback(
    async (name: string): Promise<boolean> => {
      if (!deviceIp.trim()) {
        throw new Error("IP address is required");
      }
      setWirelessConnecting(true);
      onAddLog(
        `Attempting wireless connection to ${deviceIp}:${devicePort}`,
        "INFO",
      );
      try {
        await invoke("connect_wireless_device", {
          ip: deviceIp.trim(),
          port: devicePort,
        });
        onAddLog(
          `Successfully connected to wireless device at ${deviceIp}:${devicePort}`,
          "SUCCESS",
        );
        return await registerDevice(`${deviceIp.trim()}:${devicePort}`, name);
      } catch (error) {
        const message = getErrorMessage(error, "wireless-connect");
        onAddLog(message, "ERROR");
        throw error;
      } finally {
        setWirelessConnecting(false);
      }
    },
    [deviceIp, devicePort, onAddLog, registerDevice],
  );

  const handleSetPairMode = useCallback(
    (mode: PairMode) => {
      setPairMode(mode);
      if (mode === "usb") {
        listAdbDevices();
      }
    },
    [listAdbDevices],
  );

  return {
    showPairModal,
    pairMode,
    availableUsbDevices,
    selectedUsbDevice,
    deviceIp,
    devicePort,
    wirelessConnecting,
    usbRefreshing,
    newDeviceName,
    openPairModal,
    closePairModal,
    setPairMode: handleSetPairMode,
    setSelectedUsbDevice,
    setDeviceIp,
    setDevicePort,
    setNewDeviceName,
    listAdbDevices,
    registerDevice,
    setupWirelessConnection,
  };
}
