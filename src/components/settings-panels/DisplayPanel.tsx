import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { DeviceSettings } from "../../types/settings";

interface DisplayPanelProps {
  settings: DeviceSettings;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function DisplayPanel({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
}: DisplayPanelProps) {
  const isCameraSource = settings.videoSource === "camera";
  const isVirtualDisplay = settings.virtualDisplay;
  const displayFieldsDisabled = isCameraSource || isVirtualDisplay;

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
        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Display & Quality</h4>
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
          {displayFieldsDisabled && (
            <div style={{ padding: "0.5rem", marginBottom: "1rem", backgroundColor: "#1e1e2e", borderRadius: "4px", border: "1px solid #555" }}>
              <span style={{ fontSize: "0.85rem", color: "#f59e0b" }}>
                {isCameraSource
                  ? "Display ID, crop, and rotation are not available in camera mode."
                  : "Display ID is not available when virtual display is enabled."}
              </span>
            </div>
          )}
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Resolution Limit:
              <select
                value={settings.maxSize}
                onChange={(e) => onSettingsChange({ maxSize: Number(e.target.value) })}
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
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Bitrate (bps):
              <input
                type="number"
                value={settings.bitrate}
                onChange={(e) => onSettingsChange({ bitrate: Number(e.target.value) })}
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
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Orientation:
              <select
                value={settings.rotation.toString()}
                onChange={(e) => onSettingsChange({ rotation: Number(e.target.value) })}
                disabled={isCameraSource}
                style={{
                  backgroundColor: "#1e1e2e",
                  color: "white",
                  border: "1px solid #333",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  width: "100%",
                  opacity: isCameraSource ? 0.5 : 1,
                }}
              >
                <option value="0">0°</option>
                <option value="90">90°</option>
                <option value="180">180°</option>
                <option value="270">270°</option>
              </select>
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Lock Video Orientation:
              <select
                value={settings.lockVideoOrientation.toString()}
                onChange={(e) =>
                  onSettingsChange({ lockVideoOrientation: Number(e.target.value) })
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
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Display ID:
              <input
                type="number"
                min="0"
                value={settings.displayId}
                onChange={(e) => onSettingsChange({ displayId: Number(e.target.value) })}
                disabled={displayFieldsDisabled}
                placeholder="0 (default)"
                style={{
                  backgroundColor: "#1e1e2e",
                  color: "white",
                  border: "1px solid #333",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  width: "100%",
                  opacity: displayFieldsDisabled ? 0.5 : 1,
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                Select display for multi-display devices (0 = main display)
              </span>
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Screen Crop:
              <input
                type="text"
                value={settings.crop}
                onChange={(e) => onSettingsChange({ crop: e.target.value })}
                disabled={isCameraSource}
                placeholder="width:height:x:y (e.g. 1080:1920:0:0)"
                style={{
                  backgroundColor: "#1e1e2e",
                  color: "white",
                  border: "1px solid #333",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  width: "100%",
                  opacity: isCameraSource ? 0.5 : 1,
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                Crop format: width:height:x:y (leave empty for no crop)
              </span>
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Display Buffer (ms):
              <input
                type="number"
                min="0"
                value={settings.displayBuffer}
                onChange={(e) => onSettingsChange({ displayBuffer: Number(e.target.value) })}
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
                Add a buffering delay (in milliseconds) to reduce jitter (0 = disabled)
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
