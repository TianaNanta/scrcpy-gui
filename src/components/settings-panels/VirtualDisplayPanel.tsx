import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { DeviceSettings } from "../../types/settings";

interface VirtualDisplayPanelProps {
  settings: DeviceSettings;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  expanded: boolean;
  onToggle: () => void;
  /** Virtual display available (≥3.0) */
  canVirtualDisplay: boolean;
}

export default function VirtualDisplayPanel({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
  canVirtualDisplay,
}: VirtualDisplayPanelProps) {
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
        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Virtual Display</h4>
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
          {!canVirtualDisplay && (
            <div style={{ padding: "0.5rem", marginBottom: "1rem", backgroundColor: "#1e1e2e", borderRadius: "4px", border: "1px solid #555" }}>
              <span style={{ fontSize: "0.85rem", color: "#f59e0b" }}>
                Virtual display requires scrcpy ≥ 3.0
              </span>
            </div>
          )}
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="checkbox-label"
              style={{ color: "white", display: "flex", alignItems: "center", opacity: canVirtualDisplay ? 1 : 0.5 }}
            >
              <input
                type="checkbox"
                checked={settings.virtualDisplay}
                onChange={(e) => onSettingsChange({ virtualDisplay: e.target.checked })}
                disabled={!canVirtualDisplay}
                style={{ marginRight: "0.5rem" }}
              />
              Enable Virtual Display
              <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "0.5rem" }}>
                — Create a new virtual display on the device
              </span>
            </label>
          </div>

          {settings.virtualDisplay && canVirtualDisplay && (
            <>
              <div className="row" style={{ marginBottom: "1rem" }}>
                <label
                  className="input-label"
                  style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
                >
                  Resolution:
                  <input
                    type="text"
                    value={settings.virtualDisplayResolution}
                    onChange={(e) => onSettingsChange({ virtualDisplayResolution: e.target.value })}
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
                    Virtual display resolution (WxH). Leave empty for device default.
                  </span>
                </label>
              </div>
              <div className="row" style={{ marginBottom: "1rem" }}>
                <label
                  className="input-label"
                  style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
                >
                  DPI:
                  <input
                    type="number"
                    min="0"
                    value={settings.virtualDisplayDpi}
                    onChange={(e) => onSettingsChange({ virtualDisplayDpi: Number(e.target.value) })}
                    placeholder="0 (default)"
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
                    Virtual display density (0 = device default)
                  </span>
                </label>
              </div>
              <div className="row" style={{ marginBottom: "1rem" }}>
                <label
                  className="input-label"
                  style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
                >
                  Start App:
                  <input
                    type="text"
                    value={settings.startApp}
                    onChange={(e) => onSettingsChange({ startApp: e.target.value })}
                    placeholder="com.example.app"
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
                    Package name to launch on the virtual display (e.g. org.videolan.vlc)
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
