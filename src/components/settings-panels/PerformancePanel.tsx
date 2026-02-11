import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { DeviceSettings } from "../../types/settings";

interface PerformancePanelProps {
  settings: DeviceSettings;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function PerformancePanel({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
}: PerformancePanelProps) {
  return (
    <div className="settings-panel" style={{ marginBottom: "1rem" }}>
      <div
        className="panel-header"
        onClick={onToggle}
        style={{
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 0",
          borderBottom: "1px solid #333",
        }}
      >
        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Performance & Quality</h4>
        <ChevronDownIcon
          style={{
            width: "1rem",
            height: "1rem",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </div>
      {expanded && (
        <div className="panel-content" style={{ padding: "1rem 0" }}>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Maximum FPS:
              <input
                type="number"
                min="0"
                max="240"
                value={settings.maxFps}
                onChange={(e) => onSettingsChange({ maxFps: Number(e.target.value) })}
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
              <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                Limit the capture frame rate (0 = unlimited)
              </span>
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Video Codec:
              <select
                value={settings.videoCodec}
                onChange={(e) => onSettingsChange({ videoCodec: e.target.value })}
                style={{
                  backgroundColor: "#1e1e2e",
                  color: "white",
                  border: "1px solid #333",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  width: "100%",
                }}
              >
                <option value="h264">H.264 (default)</option>
                <option value="h265">H.265 (HEVC)</option>
                <option value="av1">AV1</option>
              </select>
              <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                H.265 and AV1 may offer better quality at lower bitrates but require device support
              </span>
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Video Encoder:
              <input
                type="text"
                value={settings.videoEncoder}
                onChange={(e) => onSettingsChange({ videoEncoder: e.target.value })}
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
              <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                Specific encoder name (e.g. OMX.qcom.video.encoder.avc). Leave empty for auto
              </span>
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Video Buffer (ms):
              <input
                type="number"
                min="0"
                value={settings.videoBuffer}
                onChange={(e) => onSettingsChange({ videoBuffer: Number(e.target.value) })}
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
              <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                Add a buffering delay for video (in milliseconds) to reduce jitter
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
                checked={settings.powerOffOnClose}
                onChange={(e) => onSettingsChange({ powerOffOnClose: e.target.checked })}
                style={{ marginRight: "0.5rem" }}
              />
              Power Off on Close
              <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "0.5rem" }}>
                — turn device screen off when scrcpy closes
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
                checked={settings.noPowerOn}
                onChange={(e) => onSettingsChange({ noPowerOn: e.target.checked })}
                style={{ marginRight: "0.5rem" }}
              />
              Don't Power On
              <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "0.5rem" }}>
                — don't wake the device when starting scrcpy
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
