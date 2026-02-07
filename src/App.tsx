import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  DevicePhoneMobileIcon,
  PlayIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  Bars3Icon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  CheckCircleIcon,
  XCircleIcon,
  WifiIcon,
} from "@heroicons/react/24/outline";
import "./App.css";

interface Device {
  serial: string;
  status: string;
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
}

interface ColorScheme {
  name: string;
  primary: string;
  primaryHover: string;
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
  const [wirelessMode, setWirelessMode] = useState(false);
  const [deviceIp, setDeviceIp] = useState("");
  const [devicePort, setDevicePort] = useState(5555);
  const [wirelessConnecting, setWirelessConnecting] = useState(false);
  const [wirelessConnected, setWirelessConnected] = useState(false);

  const hasMissingDeps =
    dependencies && (!dependencies.adb || !dependencies.scrcpy);

  const toggleRecording = () => {
    if (recordingEnabled && recordFile) {
      // If disabling recording, clear the file path
      setRecordFile("");
    }
    setRecordingEnabled(!recordingEnabled);
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

      setWirelessConnected(true);
      addLog(
        `Successfully connected to wireless device at ${deviceIp}:${devicePort}`,
        "SUCCESS",
      );
      // Refresh device list to show the wireless device
      listDevices();
    } catch (error) {
      addLog(`Failed to connect to wireless device: ${error}`, "ERROR");
      setWirelessConnected(false);
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

  async function startScrcpy() {
    if (!selectedDevice) return;
    setLoading(true);
    addLog(`Starting scrcpy for device: ${selectedDevice}`);
    try {
      await invoke("start_scrcpy", {
        serial: selectedDevice,
        bitrate: bitrate > 0 ? bitrate : undefined,
        maxSize: maxSize > 0 ? maxSize : undefined,
        noControl,
        turnScreenOff,
        stayAwake,
        showTouches,
        record: recordingEnabled,
        recordFile: recordingEnabled ? recordFile : undefined,
        audioForwarding: audioForwarding,
        audioBitrate: audioForwarding ? audioBitrate : undefined,
        microphoneForwarding: microphoneForwarding,
      });
      addLog(
        `Scrcpy started successfully${recordingEnabled ? " (recording enabled)" : ""}`,
        "SUCCESS",
      );
    } catch (e) {
      console.error("Failed to start scrcpy:", e);
      addLog(`Failed to start scrcpy: ${e}`, "ERROR");
    } finally {
      setLoading(false);
    }
  }

  const renderContent = () => {
    switch (currentTab) {
      case "devices":
        return (
          <div className="tab-content">
            <header className="header">
              <DevicePhoneMobileIcon className="header-icon" />
              <h1>Devices</h1>
            </header>

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

            <section className="section">
              <h2>Device Selection</h2>
              <div className="row">
                <button className="btn btn-secondary" onClick={listDevices}>
                  <ArrowPathIcon className="btn-icon" />
                  Refresh Devices
                </button>
                <div className="select-wrapper">
                  <select
                    key={`device-select-${theme}`}
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="select"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--text-primary)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <option value="">Select a device</option>
                    {devices.map((d) => (
                      <option key={d.serial} value={d.serial}>
                        {d.serial} ({d.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="section">
              <h2>
                <WifiIcon className="section-icon" />
                Wireless Connection
              </h2>
              <div className="row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={wirelessMode}
                    onChange={(e) => setWirelessMode(e.target.checked)}
                  />
                  Enable Wireless Mode
                </label>
              </div>
              {wirelessMode && (
                <>
                  <div className="row">
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
                        onChange={(e) => setDevicePort(Number(e.target.value))}
                        className="input"
                        style={{ width: "120px" }}
                      />
                    </label>
                  </div>
                  <div className="row">
                    <button
                      className="btn btn-secondary"
                      onClick={setupWirelessConnection}
                      disabled={wirelessConnecting}
                    >
                      {wirelessConnecting
                        ? "Connecting..."
                        : "Connect Wireless"}
                    </button>
                    <div className="connection-status">
                      <span
                        className={`status-indicator ${wirelessConnected ? "connected" : "disconnected"}`}
                      >
                        {wirelessConnected ? "●" : "○"}
                      </span>
                      <span className="status-text">
                        {wirelessConnected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </section>

            <section className="section">
              <h2>
                <VideoCameraIcon className="section-icon" />
                Recording
              </h2>
              <div className="row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={recordingEnabled}
                    onChange={() => toggleRecording()}
                  />
                  Enable Recording
                </label>
              </div>
              {recordingEnabled && (
                <div className="row">
                  <div className="select-wrapper">
                    <select
                      value={recordFormat}
                      onChange={(e) =>
                        setRecordFormat(e.target.value as "mp4" | "mkv")
                      }
                      className="select"
                      style={{
                        backgroundColor: "var(--input-bg)",
                        color: "var(--text-primary)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      <option value="mp4">MP4</option>
                      <option value="mkv">MKV</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={recordFile}
                    readOnly
                    placeholder="Select save location..."
                    className="input"
                    style={{ flex: 1, marginLeft: "1rem" }}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={selectSaveFile}
                    style={{ marginLeft: "0.5rem" }}
                  >
                    Browse
                  </button>
                </div>
              )}
            </section>

            <section className="section">
              <h2>
                <MusicalNoteIcon className="section-icon" />
                Audio
              </h2>
              <div className="row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={audioForwarding}
                    onChange={(e) => setAudioForwarding(e.target.checked)}
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
                      min="32"
                      max="512"
                      step="32"
                      value={audioBitrate}
                      onChange={(e) => setAudioBitrate(Number(e.target.value))}
                      className="input"
                      style={{ width: "120px" }}
                    />
                  </label>
                </div>
              )}
              <div className="row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={microphoneForwarding}
                    onChange={(e) => setMicrophoneForwarding(e.target.checked)}
                  />
                  Microphone Forwarding
                </label>
              </div>
            </section>

            <section className="section">
              <h2>Dependencies</h2>
              <div className="dependency-status-large">
                <div className="dependency-item-large">
                  <span className="dependency-icon">
                    {dependencies?.adb ? (
                      <CheckCircleIcon className="status-icon ready" />
                    ) : (
                      <XCircleIcon className="status-icon not-ready" />
                    )}
                  </span>
                  <div className="dependency-info">
                    <span className="dependency-name">ADB</span>
                    <span className="dependency-desc">
                      Android Debug Bridge
                    </span>
                  </div>
                </div>
                <div className="dependency-item-large">
                  <span className="dependency-icon">
                    {dependencies?.scrcpy ? (
                      <CheckCircleIcon className="status-icon ready" />
                    ) : (
                      <XCircleIcon className="status-icon not-ready" />
                    )}
                  </span>
                  <div className="dependency-info">
                    <span className="dependency-name">Scrcpy</span>
                    <span className="dependency-desc">
                      Screen mirroring tool
                    </span>
                  </div>
                </div>
              </div>
              <div className="actions">
                <button
                  className="btn btn-secondary"
                  onClick={checkDependencies}
                >
                  <ArrowPathIcon className="btn-icon" />
                  Check Dependencies
                </button>
              </div>
            </section>

            <section className="section">
              <h2>
                <Cog6ToothIcon className="section-icon" />
                Options
              </h2>
              <div className="options-grid">
                <div className="option-group">
                  <label className="input-label">
                    Bitrate (bps):
                    <input
                      type="number"
                      value={bitrate}
                      onChange={(e) => setBitrate(Number(e.target.value))}
                      min="0"
                      className="input"
                    />
                  </label>
                  <label className="input-label">
                    Max Size (px):
                    <input
                      type="number"
                      value={maxSize}
                      onChange={(e) => setMaxSize(Number(e.target.value))}
                      min="0"
                      className="input"
                    />
                  </label>
                </div>
                <div className="option-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={noControl}
                      onChange={(e) => setNoControl(e.target.checked)}
                    />
                    No Control
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={turnScreenOff}
                      onChange={(e) => setTurnScreenOff(e.target.checked)}
                    />
                    Turn Screen Off
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={stayAwake}
                      onChange={(e) => setStayAwake(e.target.checked)}
                    />
                    Stay Awake
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={showTouches}
                      onChange={(e) => setShowTouches(e.target.checked)}
                    />
                    Show Touches
                  </label>
                </div>
              </div>
            </section>

            <div className="actions">
              <button
                className="btn btn-primary"
                onClick={startScrcpy}
                disabled={
                  loading ||
                  !selectedDevice ||
                  !dependencies?.adb ||
                  !dependencies?.scrcpy
                }
              >
                <PlayIcon className="btn-icon" />
                {loading ? "Starting..." : "Start Scrcpy"}
              </button>
            </div>
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
