import type { DeviceSettings } from "../../types/settings";
import { ChevronDownIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface WirelessPanelProps {
  settings: DeviceSettings;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  expanded: boolean;
  onToggle: () => void;
  isWireless: boolean;
  currentSerial: string;
  onReconnect?: () => void;
}

export default function WirelessPanel({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
  isWireless,
  currentSerial,
  onReconnect,
}: WirelessPanelProps) {
  if (!isWireless) {
    return null;
  }

  // Parse current connection from serial
  const currentParts = currentSerial.split(":");
  const currentIp = currentParts.length === 2 ? currentParts[0] : "";
  const currentPort = currentParts.length === 2 ? parseInt(currentParts[1], 10) : 5555;

  // Check if values have changed
  const hasChanged = 
    (settings.ipAddress && settings.ipAddress.trim() !== currentIp) ||
    (settings.port && settings.port !== currentPort);

  return (
    <div className="settings-panel">
      <button
        className={`panel-header${expanded ? ' expanded' : ''}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4>Wireless Connection</h4>
        <ChevronDownIcon />
      </button>
      <div className={`panel-content${expanded ? ' expanded' : ''}`} aria-hidden={!expanded}>
        <div className="row">
          <label className="input-label">
            IP Address:
            <input
              type="text"
              placeholder="192.168.1.100"
              value={settings.ipAddress || ""}
              onChange={(e) => onSettingsChange({ ipAddress: e.target.value })}
            />
            <span className="hint">
              Current connection: {currentIp || "Unknown"}
            </span>
          </label>
        </div>
        <div className="row">
          <label className="input-label">
            Port:
            <input
              type="number"
              min="1"
              max="65535"
              value={settings.port || 5555}
              onChange={(e) => {
                const newPort = parseInt(e.target.value, 10);
                if (!isNaN(newPort)) {
                  onSettingsChange({ port: newPort });
                }
              }}
            />
            <span className="hint">
              Current connection: {currentPort}
            </span>
          </label>
        </div>
        {hasChanged && onReconnect && (
          <div className="row">
            <button className="btn btn-primary" onClick={onReconnect}>
              <ArrowPathIcon className="btn-icon" />
              Reconnect with New Address
            </button>
            <span className="hint" style={{ marginTop: '8px', display: 'block' }}>
              Click to disconnect from {currentIp}:{currentPort} and reconnect to {settings.ipAddress}:{settings.port}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
