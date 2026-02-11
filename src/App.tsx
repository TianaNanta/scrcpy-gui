import { useState, useEffect, useCallback } from "react";
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
  loadDeviceNames,
  loadPresets as loadPresetsFromStorage,
  savePresetsToStorage,
  buildInvokeConfig,
} from "./hooks/useDeviceSettings";
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
  const [dependencies, setDependencies] = useState<Dependencies | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentTab, setCurrentTab] = useState<Tab>("devices");
  const [activeDevices, setActiveDevices] = useState<string[]>([]);

  // Settings state
  const [theme, setTheme] = useState<Theme>("system");
  const [colorScheme, setColorScheme] = useState<ColorScheme>(colorSchemes[0]);
  const [fontSize, setFontSize] = useState<number>(16);

  // Device settings & presets
  const [deviceNames, setDeviceNames] = useState<Map<string, string>>(new Map());
  const [allDeviceSettings, setAllDeviceSettings] = useState<Map<string, DeviceSettings>>(new Map());
  const [presets, setPresets] = useState<Preset[]>([]);

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

      if (isDark) {
        root.style.setProperty("--background", "linear-gradient(135deg, #1e293b 0%, #334155 100%)");
        root.style.setProperty("--surface", "rgba(30, 41, 59, 0.95)");
        root.style.setProperty("--text-primary", "#f1f5f9");
        root.style.setProperty("--text-secondary", "#94a3b8");
        root.style.setProperty("--border-color", "#475569");
        root.style.setProperty("--input-bg", "rgba(30, 41, 59, 0.95)");
      } else {
        root.style.setProperty("--background", "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)");
        root.style.setProperty("--surface", "rgba(255, 255, 255, 0.95)");
        root.style.setProperty("--text-primary", "#1f2937");
        root.style.setProperty("--text-secondary", "#6b7280");
        root.style.setProperty("--border-color", "#e5e7eb");
        root.style.setProperty("--input-bg", "white");
      }
      root.style.setProperty("--primary-color", newColorScheme.primary);
      root.style.setProperty("--primary-hover", newColorScheme.primaryHover);
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

    // Load device names + settings
    setDeviceNames(loadDeviceNames());
    setAllDeviceSettings(loadAllDeviceSettings());

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
    try {
      const devs: Device[] = await invoke("list_devices");
      setDevices(devs);
      if (devs.length > 0 && !selectedDevice) {
        setSelectedDevice(devs[0].serial);
      }
      addLog(`Devices listed: ${devs.length} found`, "INFO");
    } catch (e) {
      addLog(`Failed to list devices: ${e}`, "ERROR");
    }
  }

  // ─── Scrcpy process ──────────────────────────────────────────────────

  async function startScrcpy(serial?: string) {
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

    const settings: DeviceSettings = {
      ...DEFAULT_DEVICE_SETTINGS,
      ...allDeviceSettings.get(deviceSerial),
    };
    addLog(`Starting scrcpy for device: ${deviceSerial}`);

    try {
      const config = buildInvokeConfig(deviceSerial, settings);
      await invoke("start_scrcpy", { config });
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

  // ─── Wireless ────────────────────────────────────────────────────────

  async function setupWirelessConnection() {
    if (!deviceIp.trim()) {
      addLog("Error: IP address is required for wireless connection", "ERROR");
      return;
    }
    setWirelessConnecting(true);
    addLog(`Attempting wireless connection to ${deviceIp}:${devicePort}`, "INFO");
    try {
      await invoke("connect_wireless_device", { ip: deviceIp.trim(), port: devicePort });
      addLog(`Successfully connected to wireless device at ${deviceIp}:${devicePort}`, "SUCCESS");
      listDevices();
    } catch (error) {
      addLog(`Failed to connect to wireless device: ${error}`, "ERROR");
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
        name: saved?.name || deviceNames.get(serial) || "",
      });
      setCurrentSettings(settings);
      setSelectedDeviceForSettings(serial);
      setShowDeviceModal(true);
    },
    [allDeviceSettings, deviceNames],
  );

  const handleSettingsChange = useCallback((updates: Partial<DeviceSettings>) => {
    setCurrentSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleLaunchFromModal = useCallback(() => {
    // Save settings before launching
    const updated = new Map(allDeviceSettings);
    updated.set(selectedDeviceForSettings, currentSettings);
    setAllDeviceSettings(updated);
    localStorage.setItem("deviceSettings", JSON.stringify(Array.from(updated)));
    localStorage.setItem("deviceNames", JSON.stringify(Array.from(deviceNames)));
    startScrcpy(selectedDeviceForSettings);
    setShowDeviceModal(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceForSettings, currentSettings, allDeviceSettings, deviceNames]);

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
                  deviceNames.get(selectedDeviceForSettings) ||
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
      />
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

export default App;
