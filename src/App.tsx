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

type Tab = "devices" | "presets" | "logs" | "settings";
type Theme = "light" | "dark" | "system";
type FontSize = "small" | "medium" | "large";

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
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState<Tab>("devices");

  // Settings state
  const [theme, setTheme] = useState<Theme>("system");
  const [colorScheme, setColorScheme] = useState<ColorScheme>(colorSchemes[0]);
  const [fontSize, setFontSize] = useState<FontSize>("medium");

  const hasMissingDeps =
    dependencies && (!dependencies.adb || !dependencies.scrcpy);

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
    const savedFontSize =
      (localStorage.getItem("scrcpy-fontSize") as FontSize) || "medium";

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
    newFontSize: FontSize,
  ) => {
    const root = document.documentElement;

    // Apply theme
    const isDark =
      newTheme === "dark" ||
      (newTheme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark-theme", isDark);

    // Apply color scheme (only primary colors)
    root.style.setProperty("--primary-color", newColorScheme.primary);
    root.style.setProperty("--primary-hover", newColorScheme.primaryHover);

    // Apply font size
    const fontSizes = { small: "14px", medium: "16px", large: "18px" };
    root.style.setProperty("--font-size", fontSizes[newFontSize]);
  };

  const saveSettings = (
    newTheme: Theme,
    newColorScheme: ColorScheme,
    newFontSize: FontSize,
  ) => {
    localStorage.setItem("scrcpy-theme", newTheme);
    localStorage.setItem("scrcpy-colorScheme", newColorScheme.name);
    localStorage.setItem("scrcpy-fontSize", newFontSize);
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

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  async function checkDependencies() {
    try {
      const deps: Dependencies = await invoke("check_dependencies");
      setDependencies(deps);
      addLog(`Dependencies checked: ADB=${deps.adb}, Scrcpy=${deps.scrcpy}`);
    } catch (e) {
      console.error("Failed to check dependencies:", e);
      addLog(`Failed to check dependencies: ${e}`);
    }
  }

  async function listDevices() {
    try {
      const devs: Device[] = await invoke("list_devices");
      setDevices(devs);
      if (devs.length > 0 && !selectedDevice) {
        setSelectedDevice(devs[0].serial);
      }
      addLog(`Devices listed: ${devs.length} found`);
    } catch (e) {
      console.error("Failed to list devices:", e);
      addLog(`Failed to list devices: ${e}`);
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
      });
      addLog(`Scrcpy started successfully`);
    } catch (e) {
      console.error("Failed to start scrcpy:", e);
      addLog(`Failed to start scrcpy: ${e}`);
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
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="select"
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
                  <div key={index} className="log-entry">
                    {log}
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
                <label className="radio-label">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={theme === "light"}
                    onChange={(e) => {
                      const newTheme = e.target.value as Theme;
                      setTheme(newTheme);
                      saveSettings(newTheme, colorScheme, fontSize);
                    }}
                  />
                  Light
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={theme === "dark"}
                    onChange={(e) => {
                      const newTheme = e.target.value as Theme;
                      setTheme(newTheme);
                      saveSettings(newTheme, colorScheme, fontSize);
                    }}
                  />
                  Dark
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="theme"
                    value="system"
                    checked={theme === "system"}
                    onChange={(e) => {
                      const newTheme = e.target.value as Theme;
                      setTheme(newTheme);
                      saveSettings(newTheme, colorScheme, fontSize);
                    }}
                  />
                  System
                </label>
              </div>
            </section>

            <section className="section">
              <h2>Color Scheme</h2>
              <div className="color-schemes">
                {colorSchemes.map((scheme) => (
                  <button
                    key={scheme.name}
                    className={`color-scheme-btn ${colorScheme.name === scheme.name ? "active" : ""}`}
                    onClick={() => {
                      setColorScheme(scheme);
                      saveSettings(theme, scheme, fontSize);
                    }}
                    title={scheme.name}
                  >
                    <div
                      className="color-swatch"
                      style={{ backgroundColor: scheme.primary }}
                    ></div>
                    <span className="color-name">{scheme.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="section">
              <h2>Font Size</h2>
              <div className="row">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="fontSize"
                    value="small"
                    checked={fontSize === "small"}
                    onChange={(e) => {
                      const newFontSize = e.target.value as FontSize;
                      setFontSize(newFontSize);
                      saveSettings(theme, colorScheme, newFontSize);
                    }}
                  />
                  Small
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="fontSize"
                    value="medium"
                    checked={fontSize === "medium"}
                    onChange={(e) => {
                      const newFontSize = e.target.value as FontSize;
                      setFontSize(newFontSize);
                      saveSettings(theme, colorScheme, newFontSize);
                    }}
                  />
                  Medium
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="fontSize"
                    value="large"
                    checked={fontSize === "large"}
                    onChange={(e) => {
                      const newFontSize = e.target.value as FontSize;
                      setFontSize(newFontSize);
                      saveSettings(theme, colorScheme, newFontSize);
                    }}
                  />
                  Large
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
          <h2>Scrcpy GUI</h2>
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
      </aside>
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

export default App;
