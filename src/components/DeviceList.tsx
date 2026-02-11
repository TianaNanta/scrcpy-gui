import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  Bars3Icon,
  ComputerDesktopIcon,
  WifiIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { Device, Dependencies } from "../types/device";
import type { LogEntry } from "../types/settings";

interface DeviceListProps {
  devices: Device[];
  dependencies: Dependencies | null;
  activeDevices: string[];
  deviceNames: Map<string, string>;
  loading: boolean;
  wirelessConnecting: boolean;
  deviceSearch: string;
  deviceFilter: "all" | "usb" | "wireless";
  logs: LogEntry[];
  onSearchChange: (value: string) => void;
  onFilterChange: (filter: "all" | "usb" | "wireless") => void;
  onRefreshDevices: () => void;
  onStartScrcpy: (serial?: string) => void;
  onStopScrcpy: (serial: string) => void;
  onDisconnectWireless: (serial: string) => void;
  onOpenDeviceSettings: (serial: string) => void;
  onOpenPairModal: () => void;
}

export default function DeviceList({
  devices,
  dependencies,
  activeDevices,
  deviceNames,
  loading,
  wirelessConnecting,
  deviceSearch,
  deviceFilter,
  logs,
  onSearchChange,
  onFilterChange,
  onRefreshDevices,
  onStartScrcpy,
  onStopScrcpy,
  onDisconnectWireless,
  onOpenDeviceSettings,
  onOpenPairModal,
}: DeviceListProps) {
  const hasMissingDeps = dependencies && (!dependencies.adb || !dependencies.scrcpy);

  return (
    <div className="tab-content">
      {hasMissingDeps && (
        <div className="alert alert-error">
          <ExclamationTriangleIcon className="alert-icon" />
          <div>
            {!dependencies.adb && <p>ADB not found. Please install Android Debug Bridge.</p>}
            {!dependencies.scrcpy && <p>Scrcpy not found. Please install scrcpy.</p>}
          </div>
        </div>
      )}

      <header className="devices-header">
        <div className="devices-title-section">
          <h2>Connected Devices</h2>
          <p className="devices-subtitle">Manage and mirror your Android endpoints</p>
        </div>
        <div className="devices-actions">
          <button className="btn btn-secondary" onClick={onRefreshDevices}>
            <ArrowPathIcon className="btn-icon" />
            Refresh List
          </button>
          <button className="btn btn-primary" onClick={() => onStartScrcpy()}>
            Quick Start
          </button>
        </div>
      </header>

      <div className="devices-controls">
        <input
          type="text"
          placeholder="Search devices by serial or model..."
          value={deviceSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input"
        />
        <div className="device-filters">
          {([
            { key: "all" as const, label: "All", icon: Bars3Icon, count: devices.length },
            { key: "usb" as const, label: "USB", icon: ComputerDesktopIcon, count: devices.filter((d) => !d.is_wireless).length },
            { key: "wireless" as const, label: "Wireless", icon: WifiIcon, count: devices.filter((d) => d.is_wireless).length },
          ] as const).map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              className={`btn device-filter-btn ${deviceFilter === key ? "active" : ""}`}
              onClick={() => onFilterChange(key)}
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
                d.serial.toLowerCase().includes(deviceSearch.toLowerCase()) ||
                (d.model && d.model.toLowerCase().includes(deviceSearch.toLowerCase()));
              const matchesFilter =
                deviceFilter === "all" ||
                (deviceFilter === "usb" && !d.is_wireless) ||
                (deviceFilter === "wireless" && d.is_wireless);
              return matchesSearch && matchesFilter;
            })
            .map((d) => (
              <div
                key={d.serial}
                className={`device-card ${d.status === "device" ? "online" : "offline"}`}
                onDoubleClick={() => onOpenDeviceSettings(d.serial)}
              >
                <div className="device-header">
                  <div className="device-serial">{deviceNames.get(d.serial) || d.serial}</div>
                  <div className="device-status">
                    <span className={`status-dot ${d.status === "device" ? "online" : "offline"}`} />
                    {d.status}
                    {d.is_wireless && <WifiIcon className="wireless-icon" />}
                  </div>
                </div>
                <div className="device-info">
                  {d.model && <div>Model: {d.model}</div>}
                  {d.android_version && <div>Android: {d.android_version}</div>}
                  {d.battery_level !== undefined && <div>Battery: {d.battery_level}%</div>}
                </div>
                <div className="device-actions">
                  {d.is_wireless && (
                    <button
                      className="btn btn-icon-only btn-delete"
                      onClick={() => onDisconnectWireless(d.serial)}
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
                        onClick={() => onStopScrcpy(d.serial)}
                        disabled={!dependencies?.adb || !dependencies?.scrcpy || d.status !== "device"}
                      >
                        Stop
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => onStartScrcpy(d.serial)}
                        disabled={loading || !dependencies?.adb || !dependencies?.scrcpy || d.status !== "device"}
                      >
                        Mirror
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          <div
            className="device-card pair-new-device"
            style={{ border: "2px dashed var(--border-color)" }}
            onClick={onOpenPairModal}
          >
            <div className="device-header">
              <div className="device-serial" style={{ display: "flex", alignItems: "center" }}>
                <PlusIcon style={{ width: "1.5rem", height: "1.5rem", marginRight: "0.5rem" }} />
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
              <div key={index} className={`log-entry log-${log.level.toLowerCase()}`}>
                <span className="log-timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="log-level">{log.level}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
