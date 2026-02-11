import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { DeviceSettings } from "../../types/settings";

interface BehaviorPanelProps {
  settings: DeviceSettings;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function BehaviorPanel({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
}: BehaviorPanelProps) {
  return (
    <div className="settings-panel" style={{ marginBottom: "1rem" }}>
      <button
        className="panel-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Behavior</h4>
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
              className="checkbox-label"
              style={{ color: "white", display: "flex", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={settings.stayAwake}
                onChange={(e) => onSettingsChange({ stayAwake: e.target.checked })}
                style={{ marginRight: "0.5rem" }}
              />
              Stay Awake
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="checkbox-label"
              style={{ color: "white", display: "flex", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={settings.showTouches}
                onChange={(e) => onSettingsChange({ showTouches: e.target.checked })}
                style={{ marginRight: "0.5rem" }}
              />
              Show Touches
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="checkbox-label"
              style={{ color: "white", display: "flex", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={settings.turnScreenOff}
                onChange={(e) => onSettingsChange({ turnScreenOff: e.target.checked })}
                style={{ marginRight: "0.5rem" }}
              />
              Turn Screen Off
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="checkbox-label"
              style={{ color: "white", display: "flex", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={settings.noControl}
                onChange={(e) => onSettingsChange({ noControl: e.target.checked })}
                style={{ marginRight: "0.5rem" }}
              />
              Read-only Mode
            </label>
          </div>
          <hr style={{ borderColor: "#333", margin: "1rem 0" }} />
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="checkbox-label"
              style={{ color: "white", display: "flex", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={settings.otgMode}
                onChange={(e) => onSettingsChange({ otgMode: e.target.checked })}
                style={{ marginRight: "0.5rem" }}
              />
              OTG Mode
              <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "0.5rem" }}>
                — Physical keyboard/mouse via USB (no mirroring)
              </span>
            </label>
            {settings.otgMode && (
              <div style={{ padding: "0.5rem", marginTop: "0.5rem", backgroundColor: "#1e1e2e", borderRadius: "4px", border: "1px solid #555" }}>
                <span style={{ fontSize: "0.85rem", color: "#f59e0b" }}>
                  OTG mode requires a USB connection. Video/audio settings are ignored.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
