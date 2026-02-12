import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";

import type { Device, Dependencies } from "./types/device";
import type {
  DeviceSettings,
  Preset,
  LogEntry,
  LogLevel,
  ColorScheme,
  Theme,
} from "./types/settings";
import { DEFAULT_DEVICE_SETTINGS, migrateDeviceSettings, migratePreset } from "./types/settings";
import {
  loadAllDeviceSettings,
  migrateDeviceNamesToSettings,
  deriveDeviceNames,
  loadPresets as loadPresetsFromStorage,
  savePresetsToStorage,
} from "./hooks/useDeviceSettings";
import { buildArgs } from "./utils/command-builder";
import { useScrcpyVersion } from "./hooks/useScrcpyVersion";

import Sidebar, { type Tab } from "./components/Sidebar";
import DeviceList from "./components/DeviceList";
import DeviceSettingsModal from "./components/DeviceSettingsModal";
import PairDeviceModal from "./components/PairDeviceModal";
import LogViewer from "./components/LogViewer";
import PresetManager from "./components/PresetManager";
import SettingsPage, { colorSchemes } from "./components/SettingsPage";

function App() {
  // Scrcpy version feature gates
  const scrcpyVersion = useScrcpyVersion();
  const { canUhidInput, canAudio, canNoVideo, canCamera, canGamepad, canVirtualDisplay } = scrcpyVersion;

  // Core state
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dependencies, setDependencies] = useState<Dependencies | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentTab, setCurrentTab] = useState<Tab>("devices");
  const [activeDevices, setActiveDevices] = useState<string[]>([]);

  // Settings state
  const [theme, setTheme] = useState<Theme>("system");
  const [colorScheme, setColorScheme] = useState<ColorScheme>(colorSchemes[0]);
  const [fontSize, setFontSize] = useState<number>(16);

  // Device settings & presets
  const [allDeviceSettings, setAllDeviceSettings] = useState<Map<string, DeviceSettings>>(new Map());
  const [presets, setPresets] = useState<Preset[]>([]);

  // Derived device names from settings (no separate state)
  const deviceNames = useMemo(() => deriveDeviceNames(allDeviceSettings), [allDeviceSettings]);

  // Device modal state
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [selectedDeviceForSettings, setSelectedDeviceForSettings] = useState<string>("");
  const [currentSettings, setCurrentSettings] = useState<DeviceSettings>(DEFAULT_DEVICE_SETTINGS);

  // Pair modal state
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairMode, setPairMode] = useState<"usb" | "wireless" | null>(null);
  const [selectedUsbDevice, setSelectedUsbDevice] = useState("");
  const [deviceIp, setDeviceIp] = useState("");
  const [devicePort, setDevicePort] = useState(5555);
  const [wirelessConnecting, setWirelessConnecting] = useState(false);

  // Device list search/filter
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<"all" | "usb" | "wireless">("all");

  // ─── Logging ─────────────────────────────────────────────────────────

  const addLog = useCallback((message: string, level: LogLevel = "INFO") => {
    setLogs((prev) => [
      ...prev,
      { timestamp: new Date().toISOString(), level, message },
    ]);
  }, []);

  // ─── Theme helpers ───────────────────────────────────────────────────

  const applySettings = useCallback(
    (newTheme: Theme, newColorScheme: ColorScheme, newFontSize: number) => {
      const root = document.documentElement;
      const isDark =
        newTheme === "dark" ||
        (newTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

      // Set color-scheme for native form controls (selects, scrollbars, etc.)
      root.style.setProperty("color-scheme", isDark ? "dark" : "light");
      root.setAttribute("data-theme", isDark ? "dark" : "light");

      if (isDark) {
        root.style.setProperty("--background", "linear-gradient(135deg, #1e293b 0%, #334155 100%)");
        root.style.setProperty("--surface", "rgba(30, 41, 59, 0.95)");
        root.style.setProperty("--text-primary", "#f1f5f9");
        root.style.setProperty("--text-secondary", "#94a3b8");
        root.style.setProperty("--border-color", "#475569");
        root.style.setProperty("--input-bg", "rgba(30, 41, 59, 0.95)");
        // Error theme vars (dark)
        root.style.setProperty("--error-bg", "rgba(239, 68, 68, 0.15)");
        root.style.setProperty("--error-text", "#fca5a5");
        root.style.setProperty("--error-border", "rgba(239, 68, 68, 0.3)");
        root.style.setProperty("--separator-color", "rgba(255, 255, 255, 0.1)");
        // Shadow tokens (dark — higher opacity)
        root.style.setProperty("--shadow-subtle", "0 1px 2px rgba(0,0,0,0.20)");
        root.style.setProperty("--shadow-medium", "0 2px 8px rgba(0,0,0,0.30)");
        root.style.setProperty("--shadow-elevated", "0 8px 24px rgba(0,0,0,0.40)");
        root.style.setProperty("--shadow-floating", "0 16px 48px rgba(0,0,0,0.50)");
        // Status colors (dark)
        root.style.setProperty("--status-success-bg", "hsl(145, 40%, 18%)");
        root.style.setProperty("--status-success-text", "hsl(145, 60%, 65%)");
        root.style.setProperty("--status-error-bg", "hsl(0, 45%, 20%)");
        root.style.setProperty("--status-error-text", "hsl(0, 65%, 68%)");
        root.style.setProperty("--status-warning-bg", "hsl(40, 45%, 18%)");
        root.style.setProperty("--status-warning-text", "hsl(40, 70%, 65%)");
        root.style.setProperty("--status-info-bg", "hsl(210, 40%, 18%)");
        root.style.setProperty("--status-info-text", "hsl(210, 60%, 65%)");
      } else {
        root.style.setProperty("--background", "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)");
        root.style.setProperty("--surface", "rgba(255, 255, 255, 0.95)");
        root.style.setProperty("--text-primary", "#1f2937");
        root.style.setProperty("--text-secondary", "#6b7280");
        root.style.setProperty("--border-color", "#e5e7eb");
        root.style.setProperty("--input-bg", "white");
        // Error theme vars (light)
        root.style.setProperty("--error-bg", "#fee2e2");
        root.style.setProperty("--error-text", "#dc2626");
        root.style.setProperty("--error-border", "#fecaca");
        root.style.setProperty("--separator-color", "rgba(0, 0, 0, 0.1)");
        // Shadow tokens (light)
        root.style.setProperty("--shadow-subtle", "0 1px 2px rgba(0,0,0,0.06)");
        root.style.setProperty("--shadow-medium", "0 2px 8px rgba(0,0,0,0.10)");
        root.style.setProperty("--shadow-elevated", "0 8px 24px rgba(0,0,0,0.12)");
        root.style.setProperty("--shadow-floating", "0 16px 48px rgba(0,0,0,0.16)");
        // Status colors (light)
        root.style.setProperty("--status-success-bg", "hsl(145, 65%, 92%)");
        root.style.setProperty("--status-success-text", "hsl(145, 70%, 28%)");
        root.style.setProperty("--status-error-bg", "hsl(0, 75%, 93%)");
        root.style.setProperty("--status-error-text", "hsl(0, 70%, 35%)");
        root.style.setProperty("--status-warning-bg", "hsl(40, 90%, 90%)");
        root.style.setProperty("--status-warning-text", "hsl(30, 80%, 30%)");
        root.style.setProperty("--status-info-bg", "hsl(210, 75%, 92%)");
        root.style.setProperty("--status-info-text", "hsl(210, 70%, 32%)");
      }
      root.style.setProperty("--primary-color", newColorScheme.primary);
      root.style.setProperty("--primary-hover", newColorScheme.primaryHover);
      root.style.setProperty("--primary-color-rgb", newColorScheme.primary.replace("#", "").match(/.{2}/g)?.map(h => parseInt(h, 16)).join(", ") || "59, 130, 246");
      root.style.setProperty("--font-size", `${newFontSize}px`);
    },
    [],
  );

  const saveUISettings = useCallback(
    (newTheme: Theme, newColorScheme: ColorScheme, newFontSize: number) => {
      localStorage.setItem("scrcpy-theme", newTheme);
      localStorage.setItem("scrcpy-colorScheme", newColorScheme.name);
      localStorage.setItem("scrcpy-fontSize", newFontSize.toString());
      applySettings(newTheme, newColorScheme, newFontSize);
    },
    [applySettings],
  );

  // ─── Init ────────────────────────────────────────────────────────────

  useEffect(() => {
    checkDependencies();
    listDevices();

    // Load presets
    setPresets(loadPresetsFromStorage());

    // Load device names + settings (with migration of legacy deviceNames)
    const loaded = loadAllDeviceSettings();
    const migrated = migrateDeviceNamesToSettings(loaded);
    setAllDeviceSettings(migrated);

    // Load UI settings
    const savedTheme = (localStorage.getItem("scrcpy-theme") as Theme) || "system";
    const savedCSName = localStorage.getItem("scrcpy-colorScheme") || "Blue";
    const savedFS = parseInt(localStorage.getItem("scrcpy-fontSize") || "16", 10);
    const savedCS = colorSchemes.find((s) => s.name === savedCSName) || colorSchemes[0];
    setTheme(savedTheme);
    setColorScheme(savedCS);
    setFontSize(savedFS);
    applySettings(savedTheme, savedCS, savedFS);

    // Listen for scrcpy stderr/stdout output from Rust backend
    const unlistenLog = listen<{ serial: string; line: string }>(
      "scrcpy-log",
      (event) => {
        const { serial, line } = event.payload;
        const level: LogLevel = line.toLowerCase().includes("error") ? "ERROR"
          : line.toLowerCase().includes("warn") ? "WARN"
          : "INFO";
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            level,
            message: `[${serial}] ${line}`,
          },
        ]);
      },
    );

    // Listen for scrcpy process exit events
    const unlistenExit = listen<{ serial: string; exitCode: number | null }>(
      "scrcpy-exit",
      (event) => {
        const { serial, exitCode } = event.payload;
        setActiveDevices((prev) => prev.filter((s) => s !== serial));
        const msg = exitCode !== null && exitCode !== 0
          ? `Scrcpy exited for ${serial} with code ${exitCode}`
          : `Scrcpy exited for ${serial}`;
        const logLevel: LogLevel = exitCode !== null && exitCode !== 0 ? "ERROR" : "INFO";
        setLogs((prev) => [
          ...prev,
          { timestamp: new Date().toISOString(), level: logLevel, message: msg },
        ]);
      },
    );

    return () => {
      unlistenLog.then((fn) => fn());
      unlistenExit.then((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── OS theme change listener ────────────────────────────────────────

  useEffect(() => {
    if (theme !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applySettings(theme, colorScheme, fontSize);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme, colorScheme, fontSize, applySettings]);

  // ─── Auto-discovery polling ──────────────────────────────────────────

  const pollingRef = useRef(false);
  useEffect(() => {
    const interval = setInterval(async () => {
      if (pollingRef.current) return; // skip if previous poll still in progress
      pollingRef.current = true;
      try {
        const devs: Device[] = await invoke("list_devices");
        setDevices(devs);
      } catch {
        // Silently ignore polling errors — user can manually refresh
      } finally {
        pollingRef.current = false;
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ─── Backend calls ───────────────────────────────────────────────────

  async function checkDependencies() {
    try {
      const deps: Dependencies = await invoke("check_dependencies");
      setDependencies(deps);
      addLog(`Dependencies checked: ADB=${deps.adb}, Scrcpy=${deps.scrcpy}`, "INFO");
    } catch (e) {
      addLog(`Failed to check dependencies: ${e}`, "ERROR");
    }
  }

  async function listDevices() {
    setRefreshing(true);
    try {
      const devs: Device[] = await invoke("list_devices");
      setDevices(devs);
      if (devs.length > 0 && !selectedDevice) {
        setSelectedDevice(devs[0].serial);
      }
      addLog(`Devices listed: ${devs.length} found`, "INFO");
    } catch (e) {
      addLog(`Failed to list devices: ${e}`, "ERROR");
    } finally {
      setRefreshing(false);
    }
  }

  // ─── Scrcpy process ──────────────────────────────────────────────────

  async function startScrcpy(serial?: string, settingsOverride?: DeviceSettings) {
    const deviceSerial = serial || selectedDevice;
    if (!deviceSerial) return;
    setLoading(true);
    addLog(`Testing device connection: ${deviceSerial}`);

    try {
      await invoke("test_device", { serial: deviceSerial });
      addLog(`Device test passed for: ${deviceSerial}`, "SUCCESS");
    } catch (e) {
      addLog(`Device test failed: ${e}`, "ERROR");
      setLoading(false);
      return;
    }

    const settings: DeviceSettings = settingsOverride ?? {
      ...DEFAULT_DEVICE_SETTINGS,
      ...allDeviceSettings.get(deviceSerial),
    };
    addLog(`Starting scrcpy for device: ${deviceSerial}`);

    try {
      const args = buildArgs(deviceSerial, settings);
      await invoke("start_scrcpy", { serial: deviceSerial, args });
      setActiveDevices((prev) => [...prev, deviceSerial]);
      addLog(
        `Scrcpy started successfully${settings.recordingEnabled ? " (recording enabled)" : ""}`,
        "SUCCESS",
      );
    } catch (e) {
      addLog(`Failed to start scrcpy: ${e}`, "ERROR");
    } finally {
      setLoading(false);
    }
  }

  async function stopScrcpy(serial: string) {
    try {
      await invoke("stop_scrcpy", { serial });
      setActiveDevices((prev) => prev.filter((s) => s !== serial));
      addLog(`Scrcpy stopped for device: ${serial}`, "SUCCESS");
    } catch (e) {
      addLog(`Failed to stop scrcpy: ${e}`, "ERROR");
    }
  }

  async function forgetDevice(serial: string) {
    try {
      await invoke("forget_device", { serial });
      // Remove from React state
      setDevices((prev) => prev.filter((d) => d.serial !== serial));
      // Remove from device settings
      const updatedSettings = new Map(allDeviceSettings);
      updatedSettings.delete(serial);
      setAllDeviceSettings(updatedSettings);
      localStorage.setItem("deviceSettings", JSON.stringify(Array.from(updatedSettings)));
      addLog(`Device forgotten: ${serial}`, "SUCCESS");
    } catch (e) {
      addLog(`Failed to forget device: ${e}`, "ERROR");
    }
  }

  // ─── Wireless ────────────────────────────────────────────────────────

  async function setupWirelessConnection() {
    if (!deviceIp.trim()) {
      throw new Error("IP address is required");
    }
    setWirelessConnecting(true);
    addLog(`Attempting wireless connection to ${deviceIp}:${devicePort}`, "INFO");
    try {
      await invoke("connect_wireless_device", { ip: deviceIp.trim(), port: devicePort });
      addLog(`Successfully connected to wireless device at ${deviceIp}:${devicePort}`, "SUCCESS");
      listDevices();
    } catch (error) {
      addLog(`Failed to connect to wireless device: ${error}`, "ERROR");
      throw error;
    } finally {
      setWirelessConnecting(false);
    }
  }

  async function disconnectWireless(serial: string) {
    const parts = serial.split(":");
    if (parts.length !== 2) {
      addLog("Invalid wireless device serial", "ERROR");
      return;
    }
    const ip = parts[0];
    const port = parseInt(parts[1], 10);
    if (isNaN(port)) {
      addLog("Invalid port in serial", "ERROR");
      return;
    }
    setWirelessConnecting(true);
    addLog(`Disconnecting wireless device ${ip}:${port}`, "INFO");
    try {
      await invoke("disconnect_wireless_device", { ip, port });
      addLog(`Successfully disconnected wireless device ${ip}:${port}`, "SUCCESS");
      listDevices();
    } catch (error) {
      addLog(`Failed to disconnect wireless device: ${error}`, "ERROR");
    } finally {
      setWirelessConnecting(false);
    }
  }

  // ─── Device settings modal ──────────────────────────────────────────

  const openDeviceSettings = useCallback(
    (serial: string) => {
      const saved = allDeviceSettings.get(serial);
      const settings = migrateDeviceSettings({
        ...DEFAULT_DEVICE_SETTINGS,
        ...saved,
        name: saved?.name || "",
      });
      setCurrentSettings(settings);
      setSelectedDeviceForSettings(serial);
      setShowDeviceModal(true);
    },
    [allDeviceSettings],
  );

  const handleSettingsChange = useCallback((updates: Partial<DeviceSettings>) => {
    setCurrentSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSaveSettings = useCallback(
    (settingsToSave: DeviceSettings) => {
      const updated = new Map(allDeviceSettings);
      updated.set(selectedDeviceForSettings, settingsToSave);
      setAllDeviceSettings(updated);
      localStorage.setItem("deviceSettings", JSON.stringify(Array.from(updated)));
    },
    [selectedDeviceForSettings, allDeviceSettings],
  );

  const handleLaunchFromModal = useCallback(() => {
    handleSaveSettings(currentSettings);
    startScrcpy(selectedDeviceForSettings, currentSettings);
    setShowDeviceModal(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceForSettings, currentSettings, handleSaveSettings]);

  // ─── Presets ─────────────────────────────────────────────────────────

  const handleSavePreset = useCallback(
    (name: string) => {
      const { recordingEnabled: _re, recordFile: _rf, recordFormat: _rfmt, ...rest } = currentSettings;
      const newPreset: Preset = { ...rest, id: Date.now().toString(), name };
      const updated = [...presets, newPreset];
      setPresets(updated);
      savePresetsToStorage(updated);
    },
    [currentSettings, presets],
  );

  const handleLoadPreset = useCallback(
    (preset: Preset) => {
      const migrated = migratePreset(preset);
      const { id: _id, name: _name, ...fields } = migrated;
      setCurrentSettings((prev) => ({ ...prev, ...fields }));
    },
    [],
  );

  const handleDeletePreset = useCallback(
    (presetId: string) => {
      const updated = presets.filter((p) => p.id !== presetId);
      setPresets(updated);
      savePresetsToStorage(updated);
    },
    [presets],
  );

  // ─── Render content ──────────────────────────────────────────────────

  const renderContent = () => {
    switch (currentTab) {
      case "devices":
        return (
          <>
            <DeviceList
              devices={devices}
              dependencies={dependencies}
              activeDevices={activeDevices}
              deviceNames={deviceNames}
              loading={loading}
              refreshing={refreshing}
              wirelessConnecting={wirelessConnecting}
              deviceSearch={deviceSearch}
              deviceFilter={deviceFilter}
              logs={logs}
              onSearchChange={setDeviceSearch}
              onFilterChange={setDeviceFilter}
              onRefreshDevices={listDevices}
              onStartScrcpy={startScrcpy}
              onStopScrcpy={stopScrcpy}
              onDisconnectWireless={disconnectWireless}
              onOpenDeviceSettings={openDeviceSettings}
              onOpenPairModal={() => {
                setShowPairModal(true);
                setPairMode(null);
              }}
              onForgetDevice={forgetDevice}
            />
            {showPairModal && (
              <PairDeviceModal
                devices={devices}
                deviceIp={deviceIp}
                devicePort={devicePort}
                pairMode={pairMode}
                selectedUsbDevice={selectedUsbDevice}
                onClose={() => {
                  setShowPairModal(false);
                  setPairMode(null);
                }}
                onSetPairMode={setPairMode}
                onSetDeviceIp={setDeviceIp}
                onSetDevicePort={setDevicePort}
                onSetSelectedUsbDevice={setSelectedUsbDevice}
                onStartMirroringUsb={(serial) => startScrcpy(serial)}
                onConnectWireless={setupWirelessConnection}
              />
            )}
            {showDeviceModal && selectedDeviceForSettings && (
              <DeviceSettingsModal
                device={devices.find((d) => d.serial === selectedDeviceForSettings)}
                serial={selectedDeviceForSettings}
                settings={currentSettings}
                deviceName={
                  allDeviceSettings.get(selectedDeviceForSettings)?.name ||
                  devices.find((d) => d.serial === selectedDeviceForSettings)?.model ||
                  selectedDeviceForSettings
                }
                canUhidInput={canUhidInput}
                canAudio={canAudio}
                canNoVideo={canNoVideo}
                canCamera={canCamera}
                canGamepad={canGamepad}
                canVirtualDisplay={canVirtualDisplay}
                onSettingsChange={handleSettingsChange}
                onClose={() => setShowDeviceModal(false)}
                onLaunch={handleLaunchFromModal}
                onSave={handleSaveSettings}
              />
            )}
          </>
        );
      case "presets":
        return (
          <PresetManager
            presets={presets}
            onSavePreset={handleSavePreset}
            onLoadPreset={handleLoadPreset}
            onDeletePreset={handleDeletePreset}
          />
        );
      case "logs":
        return <LogViewer logs={logs} />;
      case "settings":
        return (
          <SettingsPage
            theme={theme}
            colorScheme={colorScheme}
            fontSize={fontSize}
            onThemeChange={(t) => {
              setTheme(t);
              saveUISettings(t, colorScheme, fontSize);
            }}
            onColorSchemeChange={(cs) => {
              setColorScheme(cs);
              saveUISettings(theme, cs, fontSize);
            }}
            onFontSizeChange={(fs) => {
              setFontSize(fs);
              saveUISettings(theme, colorScheme, fs);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        dependencies={dependencies}
        onRefreshDeps={checkDependencies}
        connectedCount={devices.filter((d) => d.status === "device").length}
      />
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

export default App;
