import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { DeviceSettings } from "../../types/settings";

interface NetworkPanelProps {
  settings: DeviceSettings;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function NetworkPanel({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
}: NetworkPanelProps) {
  return (
    <div className="settings-panel" style={{ marginBottom: "1rem" }}>
      <button
        className="panel-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Network & Connection</h4>
        <ChevronDownIcon
          style={{
            width: "1rem",
            height: "1rem",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>
      {expanded && (
        <div className="panel-content" style={{ padding: "1rem 0" }}>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Audio Codec:
              <select
                value={settings.audioCodec}
                onChange={(e) => onSettingsChange({ audioCodec: e.target.value })}
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
              <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                Select the audio codec for streaming (Opus is recommended for low latency)
              </span>
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Time Limit (seconds):
              <input
                type="number"
                min="0"
                value={settings.timeLimit}
                onChange={(e) => onSettingsChange({ timeLimit: Number(e.target.value) })}
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
              <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                Automatically stop mirroring after the given number of seconds (0 = no limit)
              </span>
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="checkbox-label"
              style={{ color: "white", display: "flex", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={settings.forceAdbForward}
                onChange={(e) => onSettingsChange({ forceAdbForward: e.target.checked })}
                style={{ marginRight: "0.5rem" }}
              />
              Force ADB Forward
              <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "0.5rem" }}>
                — use "adb forward" instead of "adb reverse" for connection
              </span>
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="checkbox-label"
              style={{ color: "white", display: "flex", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={settings.noCleanup}
                onChange={(e) => onSettingsChange({ noCleanup: e.target.checked })}
                style={{ marginRight: "0.5rem" }}
              />
              No Cleanup
              <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "0.5rem" }}>
                — don't restore device state on disconnect (useful for reconnection)
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
