import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  DevicePhoneMobileIcon,
  PlayIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
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

  const hasMissingDeps =
    dependencies && (!dependencies.adb || !dependencies.scrcpy);

  useEffect(() => {
    checkDependencies();
    listDevices();
  }, []);

  async function checkDependencies() {
    try {
      const deps: Dependencies = await invoke("check_dependencies");
      setDependencies(deps);
    } catch (e) {
      console.error("Failed to check dependencies:", e);
    }
  }

  async function listDevices() {
    try {
      const devs: Device[] = await invoke("list_devices");
      setDevices(devs);
      if (devs.length > 0 && !selectedDevice) {
        setSelectedDevice(devs[0].serial);
      }
    } catch (e) {
      console.error("Failed to list devices:", e);
    }
  }

  async function startScrcpy() {
    if (!selectedDevice) return;
    setLoading(true);
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
    } catch (e) {
      console.error("Failed to start scrcpy:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <header className="header">
        <DevicePhoneMobileIcon className="header-icon" />
        <h1>Scrcpy GUI</h1>
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
    </main>
  );
}

export default App;
