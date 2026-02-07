import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  DevicePhoneMobileIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  Bars3Icon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  WifiIcon,
  ComputerDesktopIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import "./App.css";

interface Device {
  serial: string;
  status: string;
  model?: string;
  android_version?: string;
  battery_level?: number;
  is_wireless: boolean;
}

interface Dependencies {
  adb: boolean;
  scrcpy: boolean;
}

interface Preset {
  id: string;
  name: string;
  bitrate: number;
  maxSize: number;
  noControl: boolean;
  turnScreenOff: boolean;
  stayAwake: boolean;
  showTouches: boolean;
  displayId: number;
  rotation: number;
  crop: string;
  lockVideoOrientation: number;
  displayBuffer: number;
  windowX: number;
  windowY: number;
  windowWidth: number;
  windowHeight: number;
  alwaysOnTop: boolean;
  windowBorderless: boolean;
  fullscreen: boolean;
}

interface ColorScheme {
  name: string;
  primary: string;
  primaryHover: string;
}

interface DeviceSettings {
  name: string;
  bitrate: number;
  maxSize: number;
  noControl: boolean;
  turnScreenOff: boolean;
  stayAwake: boolean;
  showTouches: boolean;
  recordingEnabled: boolean;
  recordFile: string;
  recordFormat: "mp4" | "mkv";
  audioForwarding: boolean;
  audioBitrate: number;
  microphoneForwarding: boolean;
  displayId: number;
  rotation: number;
  crop: string;
  lockVideoOrientation: number;
  displayBuffer: number;
  windowX: number;
  windowY: number;
  windowWidth: number;
  windowHeight: number;
  alwaysOnTop: boolean;
  windowBorderless: boolean;
  fullscreen: boolean;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

type Tab = "devices" | "presets" | "logs" | "settings";
type Theme = "light" | "dark" | "system";
type LogLevel = "INFO" | "ERROR" | "WARN" | "SUCCESS" | "DEBUG";

const colorSchemes: ColorScheme[] = [
  {
    name: "Blue",
    primary: "#3b82f6",
    primaryHover: "#2563eb",
  },
  {
    name: "Green",
    primary: "#10b981",
    primaryHover: "#059669",
  },
  {
    name: "Purple",
    primary: "#8b5cf6",
    primaryHover: "#7c3aed",
  },
  {
    name: "Red",
    primary: "#ef4444",
    primaryHover: "#dc2626",
  },
  {
    name: "Orange",
    primary: "#f97316",
    primaryHover: "#ea580c",
  },
];

function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [bitrate, setBitrate] = useState(8000000);
  const [maxSize, setMaxSize] = useState(0);
  const [noControl, setNoControl] = useState(false);
  const [turnScreenOff, setTurnScreenOff] = useState(false);
  const [stayAwake, setStayAwake] = useState(false);
  const [showTouches, setShowTouches] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dependencies, setDependencies] = useState<Dependencies | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentTab, setCurrentTab] = useState<Tab>("devices");

  // Settings state
  const [theme, setTheme] = useState<Theme>("system");
  const [colorScheme, setColorScheme] = useState<ColorScheme>(colorSchemes[0]);
  const [fontSize, setFontSize] = useState<number>(16);

  // Recording state
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [recordFile, setRecordFile] = useState<string>("");
  const [recordFormat, setRecordFormat] = useState<"mp4" | "mkv">("mp4");

  // Audio state
  const [audioForwarding, setAudioForwarding] = useState(false);
  const [audioBitrate, setAudioBitrate] = useState<number>(128);
  const [microphoneForwarding, setMicrophoneForwarding] = useState(false);

  // Wireless connection state
  const [deviceIp, setDeviceIp] = useState("");
  const [devicePort, setDevicePort] = useState(5555);
  const [wirelessConnecting, setWirelessConnecting] = useState(false);

  // Display configuration state
  const [displayId, setDisplayId] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [crop, setCrop] = useState<string>("");
  const [lockVideoOrientation, setLockVideoOrientation] = useState<number>(-1);
  const [displayBuffer, setDisplayBuffer] = useState<number>(0);

  // Window configuration state
  const [windowX, setWindowX] = useState<number>(0);
  const [windowY, setWindowY] = useState<number>(0);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [windowHeight, setWindowHeight] = useState<number>(0);

  // Device-specific state
  const [deviceNames, setDeviceNames] = useState<Map<string, string>>(
    new Map(),
  );
  const [deviceSettings, setDeviceSettings] = useState<
    Map<string, DeviceSettings>
  >(new Map());
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [selectedDeviceForSettings, setSelectedDeviceForSettings] =
    useState<string>("");
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [windowBorderless, setWindowBorderless] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Device search and filter state
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<"all" | "usb" | "wireless">(
    "all",
  );

  // Active mirroring devices
  const [activeDevices, setActiveDevices] = useState<string[]>([]);

  // Pair new device modal states
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairMode, setPairMode] = useState<"usb" | "wireless" | null>(null);
  const [selectedUsbDevice, setSelectedUsbDevice] = useState("");

  const hasMissingDeps =
    dependencies && (!dependencies.adb || !dependencies.scrcpy);

  const selectSaveFile = async () => {
    try {
      const filePath: string | null = await invoke("select_save_file");
      if (filePath) {
        // Ensure the file has the correct extension
        const extension = recordFormat;
        const finalPath = filePath.endsWith(`.${extension}`)
          ? filePath
          : `${filePath}.${extension}`;
        setRecordFile(finalPath);
        addLog(`Recording file selected: ${finalPath}`, "INFO");
      }
    } catch (e) {
      console.error("Failed to select save file:", e);
      addLog(`Failed to select save file: ${e}`);
    }
  };

  const tabs = [
    { id: "devices" as Tab, name: "Devices", icon: DevicePhoneMobileIcon },
    { id: "presets" as Tab, name: "Presets", icon: DocumentTextIcon },
    { id: "logs" as Tab, name: "Logs", icon: Bars3Icon },
    {
      id: "settings" as Tab,
      name: "Settings",
      icon: AdjustmentsHorizontalIcon,
    },
  ];

  useEffect(() => {
    checkDependencies();
    listDevices();
    loadPresets();
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedTheme =
      (localStorage.getItem("scrcpy-theme") as Theme) || "system";
    const savedColorSchemeName =
      localStorage.getItem("scrcpy-colorScheme") || "Blue";
    const savedFontSize = parseInt(
      localStorage.getItem("scrcpy-fontSize") || "16",
      10,
    );

    const savedColorScheme =
      colorSchemes.find((s) => s.name === savedColorSchemeName) ||
      colorSchemes[0];

    setTheme(savedTheme);
    setColorScheme(savedColorScheme);
    setFontSize(savedFontSize);

    applySettings(savedTheme, savedColorScheme, savedFontSize);

    // Load device names and settings
    const savedDeviceNames = localStorage.getItem("deviceNames");
    if (savedDeviceNames) {
      setDeviceNames(new Map(JSON.parse(savedDeviceNames)));
    }

    const savedDeviceSettings = localStorage.getItem("deviceSettings");
    if (savedDeviceSettings) {
      setDeviceSettings(new Map(JSON.parse(savedDeviceSettings)));
    }
  };

  const applySettings = (
    newTheme: Theme,
    newColorScheme: ColorScheme,
    newFontSize: number,
  ) => {
    const root = document.documentElement;

    // Apply theme
    const isDark =
      newTheme === "dark" ||
      (newTheme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      // Dark theme variables
      root.style.setProperty(
        "--background",
        "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
      );
      root.style.setProperty("--surface", "rgba(30, 41, 59, 0.95)");
      root.style.setProperty("--text-primary", "#f1f5f9");
      root.style.setProperty("--text-secondary", "#94a3b8");
      root.style.setProperty("--border-color", "#475569");
      root.style.setProperty("--input-bg", "rgba(30, 41, 59, 0.95)");
    } else {
      // Light theme variables
      root.style.setProperty(
        "--background",
        "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      );
      root.style.setProperty("--surface", "rgba(255, 255, 255, 0.95)");
      root.style.setProperty("--text-primary", "#1f2937");
      root.style.setProperty("--text-secondary", "#6b7280");
      root.style.setProperty("--border-color", "#e5e7eb");
      root.style.setProperty("--input-bg", "white");
    }

    // Apply color scheme (primary colors)
    root.style.setProperty("--primary-color", newColorScheme.primary);
    root.style.setProperty("--primary-hover", newColorScheme.primaryHover);

    // Apply font size
    root.style.setProperty("--font-size", `${newFontSize}px`);
  };

  const saveSettings = (
    newTheme: Theme,
    newColorScheme: ColorScheme,
    newFontSize: number,
  ) => {
    localStorage.setItem("scrcpy-theme", newTheme);
    localStorage.setItem("scrcpy-colorScheme", newColorScheme.name);
    localStorage.setItem("scrcpy-fontSize", newFontSize.toString());
    applySettings(newTheme, newColorScheme, newFontSize);
  };

  const loadDeviceSettings = (serial: string) => {
    const settings = deviceSettings.get(serial) || {
      name: deviceNames.get(serial) || "",
      bitrate: 8000000,
      maxSize: 0,
      noControl: false,
      turnScreenOff: false,
      stayAwake: false,
      showTouches: false,
      recordingEnabled: false,
      recordFile: "",
      recordFormat: "mp4",
      audioForwarding: false,
      audioBitrate: 128000,
      microphoneForwarding: false,
      displayId: 0,
      rotation: 0,
      crop: "",
      lockVideoOrientation: -1,
      displayBuffer: 0,
      windowX: 0,
      windowY: 0,
      windowWidth: 0,
      windowHeight: 0,
      alwaysOnTop: false,
      windowBorderless: false,
      fullscreen: false,
    };
    setBitrate(settings.bitrate);
    setMaxSize(settings.maxSize);
    setNoControl(settings.noControl);
    setTurnScreenOff(settings.turnScreenOff);
    setStayAwake(settings.stayAwake);
    setShowTouches(settings.showTouches);
    setRecordingEnabled(settings.recordingEnabled);
    setRecordFile(settings.recordFile);
    setRecordFormat(settings.recordFormat);
    setAudioForwarding(settings.audioForwarding);
    setAudioBitrate(settings.audioBitrate);
    setMicrophoneForwarding(settings.microphoneForwarding);
    setDisplayId(settings.displayId);
    setRotation(settings.rotation);
    setCrop(settings.crop);
    const lvo =
      typeof settings.lockVideoOrientation === "number"
        ? settings.lockVideoOrientation
        : settings.lockVideoOrientation
          ? 0
          : -1;
    setLockVideoOrientation(lvo);
    setDisplayBuffer(settings.displayBuffer);
    setWindowX(settings.windowX);
    setWindowY(settings.windowY);
    setWindowWidth(settings.windowWidth);
    setWindowHeight(settings.windowHeight);
    setAlwaysOnTop(settings.alwaysOnTop);
    setWindowBorderless(settings.windowBorderless);
    setFullscreen(settings.fullscreen);
  };

  const saveDeviceSettings = (serial: string) => {
    const settings: DeviceSettings = {
      name: deviceNames.get(serial) || "",
      bitrate,
      maxSize,
      noControl,
      turnScreenOff,
      stayAwake,
      showTouches,
      recordingEnabled,
      recordFile,
      recordFormat,
      audioForwarding,
      audioBitrate,
      microphoneForwarding,
      displayId,
      rotation,
      crop,
      lockVideoOrientation,
      displayBuffer,
      windowX,
      windowY,
      windowWidth,
      windowHeight,
      alwaysOnTop,
      windowBorderless,
      fullscreen,
    };
    const newSettings = new Map(deviceSettings);
    newSettings.set(serial, settings);
    setDeviceSettings(newSettings);
    localStorage.setItem(
      "deviceSettings",
      JSON.stringify(Array.from(newSettings)),
    );
    // Also save deviceNames
    localStorage.setItem(
      "deviceNames",
      JSON.stringify(Array.from(deviceNames)),
    );
  };

  const loadPresets = () => {
    const saved = localStorage.getItem("scrcpy-presets");
    if (saved) {
      setPresets(JSON.parse(saved));
    }
  };

  const savePreset = (name: string) => {
    const newPreset: Preset = {
      id: Date.now().toString(),
      name,
      bitrate,
      maxSize,
      noControl,
      turnScreenOff,
      stayAwake,
      showTouches,
      displayId,
      rotation,
      crop,
      lockVideoOrientation,
      displayBuffer,
      windowX,
      windowY,
      windowWidth,
      windowHeight,
      alwaysOnTop,
      windowBorderless,
      fullscreen,
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem("scrcpy-presets", JSON.stringify(updated));
  };

  const loadPreset = (preset: Preset) => {
    setBitrate(preset.bitrate);
    setMaxSize(preset.maxSize);
    setNoControl(preset.noControl);
    setTurnScreenOff(preset.turnScreenOff);
    setStayAwake(preset.stayAwake);
    setShowTouches(preset.showTouches);
    setDisplayId(preset.displayId);
    setRotation(preset.rotation);
    setCrop(preset.crop);
    setLockVideoOrientation(preset.lockVideoOrientation);
    setDisplayBuffer(preset.displayBuffer);
    setWindowX(preset.windowX);
    setWindowY(preset.windowY);
    setWindowWidth(preset.windowWidth);
    setWindowHeight(preset.windowHeight);
    setAlwaysOnTop(preset.alwaysOnTop);
    setWindowBorderless(preset.windowBorderless);
    setFullscreen(preset.fullscreen);
  };

  const addLog = (message: string, level: LogLevel = "INFO") => {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const setupWirelessConnection = async () => {
    if (!deviceIp.trim()) {
      addLog("Error: IP address is required for wireless connection", "ERROR");
      return;
    }

    setWirelessConnecting(true);
    addLog(
      `Attempting wireless connection to ${deviceIp}:${devicePort}`,
      "INFO",
    );

    try {
      await invoke("connect_wireless_device", {
        ip: deviceIp.trim(),
        port: devicePort,
      });

      addLog(
        `Successfully connected to wireless device at ${deviceIp}:${devicePort}`,
        "SUCCESS",
      );
      // Refresh device list to show the wireless device
      listDevices();
    } catch (error) {
      addLog(`Failed to connect to wireless device: ${error}`, "ERROR");
    } finally {
      setWirelessConnecting(false);
    }
  };

  const disconnectWireless = async (serial: string) => {
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
      addLog(
        `Successfully disconnected wireless device ${ip}:${port}`,
        "SUCCESS",
      );
      // Refresh device list
      listDevices();
    } catch (error) {
      addLog(`Failed to disconnect wireless device: ${error}`, "ERROR");
    } finally {
      setWirelessConnecting(false);
    }
  };

  async function checkDependencies() {
    try {
      const deps: Dependencies = await invoke("check_dependencies");
      setDependencies(deps);
      addLog(
        `Dependencies checked: ADB=${deps.adb}, Scrcpy=${deps.scrcpy}`,
        "INFO",
      );
    } catch (e) {
      console.error("Failed to check dependencies:", e);
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
      console.error("Failed to list devices:", e);
      addLog(`Failed to list devices: ${e}`, "ERROR");
    }
  }

  async function startScrcpy(serial?: string) {
    const deviceSerial = serial || selectedDevice;
    if (!deviceSerial) return;
    setLoading(true);
    addLog(`Testing device connection: ${deviceSerial}`);
    try {
      await invoke("test_device", { serial: deviceSerial });
      addLog(`Device test passed for: ${deviceSerial}`, "SUCCESS");
    } catch (e) {
      console.error("Device test failed:", e);
      addLog(`Device test failed: ${e}`, "ERROR");
      setLoading(false);
      return;
    }

    const settings = deviceSettings.get(deviceSerial) || {
      name: "",
      bitrate: 8000000,
      maxSize: 0,
      noControl: false,
      turnScreenOff: false,
      stayAwake: false,
      showTouches: false,
      recordingEnabled: false,
      recordFile: "",
      recordFormat: "mp4" as "mp4" | "mkv",
      audioForwarding: false,
      audioBitrate: 128,
      microphoneForwarding: false,
      displayId: 0,
      rotation: 0,
      crop: "",
      lockVideoOrientation: -1,
      displayBuffer: 0,
      windowX: 0,
      windowY: 0,
      windowWidth: 0,
      windowHeight: 0,
      alwaysOnTop: false,
      windowBorderless: false,
      fullscreen: false,
    };

    addLog(`Starting scrcpy for device: ${deviceSerial}`);
    try {
      await invoke("start_scrcpy", {
        serial: deviceSerial,
        bitrate: settings.bitrate > 0 ? settings.bitrate : undefined,
        maxSize: settings.maxSize > 0 ? settings.maxSize : undefined,
        noControl: settings.noControl,
        turnScreenOff: settings.turnScreenOff,
        stayAwake: settings.stayAwake,
        showTouches: settings.showTouches,
        record: settings.recordingEnabled,
        recordFile: settings.recordingEnabled ? settings.recordFile : undefined,
        audioForwarding: settings.audioForwarding,
        audioBitrate: settings.audioForwarding
          ? settings.audioBitrate
          : undefined,
        microphoneForwarding: settings.microphoneForwarding,
        displayId: settings.displayId,
        rotation: settings.rotation,
        crop: settings.crop.trim() || undefined,
        lockVideoOrientation:
          settings.lockVideoOrientation >= 0
            ? settings.lockVideoOrientation
            : null,
        displayBuffer:
          settings.displayBuffer > 0 ? settings.displayBuffer : undefined,
        windowX: settings.windowX > 0 ? settings.windowX : undefined,
        windowY: settings.windowY > 0 ? settings.windowY : undefined,
        windowWidth:
          settings.windowWidth > 0 ? settings.windowWidth : undefined,
        windowHeight:
          settings.windowHeight > 0 ? settings.windowHeight : undefined,
        alwaysOnTop: settings.alwaysOnTop,
        windowBorderless: settings.windowBorderless,
        fullscreen: settings.fullscreen,
      });
      setActiveDevices((prev) => [...prev, deviceSerial]);
      addLog(
        `Scrcpy started successfully${settings.recordingEnabled ? " (recording enabled)" : ""}`,
        "SUCCESS",
      );
    } catch (e) {
      console.error("Failed to start scrcpy:", e);
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
      console.error("Failed to stop scrcpy:", e);
      addLog(`Failed to stop scrcpy: ${e}`, "ERROR");
    }
  }

  const renderContent = () => {
    switch (currentTab) {
      case "devices":
        return (
          <div className="tab-content">
            {hasMissingDeps && (
              <div className="alert alert-error">
                <ExclamationTriangleIcon className="alert-icon" />
                <div>
                  {!dependencies.adb && (
                    <p>ADB not found. Please install Android Debug Bridge.</p>
                  )}
                  {!dependencies.scrcpy && (
                    <p>Scrcpy not found. Please install scrcpy.</p>
                  )}
                </div>
              </div>
            )}

            <header className="devices-header">
              <div className="devices-title-section">
                <h2>Connected Devices</h2>
                <p className="devices-subtitle">
                  Manage and mirror your Android endpoints
                </p>
              </div>
              <div className="devices-actions">
                <button className="btn btn-secondary" onClick={listDevices}>
                  <ArrowPathIcon className="btn-icon" />
                  Refresh List
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => startScrcpy()}
                >
                  Quick Start
                </button>
              </div>
            </header>
            <div className="devices-controls">
              <input
                type="text"
                placeholder="Search devices by serial or model..."
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                className="input"
              />
              <div className="device-filters">
                {[
                  {
                    key: "all" as const,
                    label: "All",
                    icon: Bars3Icon,
                    count: devices.length,
                  },
                  {
                    key: "usb" as const,
                    label: "USB",
                    icon: ComputerDesktopIcon,
                    count: devices.filter((d) => !d.is_wireless).length,
                  },
                  {
                    key: "wireless" as const,
                    label: "Wireless",
                    icon: WifiIcon,
                    count: devices.filter((d) => d.is_wireless).length,
                  },
                ].map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    className={`btn device-filter-btn ${
                      deviceFilter === key ? "active" : ""
                    }`}
                    onClick={() => setDeviceFilter(key)}
                  >
                    <Icon className="btn-icon" />
                    {label} ({count})
                  </button>
                ))}
              </div>
            </div>
            <section className="section">
              <div className="devices-list">
                {devices
                  .filter((d) => {
                    const matchesSearch =
                      deviceSearch === "" ||
                      d.serial
                        .toLowerCase()
                        .includes(deviceSearch.toLowerCase()) ||
                      (d.model &&
                        d.model
                          .toLowerCase()
                          .includes(deviceSearch.toLowerCase()));
                    const matchesFilter =
                      deviceFilter === "all" ||
                      (deviceFilter === "usb" && !d.is_wireless) ||
                      (deviceFilter === "wireless" && d.is_wireless);
                    return matchesSearch && matchesFilter;
                  })
                  .map((d) => {
                    return (
                      <div
                        key={d.serial}
                        className={`device-card ${d.status === "device" ? "online" : "offline"}`}
                        onDoubleClick={() => {
                          loadDeviceSettings(d.serial);
                          setSelectedDeviceForSettings(d.serial);
                          setShowDeviceModal(true);
                        }}
                      >
                        <div className="device-header">
                          <div className="device-serial">
                            {deviceNames.get(d.serial) || d.serial}
                          </div>
                          <div className="device-status">
                            <span
                              className={`status-dot ${d.status === "device" ? "online" : "offline"}`}
                            ></span>
                            {d.status}
                            {d.is_wireless && (
                              <WifiIcon className="wireless-icon" />
                            )}
                          </div>
                        </div>
                        <div className="device-info">
                          {d.model && <div>Model: {d.model}</div>}
                          {d.android_version && (
                            <div>Android: {d.android_version}</div>
                          )}
                          {d.battery_level !== undefined && (
                            <div>Battery: {d.battery_level}%</div>
                          )}
                        </div>
                        <div className="device-actions">
                          {d.is_wireless && (
                            <button
                              className="btn btn-icon-only btn-delete"
                              onClick={() => disconnectWireless(d.serial)}
                              disabled={wirelessConnecting}
                              title="Delete wireless connection"
                            >
                              <TrashIcon className="btn-icon" />
                            </button>
                          )}
                          <div className="device-action-main">
                            {activeDevices.includes(d.serial) ? (
                              <button
                                className="btn btn-stop"
                                onClick={() => stopScrcpy(d.serial)}
                                disabled={
                                  !dependencies?.adb ||
                                  !dependencies?.scrcpy ||
                                  d.status !== "device"
                                }
                              >
                                Stop
                              </button>
                            ) : (
                              <button
                                className="btn btn-primary"
                                onClick={() => startScrcpy(d.serial)}
                                disabled={
                                  loading ||
                                  !dependencies?.adb ||
                                  !dependencies?.scrcpy ||
                                  d.status !== "device"
                                }
                              >
                                Mirror
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                <div
                  className="device-card pair-new-device"
                  style={{ border: "2px dashed var(--border-color)" }}
                  onClick={() => {
                    setShowPairModal(true);
                    setPairMode(null);
                  }}
                >
                  <div className="device-header">
                    <div
                      className="device-serial"
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <PlusIcon
                        style={{
                          width: "1.5rem",
                          height: "1.5rem",
                          marginRight: "0.5rem",
                        }}
                      />
                      Pair New Device
                    </div>
                  </div>
                  <div className="device-info">
                    <div>Connect via USB or Wi-Fi</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="section">
              <h2>Recent Activity</h2>
              <div className="logs-container">
                {logs
                  .slice(-3)
                  .reverse()
                  .map((log, index) => (
                    <div
                      key={index}
                      className={`log-entry log-${log.level.toLowerCase()}`}
                    >
                      <span className="log-timestamp">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="log-level">{log.level}</span>
                      <span className="log-message">{log.message}</span>
                    </div>
                  ))}
              </div>
            </section>

            {showPairModal && (
              <div
                className="modal-overlay"
                onClick={() => setShowPairModal(false)}
              >
                <div
                  className="modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="modal-header">
                    <h3>Pair New Device</h3>
                    <button
                      className="modal-close"
                      onClick={() => setShowPairModal(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="modal-body">
                    {!pairMode ? (
                      <div className="pair-options">
                        <button
                          className="btn btn-primary"
                          onClick={() => setPairMode("usb")}
                        >
                          Connect via USB
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => setPairMode("wireless")}
                        >
                          Connect via Wireless
                        </button>
                      </div>
                    ) : pairMode === "usb" ? (
                      <div className="pair-usb">
                        <p>
                          USB devices are automatically detected. Select a
                          device to mirror:
                        </p>
                        <select
                          value={selectedUsbDevice}
                          onChange={(e) => setSelectedUsbDevice(e.target.value)}
                          className="select"
                        >
                          <option value="">Select USB device</option>
                          {devices
                            .filter(
                              (d) => d.status === "device" && !d.is_wireless,
                            )
                            .map((d) => (
                              <option key={d.serial} value={d.serial}>
                                {d.serial} {d.model ? `(${d.model})` : ""}
                              </option>
                            ))}
                        </select>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            if (selectedUsbDevice)
                              startScrcpy(selectedUsbDevice);
                            setShowPairModal(false);
                            setPairMode(null);
                          }}
                        >
                          Start Mirroring
                        </button>
                      </div>
                    ) : (
                      <div className="pair-wireless">
                        <label className="input-label">
                          Device IP Address:
                          <input
                            type="text"
                            placeholder="192.168.1.100"
                            value={deviceIp}
                            onChange={(e) => setDeviceIp(e.target.value)}
                            className="input"
                          />
                        </label>
                        <label className="input-label">
                          Port:
                          <input
                            type="number"
                            min="1024"
                            max="65535"
                            value={devicePort}
                            onChange={(e) =>
                              setDevicePort(Number(e.target.value))
                            }
                            className="input"
                            style={{ width: "120px" }}
                          />
                        </label>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setupWirelessConnection();
                            setShowPairModal(false);
                            setPairMode(null);
                          }}
                        >
                          Connect
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setPairMode(null);
                        setShowPairModal(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showDeviceModal && selectedDeviceForSettings && (
              <div
                className="modal-overlay"
                onClick={() => setShowDeviceModal(false)}
              >
                <div
                  className="modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="modal-header">
                    <h3>Device Settings for {selectedDeviceForSettings}</h3>
                    <button
                      className="modal-close"
                      onClick={() => setShowDeviceModal(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="modal-body">
                    <section className="section">
                      <h2>Device Name</h2>
                      <div className="row">
                        <label className="input-label">
                          Name:
                          <input
                            type="text"
                            value={
                              deviceNames.get(selectedDeviceForSettings) || ""
                            }
                            onChange={(e) => {
                              const newNames = new Map(deviceNames);
                              newNames.set(
                                selectedDeviceForSettings,
                                e.target.value,
                              );
                              setDeviceNames(newNames);
                            }}
                            placeholder="Enter device name..."
                            className="input"
                          />
                        </label>
                      </div>
                    </section>
                    <section className="section">
                      <h2>General</h2>
                      <div className="row">
                        <label className="input-label">
                          Bitrate (bps):
                          <input
                            type="number"
                            value={bitrate}
                            onChange={(e) => setBitrate(Number(e.target.value))}
                            className="input"
                          />
                        </label>
                      </div>
                      <div className="row">
                        <label className="input-label">
                          Max Size:
                          <input
                            type="number"
                            value={maxSize}
                            onChange={(e) => setMaxSize(Number(e.target.value))}
                            className="input"
                          />
                        </label>
                      </div>
                      <div className="row">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={noControl}
                            onChange={(e) => setNoControl(e.target.checked)}
                          />
                          No Control
                        </label>
                      </div>
                      <div className="row">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={turnScreenOff}
                            onChange={(e) => setTurnScreenOff(e.target.checked)}
                          />
                          Turn Screen Off
                        </label>
                      </div>
                      <div className="row">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={stayAwake}
                            onChange={(e) => setStayAwake(e.target.checked)}
                          />
                          Stay Awake
                        </label>
                      </div>
                      <div className="row">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={showTouches}
                            onChange={(e) => setShowTouches(e.target.checked)}
                          />
                          Show Touches
                        </label>
                      </div>
                    </section>
                    <section className="section">
                      <h2>Recording</h2>
                      <div className="row">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={recordingEnabled}
                            onChange={(e) =>
                              setRecordingEnabled(e.target.checked)
                            }
                          />
                          Enable Recording
                        </label>
                      </div>
                      {recordingEnabled && (
                        <>
                          <div className="row">
                            <label className="input-label">
                              File Path:
                              <input
                                type="text"
                                value={recordFile}
                                onChange={(e) => setRecordFile(e.target.value)}
                                className="input"
                              />
                            </label>
                            <button
                              className="btn btn-secondary"
                              onClick={selectSaveFile}
                            >
                              Browse
                            </button>
                          </div>
                          <div className="row">
                            <label className="input-label">
                              Format:
                              <select
                                value={recordFormat}
                                onChange={(e) =>
                                  setRecordFormat(
                                    e.target.value as "mp4" | "mkv",
                                  )
                                }
                                className="select"
                              >
                                <option value="mp4">MP4</option>
                                <option value="mkv">MKV</option>
                              </select>
                            </label>
                          </div>
                        </>
                      )}
                    </section>
                    <section className="section">
                      <h2>Audio</h2>
                      <div className="row">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={audioForwarding}
                            onChange={(e) =>
                              setAudioForwarding(e.target.checked)
                            }
                          />
                          Audio Forwarding
                        </label>
                      </div>
                      {audioForwarding && (
                        <div className="row">
                          <label className="input-label">
                            Audio Bitrate (kbps):
                            <input
                              type="number"
                              value={audioBitrate / 1000}
                              onChange={(e) =>
                                setAudioBitrate(Number(e.target.value) * 1000)
                              }
                              className="input"
                            />
                          </label>
                        </div>
                      )}
                      <div className="row">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={microphoneForwarding}
                            onChange={(e) =>
                              setMicrophoneForwarding(e.target.checked)
                            }
                          />
                          Microphone Forwarding
                        </label>
                      </div>
                    </section>
                    <section className="section">
                      <h2>Display</h2>
                      <div className="row">
                        <label className="input-label">
                          Display ID:
                          <input
                            type="number"
                            value={displayId}
                            onChange={(e) =>
                              setDisplayId(Number(e.target.value))
                            }
                            className="input"
                          />
                        </label>
                      </div>
                      <div className="row">
                        <label className="input-label">
                          Orientation:
                          <select
                            value={rotation.toString()}
                            onChange={(e) =>
                              setRotation(Number(e.target.value))
                            }
                            className="select"
                          >
                            <option value="0">0°</option>
                            <option value="90">90°</option>
                            <option value="180">180°</option>
                            <option value="270">270°</option>
                          </select>
                        </label>
                      </div>
                      <div className="row">
                        <label className="input-label">
                          Crop (width:height:x:y):
                          <input
                            type="text"
                            value={crop}
                            onChange={(e) => setCrop(e.target.value)}
                            className="input"
                            placeholder="e.g. 1920:1080:0:0"
                          />
                        </label>
                      </div>
                      <div className="row">
                        <label className="input-label">
                          Lock Video Orientation:
                          <select
                            value={lockVideoOrientation.toString()}
                            onChange={(e) =>
                              setLockVideoOrientation(Number(e.target.value))
                            }
                            className="select"
                          >
                            <option value="-1">Unlocked</option>
                            <option value="0">0°</option>
                            <option value="1">90°</option>
                            <option value="2">180°</option>
                            <option value="3">270°</option>
                          </select>
                        </label>
                      </div>
                      <div className="row">
                        <label className="input-label">
                          Display Buffer (ms):
                          <input
                            type="number"
                            value={displayBuffer}
                            onChange={(e) =>
                              setDisplayBuffer(Number(e.target.value))
                            }
                            className="input"
                          />
                        </label>
                      </div>
                    </section>
                    <section className="section">
                      <h2>Window</h2>
                      <div className="row">
                        <label className="input-label">
                          Window X:
                          <input
                            type="number"
                            value={windowX}
                            onChange={(e) => setWindowX(Number(e.target.value))}
                            className="input"
                          />
                        </label>
                        <label className="input-label">
                          Window Y:
                          <input
                            type="number"
                            value={windowY}
                            onChange={(e) => setWindowY(Number(e.target.value))}
                            className="input"
                          />
                        </label>
                      </div>
                      <div className="row">
                        <label className="input-label">
                          Window Width:
                          <input
                            type="number"
                            value={windowWidth}
                            onChange={(e) =>
                              setWindowWidth(Number(e.target.value))
                            }
                            className="input"
                          />
                        </label>
                        <label className="input-label">
                          Window Height:
                          <input
                            type="number"
                            value={windowHeight}
                            onChange={(e) =>
                              setWindowHeight(Number(e.target.value))
                            }
                            className="input"
                          />
                        </label>
                      </div>
                      <div className="row">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={alwaysOnTop}
                            onChange={(e) => setAlwaysOnTop(e.target.checked)}
                          />
                          Always on Top
                        </label>
                      </div>
                      <div className="row">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={windowBorderless}
                            onChange={(e) =>
                              setWindowBorderless(e.target.checked)
                            }
                          />
                          Borderless
                        </label>
                      </div>
                      <div className="row">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={fullscreen}
                            onChange={(e) => setFullscreen(e.target.checked)}
                          />
                          Fullscreen
                        </label>
                      </div>
                    </section>
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowDeviceModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        saveDeviceSettings(selectedDeviceForSettings);
                        setShowDeviceModal(false);
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case "presets":
        return (
          <div className="tab-content">
            <header className="header">
              <DocumentTextIcon className="header-icon" />
              <h1>Presets</h1>
            </header>
            <section className="section">
              <h2>Save Current Configuration</h2>
              <div className="row">
                <input
                  type="text"
                  placeholder="Preset name"
                  className="input"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      savePreset((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const name = prompt("Enter preset name");
                    if (name) savePreset(name);
                  }}
                >
                  Save Preset
                </button>
              </div>
            </section>
            <section className="section">
              <h2>Available Presets</h2>
              <div className="presets-list">
                {presets.map((preset) => (
                  <div key={preset.id} className="preset-item">
                    <span>{preset.name}</span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => loadPreset(preset)}
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );
      case "logs":
        return (
          <div className="tab-content">
            <header className="header">
              <Bars3Icon className="header-icon" />
              <h1>Logs</h1>
            </header>
            <section className="section">
              <div className="logs-container">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`log-entry log-${log.level.toLowerCase()}`}
                  >
                    <span className="log-timestamp">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="log-level">{log.level}</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );
      case "settings":
        return (
          <div className="tab-content">
            <header className="header">
              <AdjustmentsHorizontalIcon className="header-icon" />
              <h1>Settings</h1>
            </header>

            <section className="section">
              <h2>Theme</h2>
              <div className="row">
                <div className="select-wrapper">
                  <select
                    key={`theme-select-${theme}`}
                    value={theme}
                    onChange={(e) => {
                      const newTheme = e.target.value as Theme;
                      setTheme(newTheme);
                      saveSettings(newTheme, colorScheme, fontSize);
                    }}
                    className="select"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--text-primary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="section">
              <h2>Color Scheme</h2>
              <div className="row">
                <div className="select-wrapper">
                  <select
                    key={`color-select-${theme}`}
                    value={colorScheme.name}
                    onChange={(e) => {
                      const selectedScheme = colorSchemes.find(
                        (s) => s.name === e.target.value,
                      );
                      if (selectedScheme) {
                        setColorScheme(selectedScheme);
                        saveSettings(theme, selectedScheme, fontSize);
                      }
                    }}
                    className="select"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--text-primary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    {colorSchemes.map((scheme) => (
                      <option key={scheme.name} value={scheme.name}>
                        {scheme.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="section">
              <h2>Font Size</h2>
              <div className="row">
                <label className="input-label">
                  Font Size (px):
                  <input
                    type="number"
                    min="8"
                    max="24"
                    step="1"
                    value={fontSize}
                    onChange={(e) => {
                      const newFontSize = parseInt(e.target.value, 10);
                      if (
                        !isNaN(newFontSize) &&
                        newFontSize >= 8 &&
                        newFontSize <= 24
                      ) {
                        setFontSize(newFontSize);
                        saveSettings(theme, colorScheme, newFontSize);
                      }
                    }}
                    className="input"
                    style={{ width: "120px" }}
                  />
                </label>
              </div>
            </section>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <DevicePhoneMobileIcon className="sidebar-logo" />
          <div className="sidebar-title">
            <h2>Scrcpy GUI</h2>
            <span className="sidebar-version">v0.2.3</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`sidebar-tab ${currentTab === tab.id ? "active" : ""}`}
                onClick={() => setCurrentTab(tab.id)}
              >
                <Icon className="sidebar-icon" />
                {tab.name}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="dependency-status">
            <div className="dependency-item">
              <span className="dependency-label">ADB:</span>
              <span
                className={`dependency-status ${dependencies?.adb ? "ready" : "not-ready"}`}
              >
                {dependencies?.adb ? "✓" : "✗"}
              </span>
            </div>
            <div className="dependency-item">
              <span className="dependency-label">Scrcpy:</span>
              <span
                className={`dependency-status ${dependencies?.scrcpy ? "ready" : "not-ready"}`}
              >
                {dependencies?.scrcpy ? "✓" : "✗"}
              </span>
            </div>
          </div>
          <button
            className="btn btn-secondary refresh-btn"
            onClick={checkDependencies}
            title="Refresh dependency status"
          >
            <ArrowPathIcon className="btn-icon" />
          </button>
        </div>
      </aside>
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

export default App;
