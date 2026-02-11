import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { DeviceSettings } from "../../types/settings";

interface VideoSourcePanelProps {
  settings: DeviceSettings;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  expanded: boolean;
  onToggle: () => void;
  /** Camera mirroring available (≥2.2) */
  canCamera: boolean;
}

export default function VideoSourcePanel({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
  canCamera,
}: VideoSourcePanelProps) {
  const isCamera = settings.videoSource === "camera";

  return (
    <div className="settings-panel" style={{ marginBottom: "1rem" }}>
      <button
        className="panel-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Video Source</h4>
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
          {!canCamera && (
            <div style={{ padding: "0.5rem", marginBottom: "1rem", backgroundColor: "#1e1e2e", borderRadius: "4px", border: "1px solid #555" }}>
              <span style={{ fontSize: "0.85rem", color: "#f59e0b" }}>
                Camera mirroring requires scrcpy ≥ 2.2 and Android 12+
              </span>
            </div>
          )}
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Video Source:
              <select
                value={settings.videoSource}
                onChange={(e) => {
                  const val = e.target.value as DeviceSettings["videoSource"];
                  onSettingsChange({
                    videoSource: val,
                    // Reset camera fields when switching back to display
                    ...(val === "display" ? { cameraFacing: "front", cameraSize: "", cameraId: "" } : {}),
                  });
                }}
                style={{
                  backgroundColor: "#1e1e2e",
                  color: "white",
                  border: "1px solid #333",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  width: "100%",
                }}
              >
                <option value="display">Display (screen mirroring)</option>
                {canCamera && <option value="camera">Camera</option>}
              </select>
            </label>
          </div>

          {isCamera && canCamera && (
            <>
              <div className="row" style={{ marginBottom: "1rem" }}>
                <label
                  className="input-label"
                  style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
                >
                  Camera Facing:
                  <select
                    value={settings.cameraFacing}
                    onChange={(e) =>
                      onSettingsChange({ cameraFacing: e.target.value as DeviceSettings["cameraFacing"] })
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
                    <option value="front">Front</option>
                    <option value="back">Back</option>
                    <option value="external">External</option>
                  </select>
                </label>
              </div>
              <div className="row" style={{ marginBottom: "1rem" }}>
                <label
                  className="input-label"
                  style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
                >
                  Camera Size:
                  <input
                    type="text"
                    value={settings.cameraSize}
                    onChange={(e) => onSettingsChange({ cameraSize: e.target.value })}
                    placeholder="1920x1080"
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
                    Camera resolution (WxH). Leave empty for default.
                  </span>
                </label>
              </div>
              <div className="row" style={{ marginBottom: "1rem" }}>
                <label
                  className="input-label"
                  style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
                >
                  Camera ID:
                  <input
                    type="text"
                    value={settings.cameraId}
                    onChange={(e) => onSettingsChange({ cameraId: e.target.value })}
                    placeholder="Auto (leave empty)"
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
                    Specific camera ID if the device has multiple cameras of the same facing direction.
                  </span>
                </label>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
