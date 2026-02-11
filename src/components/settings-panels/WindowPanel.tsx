import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { DeviceSettings } from "../../types/settings";

interface WindowPanelProps {
  settings: DeviceSettings;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function WindowPanel({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
}: WindowPanelProps) {
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
        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Window Management</h4>
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
              Window Position:
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="number"
                  min="0"
                  value={settings.windowX}
                  onChange={(e) => onSettingsChange({ windowX: Number(e.target.value) })}
                  placeholder="X"
                  style={{
                    backgroundColor: "#1e1e2e",
                    color: "white",
                    border: "1px solid #333",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    flex: 1,
                  }}
                />
                <input
                  type="number"
                  min="0"
                  value={settings.windowY}
                  onChange={(e) => onSettingsChange({ windowY: Number(e.target.value) })}
                  placeholder="Y"
                  style={{
                    backgroundColor: "#1e1e2e",
                    color: "white",
                    border: "1px solid #333",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    flex: 1,
                  }}
                />
              </div>
              <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                X and Y coordinates (0 = default position)
              </span>
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Window Size:
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="number"
                  min="0"
                  value={settings.windowWidth}
                  onChange={(e) => onSettingsChange({ windowWidth: Number(e.target.value) })}
                  placeholder="Width"
                  style={{
                    backgroundColor: "#1e1e2e",
                    color: "white",
                    border: "1px solid #333",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    flex: 1,
                  }}
                />
                <input
                  type="number"
                  min="0"
                  value={settings.windowHeight}
                  onChange={(e) => onSettingsChange({ windowHeight: Number(e.target.value) })}
                  placeholder="Height"
                  style={{
                    backgroundColor: "#1e1e2e",
                    color: "white",
                    border: "1px solid #333",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    flex: 1,
                  }}
                />
              </div>
              <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                Width and Height in pixels (0 = auto)
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
                checked={settings.alwaysOnTop}
                onChange={(e) => onSettingsChange({ alwaysOnTop: e.target.checked })}
                style={{ marginRight: "0.5rem" }}
              />
              Always on Top
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="checkbox-label"
              style={{ color: "white", display: "flex", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={settings.windowBorderless}
                onChange={(e) => onSettingsChange({ windowBorderless: e.target.checked })}
                style={{ marginRight: "0.5rem" }}
              />
              Borderless Window
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Window Title:
              <input
                type="text"
                value={settings.windowTitle}
                onChange={(e) => onSettingsChange({ windowTitle: e.target.value })}
                placeholder="Default (device model)"
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
                Custom window title (leave empty for default)
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
                checked={settings.fullscreen}
                onChange={(e) => onSettingsChange({ fullscreen: e.target.checked })}
                style={{ marginRight: "0.5rem" }}
              />
              Fullscreen Mode
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
