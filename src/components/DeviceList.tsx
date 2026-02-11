import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  Bars3Icon,
  ComputerDesktopIcon,
  WifiIcon,
  TrashIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import type { Device, Dependencies } from "../types/device";
import type { LogEntry } from "../types/settings";

interface DeviceListProps {
  devices: Device[];
  dependencies: Dependencies | null;
  activeDevices: string[];
  deviceNames: Map<string, string>;
  loading: boolean;
  refreshing: boolean;
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
  onForgetDevice: (serial: string) => void;
}

export default function DeviceList({
  devices,
  dependencies,
  activeDevices,
  deviceNames,
  loading,
  refreshing,
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
  onForgetDevice,
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
          <button className="btn btn-secondary" onClick={onRefreshDevices} disabled={refreshing}>
            <ArrowPathIcon className={`btn-icon${refreshing ? " spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh List"}
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
          aria-label="Search devices"
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
              aria-pressed={deviceFilter === key}
            >
              <Icon className="btn-icon" />
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      <section className="section">
        {(() => {
          const filteredDevices = devices.filter((d) => {
            const matchesSearch =
              deviceSearch === "" ||
              d.serial.toLowerCase().includes(deviceSearch.toLowerCase()) ||
              (d.model && d.model.toLowerCase().includes(deviceSearch.toLowerCase()));
            const matchesFilter =
              deviceFilter === "all" ||
              (deviceFilter === "usb" && !d.is_wireless) ||
              (deviceFilter === "wireless" && d.is_wireless);
            return matchesSearch && matchesFilter;
          });

          if (loading && devices.length === 0) {
            return (
              <div className="devices-list fade-enter">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="device-card skeleton-card">
                    <div className="skeleton-line medium" />
                    <div className="skeleton-line short" />
                    <div className="skeleton-line long" />
                  </div>
                ))}
              </div>
            );
          }

          if (filteredDevices.length === 0 && devices.length === 0) {
            return (
              <div className="device-list-empty">
                <DevicePhoneMobileIcon />
                <h3>No devices connected</h3>
                <p>Connect a device via USB or pair wirelessly to get started</p>
                <button className="btn btn-primary" onClick={onOpenPairModal}>
                  <PlusIcon className="btn-icon" />
                  Pair New Device
                </button>
              </div>
            );
          }

          return (
            <div className="devices-list fade-enter">
              {filteredDevices.map((d) => {
              const isConnected = d.status === "device";
              const isDisconnected = d.status === "disconnected";
              const statusLabel = d.status === "device" ? "connected"
                : d.status === "disconnected" ? "disconnected"
                : d.status === "unauthorized" ? "unauthorized"
                : "offline";

              return (
              <div
                key={d.serial}
                className={`device-card ${isConnected ? "online" : "offline"}${isDisconnected ? " disconnected" : ""}`}
                onDoubleClick={() => onOpenDeviceSettings(d.serial)}
                tabIndex={0}
                role="button"
                aria-label={`Configure ${deviceNames.get(d.serial) || d.model || d.serial}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenDeviceSettings(d.serial);
                  }
                }}
              >
                <div className="device-header">
                  <div className="device-serial">{deviceNames.get(d.serial) || d.serial}</div>
                  <div className="device-status">
                    <span className={`status-dot ${isConnected ? "online" : "offline"}`} />
                    {statusLabel}
                    <span className={`connection-badge ${d.is_wireless ? "wireless" : "usb"}`}>
                      {d.is_wireless ? <WifiIcon /> : <ComputerDesktopIcon />}
                      {d.is_wireless ? "Wi-Fi" : "USB"}
                    </span>
                  </div>
                </div>
                <div className="device-info">
                  {d.model && <div>Model: {d.model}</div>}
                  {d.android_version && <div>Android: {d.android_version}</div>}
                  {d.battery_level != null && <div>Battery: {d.battery_level}%</div>}
                </div>
                <div className="device-actions">
                  {isDisconnected ? (
                    <button
                      className="btn btn-delete-text"
                      onClick={(e) => { e.stopPropagation(); onForgetDevice(d.serial); }}
                      title="Remove device from list"
                      aria-label={`Forget device ${deviceNames.get(d.serial) || d.serial}`}
                    >
                      <TrashIcon className="btn-icon" />
                      Forget
                    </button>
                  ) : (
                    <>
                      {d.is_wireless && (
                        <button
                          className="btn btn-icon-only btn-delete"
                          onClick={() => onDisconnectWireless(d.serial)}
                          disabled={wirelessConnecting}
                          title="Delete wireless connection"
                          aria-label={`Delete wireless connection for ${deviceNames.get(d.serial) || d.serial}`}
                        >
                          <TrashIcon className="btn-icon" />
                        </button>
                      )}
                    </>
                  )}
                  <div className="device-action-main">
                    {activeDevices.includes(d.serial) ? (
                      <button
                        className="btn btn-stop"
                        onClick={() => onStopScrcpy(d.serial)}
                        disabled={!dependencies?.adb || !dependencies?.scrcpy || !isConnected}
                      >
                        Stop
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => onStartScrcpy(d.serial)}
                        disabled={loading || !dependencies?.adb || !dependencies?.scrcpy || !isConnected}
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
            onClick={onOpenPairModal}
            tabIndex={0}
            role="button"
            aria-label="Pair new device"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenPairModal();
              }
            }}
          >
            <div className="device-header">
              <div className="device-serial pair-new-device-label">
                <PlusIcon className="pair-new-device-icon" />
                Pair New Device
              </div>
            </div>
            <div className="device-info">
              <div>Connect via USB or Wi-Fi</div>
            </div>
          </div>
        </div>
          );
        })()}
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
