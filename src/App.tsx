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
  ChevronDownIcon,
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
  maxFps: number;
  videoCodec: string;
  videoEncoder: string;
  videoBuffer: number;
  powerOffOnClose: boolean;
  noPowerOn: boolean;
  audioCodec: string;
  noCleanup: boolean;
  forceAdbForward: boolean;
  timeLimit: number;
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
  maxFps: number;
  videoCodec: string;
  videoEncoder: string;
  videoBuffer: number;
  powerOffOnClose: boolean;
  noPowerOn: boolean;
  audioCodec: string;
  noCleanup: boolean;
  forceAdbForward: boolean;
  timeLimit: number;
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

  // Performance & quality state
  const [maxFps, setMaxFps] = useState<number>(0);
  const [videoCodec, setVideoCodec] = useState<string>("h264");
  const [videoEncoder, setVideoEncoder] = useState<string>("");
  const [videoBuffer, setVideoBuffer] = useState<number>(0);
  const [powerOffOnClose, setPowerOffOnClose] = useState(false);
  const [noPowerOn, setNoPowerOn] = useState(false);

  // Network optimization state
  const [audioCodec, setAudioCodec] = useState<string>("opus");
  const [noCleanup, setNoCleanup] = useState(false);
  const [forceAdbForward, setForceAdbForward] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number>(0);

  // Device search and filter state
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<"all" | "usb" | "wireless">(
    "all",
  );

  // Active mirroring devices
  const [activeDevices, setActiveDevices] = useState<string[]>([]);

  // Device settings modal expanded panels
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());

  // Pair new device modal states
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairMode, setPairMode] = useState<"usb" | "wireless" | null>(null);
  const [selectedUsbDevice, setSelectedUsbDevice] = useState("");

  const hasMissingDeps =
    dependencies && (!dependencies.adb || !dependencies.scrcpy);

  const togglePanel = (panel: string) => {
    const newExpanded = new Set(expandedPanels);
    if (newExpanded.has(panel)) {
      newExpanded.delete(panel);
    } else {
      newExpanded.add(panel);
    }
    setExpandedPanels(newExpanded);
  };

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
    const defaults: DeviceSettings = {
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
      maxFps: 0,
      videoCodec: "h264",
      videoEncoder: "",
      videoBuffer: 0,
      powerOffOnClose: false,
      noPowerOn: false,
      audioCodec: "opus",
      noCleanup: false,
      forceAdbForward: false,
      timeLimit: 0,
    };
    const settings: DeviceSettings = {
      ...defaults,
      ...deviceSettings.get(serial),
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
    setMaxFps(settings.maxFps ?? 0);
    setVideoCodec(settings.videoCodec ?? "h264");
    setVideoEncoder(settings.videoEncoder ?? "");
    setVideoBuffer(settings.videoBuffer ?? 0);
    setPowerOffOnClose(settings.powerOffOnClose ?? false);
    setNoPowerOn(settings.noPowerOn ?? false);
    setAudioCodec(settings.audioCodec ?? "opus");
    setNoCleanup(settings.noCleanup ?? false);
    setForceAdbForward(settings.forceAdbForward ?? false);
    setTimeLimit(settings.timeLimit ?? 0);
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
      maxFps,
      videoCodec,
      videoEncoder,
      videoBuffer,
      powerOffOnClose,
      noPowerOn,
      audioCodec,
      noCleanup,
      forceAdbForward,
      timeLimit,
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
    setMaxFps(preset.maxFps ?? 0);
    setVideoCodec(preset.videoCodec ?? "h264");
    setVideoEncoder(preset.videoEncoder ?? "");
    setVideoBuffer(preset.videoBuffer ?? 0);
    setPowerOffOnClose(preset.powerOffOnClose ?? false);
    setNoPowerOn(preset.noPowerOn ?? false);
    setAudioCodec(preset.audioCodec ?? "opus");
    setNoCleanup(preset.noCleanup ?? false);
    setForceAdbForward(preset.forceAdbForward ?? false);
    setTimeLimit(preset.timeLimit ?? 0);
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

    const defaultSettings: DeviceSettings = {
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
      maxFps: 0,
      videoCodec: "h264",
      videoEncoder: "",
      videoBuffer: 0,
      powerOffOnClose: false,
      noPowerOn: false,
      audioCodec: "opus",
      noCleanup: false,
      forceAdbForward: false,
      timeLimit: 0,
    };
    const settings: DeviceSettings = {
      ...defaultSettings,
      ...deviceSettings.get(deviceSerial),
    };

    addLog(`Starting scrcpy for device: ${deviceSerial}`);
    try {
      await invoke("start_scrcpy", {
        serial: deviceSerial,
        bitrate: settings.bitrate > 0 ? settings.bitrate : undefined,
        maxSize: settings.maxSize > 0 ? settings.maxSize : undefined,
        noControl: settings.noControl ?? false,
        turnScreenOff: settings.turnScreenOff ?? false,
        stayAwake: settings.stayAwake ?? false,
        showTouches: settings.showTouches ?? false,
        record: settings.recordingEnabled ?? false,
        recordFile: settings.recordingEnabled ? settings.recordFile : undefined,
        audioForwarding: settings.audioForwarding ?? false,
        audioBitrate: settings.audioForwarding
          ? settings.audioBitrate
          : undefined,
        microphoneForwarding: settings.microphoneForwarding ?? false,
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
        alwaysOnTop: settings.alwaysOnTop ?? false,
        windowBorderless: settings.windowBorderless ?? false,
        fullscreen: settings.fullscreen ?? false,
        maxFps: settings.maxFps > 0 ? settings.maxFps : undefined,
        videoCodec:
          settings.videoCodec && settings.videoCodec !== "h264"
            ? settings.videoCodec
            : undefined,
        videoEncoder: settings.videoEncoder || undefined,
        videoBuffer:
          settings.videoBuffer > 0 ? settings.videoBuffer : undefined,
        powerOffOnClose: settings.powerOffOnClose ?? false,
        noPowerOn: settings.noPowerOn ?? false,
        audioCodec:
          settings.audioCodec && settings.audioCodec !== "opus"
            ? settings.audioCodec
            : undefined,
        noCleanup: settings.noCleanup ?? false,
        forceAdbForward: settings.forceAdbForward ?? false,
        timeLimit: settings.timeLimit > 0 ? settings.timeLimit : undefined,
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

            {showDeviceModal &&
              selectedDeviceForSettings &&
              (() => {
                const device = devices.find(
                  (d) => d.serial === selectedDeviceForSettings,
                );

                const generatedCommand = (() => {
                  let cmd = `scrcpy --serial ${selectedDeviceForSettings}`;
                  if (bitrate > 0) cmd += ` -b ${bitrate}`;
                  if (maxSize > 0) cmd += ` --max-size ${maxSize}`;
                  if (noControl) cmd += ` --no-control`;
                  if (turnScreenOff) cmd += ` --turn-screen-off`;
                  if (stayAwake) cmd += ` --stay-awake`;
                  if (showTouches) cmd += ` --show-touches`;
                  if (recordingEnabled && recordFile)
                    cmd += ` --record "${recordFile}"`;
                  if (audioForwarding && audioBitrate > 0)
                    cmd += ` --audio-bitrate ${audioBitrate}`;
                  if (microphoneForwarding) cmd += ` --microphone`;
                  if (displayId > 0) cmd += ` --display-id ${displayId}`;
                  if (rotation > 0) cmd += ` --orientation ${rotation}`;
                  if (crop) cmd += ` --crop ${crop}`;
                  if (lockVideoOrientation >= 0)
                    cmd += ` --lock-video-orientation ${lockVideoOrientation}`;
                  if (displayBuffer > 0)
                    cmd += ` --display-buffer ${displayBuffer}`;
                  if (windowX > 0) cmd += ` --window-x ${windowX}`;
                  if (windowY > 0) cmd += ` --window-y ${windowY}`;
                  if (windowWidth > 0) cmd += ` --window-width ${windowWidth}`;
                  if (windowHeight > 0)
                    cmd += ` --window-height ${windowHeight}`;
                  if (alwaysOnTop) cmd += ` --always-on-top`;
                  if (windowBorderless) cmd += ` --window-borderless`;
                  if (fullscreen) cmd += ` --fullscreen`;
                  if (maxFps > 0) cmd += ` --max-fps ${maxFps}`;
                  if (videoCodec && videoCodec !== "h264")
                    cmd += ` --video-codec=${videoCodec}`;
                  if (videoEncoder) cmd += ` --video-encoder="${videoEncoder}"`;
                  if (videoBuffer > 0) cmd += ` --video-buffer ${videoBuffer}`;
                  if (powerOffOnClose) cmd += ` --power-off-on-close`;
                  if (noPowerOn) cmd += ` --no-power-on`;
                  if (audioCodec && audioCodec !== "opus")
                    cmd += ` --audio-codec=${audioCodec}`;
                  if (noCleanup) cmd += ` --no-cleanup`;
                  if (forceAdbForward) cmd += ` --force-adb-forward`;
                  if (timeLimit > 0) cmd += ` --time-limit ${timeLimit}`;
                  return cmd;
                })();

                return (
                  <div
                    className="modal-overlay"
                    onClick={() => setShowDeviceModal(false)}
                  >
                    <div
                      className="modal-content"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        backgroundColor: "#0f0f14",
                        color: "white",
                        maxWidth: "800px",
                        width: "90%",
                      }}
                    >
                      <div
                        className="modal-header"
                        style={{
                          backgroundColor: "#0f0f14",
                          color: "white",
                          padding: "1.5rem",
                          borderBottom: "1px solid #333",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "1.5rem",
                              fontWeight: "bold",
                            }}
                          >
                            {deviceNames.get(selectedDeviceForSettings) ||
                              device?.model ||
                              selectedDeviceForSettings}
                          </h3>
                          <p
                            style={{
                              margin: "0.5rem 0",
                              color: "#b0b0b0",
                              fontSize: "0.9rem",
                            }}
                          >
                            {device?.is_wireless
                              ? selectedDeviceForSettings
                              : "USB"}{" "}
                            • Android {device?.android_version || "Unknown"}
                          </p>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "1rem",
                            alignItems: "center",
                          }}
                        >
                          <button
                            className="btn btn-secondary"
                            onClick={() =>
                              navigator.clipboard.writeText(generatedCommand)
                            }
                            style={{
                              backgroundColor: "#333",
                              color: "white",
                              border: "1px solid #555",
                            }}
                          >
                            Copy Command
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              const settings: DeviceSettings = {
                                name:
                                  deviceNames.get(selectedDeviceForSettings) ||
                                  "",
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
                                maxFps,
                                videoCodec,
                                videoEncoder,
                                videoBuffer,
                                powerOffOnClose,
                                noPowerOn,
                                audioCodec,
                                noCleanup,
                                forceAdbForward,
                                timeLimit,
                              };
                              const newSettings = new Map(deviceSettings);
                              newSettings.set(
                                selectedDeviceForSettings,
                                settings,
                              );
                              setDeviceSettings(newSettings);
                              localStorage.setItem(
                                "deviceSettings",
                                JSON.stringify(Array.from(newSettings)),
                              );
                              localStorage.setItem(
                                "deviceNames",
                                JSON.stringify(Array.from(deviceNames)),
                              );
                              startScrcpy(selectedDeviceForSettings);
                              setShowDeviceModal(false);
                            }}
                            style={{
                              backgroundColor: "#007bff",
                              color: "white",
                            }}
                          >
                            Launch Mirroring
                          </button>
                          <button
                            className="modal-close"
                            onClick={() => setShowDeviceModal(false)}
                            style={{
                              color: "white",
                              background: "none",
                              border: "none",
                              fontSize: "1.5rem",
                              cursor: "pointer",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div
                        className="modal-body"
                        style={{
                          backgroundColor: "#0f0f14",
                          color: "white",
                          padding: "1.5rem",
                        }}
                      >
                        <div
                          className="settings-panel"
                          style={{ marginBottom: "1rem" }}
                        >
                          <div
                            className="panel-header"
                            onClick={() => togglePanel("display")}
                            style={{
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "1rem 0",
                              borderBottom: "1px solid #333",
                            }}
                          >
                            <h4 style={{ margin: 0, fontSize: "1.1rem" }}>
                              Display & Quality
                            </h4>
                            <ChevronDownIcon
                              style={{
                                width: "1rem",
                                height: "1rem",
                                transform: expandedPanels.has("display")
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </div>
                          {expandedPanels.has("display") && (
                            <div
                              className="panel-content"
                              style={{ padding: "1rem 0" }}
                            >
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Resolution Limit:
                                  <select
                                    value={maxSize}
                                    onChange={(e) =>
                                      setMaxSize(Number(e.target.value))
                                    }
                                    style={{
                                      backgroundColor: "#1e1e2e",
                                      color: "white",
                                      border: "1px solid #333",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      width: "100%",
                                    }}
                                  >
                                    <option value="0">Unlimited</option>
                                    <option value="720">720p</option>
                                    <option value="1080">1080p</option>
                                    <option value="1440">1440p</option>
                                  </select>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Bitrate (bps):
                                  <input
                                    type="number"
                                    value={bitrate}
                                    onChange={(e) =>
                                      setBitrate(Number(e.target.value))
                                    }
                                    style={{
                                      backgroundColor: "#1e1e2e",
                                      color: "white",
                                      border: "1px solid #333",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      width: "100%",
                                    }}
                                  />
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Orientation:
                                  <select
                                    value={rotation.toString()}
                                    onChange={(e) =>
                                      setRotation(Number(e.target.value))
                                    }
                                    style={{
                                      backgroundColor: "#1e1e2e",
                                      color: "white",
                                      border: "1px solid #333",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      width: "100%",
                                    }}
                                  >
                                    <option value="0">0°</option>
                                    <option value="90">90°</option>
                                    <option value="180">180°</option>
                                    <option value="270">270°</option>
                                  </select>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Lock Video Orientation:
                                  <select
                                    value={lockVideoOrientation.toString()}
                                    onChange={(e) =>
                                      setLockVideoOrientation(
                                        Number(e.target.value),
                                      )
                                    }
                                    style={{
                                      backgroundColor: "#1e1e2e",
                                      color: "white",
                                      border: "1px solid #333",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      width: "100%",
                                    }}
                                  >
                                    <option value="-1">Unlocked</option>
                                    <option value="0">0°</option>
                                    <option value="1">90°</option>
                                    <option value="2">180°</option>
                                    <option value="3">270°</option>
                                  </select>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Display ID:
                                  <input
                                    type="number"
                                    min="0"
                                    value={displayId}
                                    onChange={(e) =>
                                      setDisplayId(Number(e.target.value))
                                    }
                                    placeholder="0 (default)"
                                    style={{
                                      backgroundColor: "#1e1e2e",
                                      color: "white",
                                      border: "1px solid #333",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      width: "100%",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginTop: "0.25rem",
                                      display: "block",
                                    }}
                                  >
                                    Select display for multi-display devices (0
                                    = main display)
                                  </span>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Screen Crop:
                                  <input
                                    type="text"
                                    value={crop}
                                    onChange={(e) => setCrop(e.target.value)}
                                    placeholder="width:height:x:y (e.g. 1080:1920:0:0)"
                                    style={{
                                      backgroundColor: "#1e1e2e",
                                      color: "white",
                                      border: "1px solid #333",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      width: "100%",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginTop: "0.25rem",
                                      display: "block",
                                    }}
                                  >
                                    Crop format: width:height:x:y (leave empty
                                    for no crop)
                                  </span>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Display Buffer (ms):
                                  <input
                                    type="number"
                                    min="0"
                                    value={displayBuffer}
                                    onChange={(e) =>
                                      setDisplayBuffer(Number(e.target.value))
                                    }
                                    placeholder="0 (disabled)"
                                    style={{
                                      backgroundColor: "#1e1e2e",
                                      color: "white",
                                      border: "1px solid #333",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      width: "100%",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginTop: "0.25rem",
                                      display: "block",
                                    }}
                                  >
                                    Add a buffering delay (in milliseconds) to
                                    reduce jitter (0 = disabled)
                                  </span>
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                        <div
                          className="settings-panel"
                          style={{ marginBottom: "1rem" }}
                        >
                          <div
                            className="panel-header"
                            onClick={() => togglePanel("window")}
                            style={{
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "1rem 0",
                              borderBottom: "1px solid #333",
                            }}
                          >
                            <h4 style={{ margin: 0, fontSize: "1.1rem" }}>
                              Window Management
                            </h4>
                            <ChevronDownIcon
                              style={{
                                width: "1rem",
                                height: "1rem",
                                transform: expandedPanels.has("window")
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </div>
                          {expandedPanels.has("window") && (
                            <div
                              className="panel-content"
                              style={{ padding: "1rem 0" }}
                            >
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Window Position:
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "0.5rem",
                                    }}
                                  >
                                    <input
                                      type="number"
                                      min="0"
                                      value={windowX}
                                      onChange={(e) =>
                                        setWindowX(Number(e.target.value))
                                      }
                                      placeholder="X"
                                      style={{
                                        backgroundColor: "#1e1e2e",
                                        color: "white",
                                        border: "1px solid #333",
                                        padding: "0.5rem",
                                        borderRadius: "4px",
                                        flex: 1,
                                      }}
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      value={windowY}
                                      onChange={(e) =>
                                        setWindowY(Number(e.target.value))
                                      }
                                      placeholder="Y"
                                      style={{
                                        backgroundColor: "#1e1e2e",
                                        color: "white",
                                        border: "1px solid #333",
                                        padding: "0.5rem",
                                        borderRadius: "4px",
                                        flex: 1,
                                      }}
                                    />
                                  </div>
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginTop: "0.25rem",
                                      display: "block",
                                    }}
                                  >
                                    X and Y coordinates (0 = default position)
                                  </span>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Window Size:
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "0.5rem",
                                    }}
                                  >
                                    <input
                                      type="number"
                                      min="0"
                                      value={windowWidth}
                                      onChange={(e) =>
                                        setWindowWidth(Number(e.target.value))
                                      }
                                      placeholder="Width"
                                      style={{
                                        backgroundColor: "#1e1e2e",
                                        color: "white",
                                        border: "1px solid #333",
                                        padding: "0.5rem",
                                        borderRadius: "4px",
                                        flex: 1,
                                      }}
                                    />
                                    <input
                                      type="number"
                                      min="0"
                                      value={windowHeight}
                                      onChange={(e) =>
                                        setWindowHeight(Number(e.target.value))
                                      }
                                      placeholder="Height"
                                      style={{
                                        backgroundColor: "#1e1e2e",
                                        color: "white",
                                        border: "1px solid #333",
                                        padding: "0.5rem",
                                        borderRadius: "4px",
                                        flex: 1,
                                      }}
                                    />
                                  </div>
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginTop: "0.25rem",
                                      display: "block",
                                    }}
                                  >
                                    Width and Height in pixels (0 = auto)
                                  </span>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="checkbox-label"
                                  style={{
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={alwaysOnTop}
                                    onChange={(e) =>
                                      setAlwaysOnTop(e.target.checked)
                                    }
                                    style={{ marginRight: "0.5rem" }}
                                  />
                                  Always on Top
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="checkbox-label"
                                  style={{
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={windowBorderless}
                                    onChange={(e) =>
                                      setWindowBorderless(e.target.checked)
                                    }
                                    style={{ marginRight: "0.5rem" }}
                                  />
                                  Borderless Window
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="checkbox-label"
                                  style={{
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={fullscreen}
                                    onChange={(e) =>
                                      setFullscreen(e.target.checked)
                                    }
                                    style={{ marginRight: "0.5rem" }}
                                  />
                                  Fullscreen Mode
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                        <div
                          className="settings-panel"
                          style={{ marginBottom: "1rem" }}
                        >
                          <div
                            className="panel-header"
                            onClick={() => togglePanel("behavior")}
                            style={{
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "1rem 0",
                              borderBottom: "1px solid #333",
                            }}
                          >
                            <h4 style={{ margin: 0, fontSize: "1.1rem" }}>
                              Behavior
                            </h4>
                            <ChevronDownIcon
                              style={{
                                width: "1rem",
                                height: "1rem",
                                transform: expandedPanels.has("behavior")
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </div>
                          {expandedPanels.has("behavior") && (
                            <div
                              className="panel-content"
                              style={{ padding: "1rem 0" }}
                            >
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="checkbox-label"
                                  style={{
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={stayAwake}
                                    onChange={(e) =>
                                      setStayAwake(e.target.checked)
                                    }
                                    style={{ marginRight: "0.5rem" }}
                                  />
                                  Stay Awake
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="checkbox-label"
                                  style={{
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={showTouches}
                                    onChange={(e) =>
                                      setShowTouches(e.target.checked)
                                    }
                                    style={{ marginRight: "0.5rem" }}
                                  />
                                  Show Touches
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="checkbox-label"
                                  style={{
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={turnScreenOff}
                                    onChange={(e) =>
                                      setTurnScreenOff(e.target.checked)
                                    }
                                    style={{ marginRight: "0.5rem" }}
                                  />
                                  Turn Screen Off
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="checkbox-label"
                                  style={{
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={noControl}
                                    onChange={(e) =>
                                      setNoControl(e.target.checked)
                                    }
                                    style={{ marginRight: "0.5rem" }}
                                  />
                                  Read-only Mode
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                        <div
                          className="settings-panel"
                          style={{ marginBottom: "1rem" }}
                        >
                          <div
                            className="panel-header"
                            onClick={() => togglePanel("recording")}
                            style={{
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "1rem 0",
                              borderBottom: "1px solid #333",
                            }}
                          >
                            <h4 style={{ margin: 0, fontSize: "1.1rem" }}>
                              Recording
                            </h4>
                            <ChevronDownIcon
                              style={{
                                width: "1rem",
                                height: "1rem",
                                transform: expandedPanels.has("recording")
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </div>
                          {expandedPanels.has("recording") && (
                            <div
                              className="panel-content"
                              style={{ padding: "1rem 0" }}
                            >
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="checkbox-label"
                                  style={{
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={recordingEnabled}
                                    onChange={(e) =>
                                      setRecordingEnabled(e.target.checked)
                                    }
                                    style={{ marginRight: "0.5rem" }}
                                  />
                                  Enable Recording
                                </label>
                              </div>
                              {recordingEnabled && (
                                <>
                                  <div
                                    className="row"
                                    style={{ marginBottom: "1rem" }}
                                  >
                                    <label
                                      className="input-label"
                                      style={{
                                        color: "white",
                                        display: "block",
                                        marginBottom: "0.5rem",
                                      }}
                                    >
                                      Output Filename:
                                      <div
                                        style={{
                                          display: "flex",
                                          gap: "0.5rem",
                                        }}
                                      >
                                        <input
                                          type="text"
                                          value={recordFile}
                                          onChange={(e) =>
                                            setRecordFile(e.target.value)
                                          }
                                          style={{
                                            backgroundColor: "#1e1e2e",
                                            color: "white",
                                            border: "1px solid #333",
                                            padding: "0.5rem",
                                            borderRadius: "4px",
                                            flex: 1,
                                          }}
                                        />
                                        <button
                                          onClick={selectSaveFile}
                                          style={{
                                            backgroundColor: "#333",
                                            color: "white",
                                            border: "1px solid #555",
                                            padding: "0.5rem",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                          }}
                                        >
                                          Browse
                                        </button>
                                      </div>
                                    </label>
                                  </div>
                                  <div
                                    className="row"
                                    style={{ marginBottom: "1rem" }}
                                  >
                                    <label
                                      className="input-label"
                                      style={{
                                        color: "white",
                                        display: "block",
                                        marginBottom: "0.5rem",
                                      }}
                                    >
                                      Container format:
                                      <select
                                        value={recordFormat}
                                        onChange={(e) =>
                                          setRecordFormat(
                                            e.target.value as "mp4" | "mkv",
                                          )
                                        }
                                        style={{
                                          backgroundColor: "#1e1e2e",
                                          color: "white",
                                          border: "1px solid #333",
                                          padding: "0.5rem",
                                          borderRadius: "4px",
                                          width: "100%",
                                        }}
                                      >
                                        <option value="mp4">MP4</option>
                                        <option value="mkv">MKV</option>
                                      </select>
                                    </label>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div
                          className="settings-panel"
                          style={{ marginBottom: "1rem" }}
                        >
                          <div
                            className="panel-header"
                            onClick={() => togglePanel("performance")}
                            style={{
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "1rem 0",
                              borderBottom: "1px solid #333",
                            }}
                          >
                            <h4 style={{ margin: 0, fontSize: "1.1rem" }}>
                              Performance & Quality
                            </h4>
                            <ChevronDownIcon
                              style={{
                                width: "1rem",
                                height: "1rem",
                                transform: expandedPanels.has("performance")
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </div>
                          {expandedPanels.has("performance") && (
                            <div
                              className="panel-content"
                              style={{ padding: "1rem 0" }}
                            >
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Maximum FPS:
                                  <input
                                    type="number"
                                    min="0"
                                    max="240"
                                    value={maxFps}
                                    onChange={(e) =>
                                      setMaxFps(Number(e.target.value))
                                    }
                                    placeholder="0 (unlimited)"
                                    style={{
                                      backgroundColor: "#1e1e2e",
                                      color: "white",
                                      border: "1px solid #333",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      width: "100%",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginTop: "0.25rem",
                                      display: "block",
                                    }}
                                  >
                                    Limit the capture frame rate (0 = unlimited)
                                  </span>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Video Codec:
                                  <select
                                    value={videoCodec}
                                    onChange={(e) =>
                                      setVideoCodec(e.target.value)
                                    }
                                    style={{
                                      backgroundColor: "#1e1e2e",
                                      color: "white",
                                      border: "1px solid #333",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      width: "100%",
                                    }}
                                  >
                                    <option value="h264">
                                      H.264 (default)
                                    </option>
                                    <option value="h265">H.265 (HEVC)</option>
                                    <option value="av1">AV1</option>
                                  </select>
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginTop: "0.25rem",
                                      display: "block",
                                    }}
                                  >
                                    H.265 and AV1 may offer better quality at
                                    lower bitrates but require device support
                                  </span>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Video Encoder:
                                  <input
                                    type="text"
                                    value={videoEncoder}
                                    onChange={(e) =>
                                      setVideoEncoder(e.target.value)
                                    }
                                    placeholder="Default (auto-select)"
                                    style={{
                                      backgroundColor: "#1e1e2e",
                                      color: "white",
                                      border: "1px solid #333",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      width: "100%",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginTop: "0.25rem",
                                      display: "block",
                                    }}
                                  >
                                    Specific encoder name (e.g.
                                    OMX.qcom.video.encoder.avc). Leave empty for
                                    auto
                                  </span>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Video Buffer (ms):
                                  <input
                                    type="number"
                                    min="0"
                                    value={videoBuffer}
                                    onChange={(e) =>
                                      setVideoBuffer(Number(e.target.value))
                                    }
                                    placeholder="0 (disabled)"
                                    style={{
                                      backgroundColor: "#1e1e2e",
                                      color: "white",
                                      border: "1px solid #333",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      width: "100%",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginTop: "0.25rem",
                                      display: "block",
                                    }}
                                  >
                                    Add a buffering delay for video (in
                                    milliseconds) to reduce jitter
                                  </span>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="checkbox-label"
                                  style={{
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={powerOffOnClose}
                                    onChange={(e) =>
                                      setPowerOffOnClose(e.target.checked)
                                    }
                                    style={{ marginRight: "0.5rem" }}
                                  />
                                  Power Off on Close
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginLeft: "0.5rem",
                                    }}
                                  >
                                    — turn device screen off when scrcpy closes
                                  </span>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="checkbox-label"
                                  style={{
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={noPowerOn}
                                    onChange={(e) =>
                                      setNoPowerOn(e.target.checked)
                                    }
                                    style={{ marginRight: "0.5rem" }}
                                  />
                                  Don't Power On
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginLeft: "0.5rem",
                                    }}
                                  >
                                    — don't wake the device when starting scrcpy
                                  </span>
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                        <div
                          className="settings-panel"
                          style={{ marginBottom: "1rem" }}
                        >
                          <div
                            className="panel-header"
                            onClick={() => togglePanel("network")}
                            style={{
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "1rem 0",
                              borderBottom: "1px solid #333",
                            }}
                          >
                            <h4 style={{ margin: 0, fontSize: "1.1rem" }}>
                              Network & Connection
                            </h4>
                            <ChevronDownIcon
                              style={{
                                width: "1rem",
                                height: "1rem",
                                transform: expandedPanels.has("network")
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </div>
                          {expandedPanels.has("network") && (
                            <div
                              className="panel-content"
                              style={{ padding: "1rem 0" }}
                            >
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Audio Codec:
                                  <select
                                    value={audioCodec}
                                    onChange={(e) =>
                                      setAudioCodec(e.target.value)
                                    }
                                    style={{
                                      backgroundColor: "#1e1e2e",
                                      color: "white",
                                      border: "1px solid #333",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      width: "100%",
                                    }}
                                  >
                                    <option value="opus">Opus (default)</option>
                                    <option value="aac">AAC</option>
                                    <option value="flac">FLAC</option>
                                    <option value="raw">Raw</option>
                                  </select>
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginTop: "0.25rem",
                                      display: "block",
                                    }}
                                  >
                                    Select the audio codec for streaming (Opus
                                    is recommended for low latency)
                                  </span>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="input-label"
                                  style={{
                                    color: "white",
                                    display: "block",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  Time Limit (seconds):
                                  <input
                                    type="number"
                                    min="0"
                                    value={timeLimit}
                                    onChange={(e) =>
                                      setTimeLimit(Number(e.target.value))
                                    }
                                    placeholder="0 (no limit)"
                                    style={{
                                      backgroundColor: "#1e1e2e",
                                      color: "white",
                                      border: "1px solid #333",
                                      padding: "0.5rem",
                                      borderRadius: "4px",
                                      width: "100%",
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginTop: "0.25rem",
                                      display: "block",
                                    }}
                                  >
                                    Automatically stop mirroring after the given
                                    number of seconds (0 = no limit)
                                  </span>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="checkbox-label"
                                  style={{
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={forceAdbForward}
                                    onChange={(e) =>
                                      setForceAdbForward(e.target.checked)
                                    }
                                    style={{ marginRight: "0.5rem" }}
                                  />
                                  Force ADB Forward
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginLeft: "0.5rem",
                                    }}
                                  >
                                    — use "adb forward" instead of "adb reverse"
                                    for connection
                                  </span>
                                </label>
                              </div>
                              <div
                                className="row"
                                style={{ marginBottom: "1rem" }}
                              >
                                <label
                                  className="checkbox-label"
                                  style={{
                                    color: "white",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={noCleanup}
                                    onChange={(e) =>
                                      setNoCleanup(e.target.checked)
                                    }
                                    style={{ marginRight: "0.5rem" }}
                                  />
                                  No Cleanup
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#888",
                                      marginLeft: "0.5rem",
                                    }}
                                  >
                                    — don't restore device state on disconnect
                                    (useful for reconnection)
                                  </span>
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                        <div
                          className="generated-command"
                          style={{
                            marginTop: "2rem",
                            padding: "1rem",
                            backgroundColor: "#1e1e2e",
                            borderRadius: "4px",
                            fontFamily: "monospace",
                            color: "white",
                            fontSize: "0.9rem",
                          }}
                        >
                          <strong>Generated Command:</strong>
                          <br />
                          {generatedCommand}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
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
            <span className="sidebar-version">v0.3.0</span>
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
