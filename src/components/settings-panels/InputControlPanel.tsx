import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { DeviceSettings } from "../../types/settings";

interface InputControlPanelProps {
  settings: DeviceSettings;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  expanded: boolean;
  onToggle: () => void;
  /** Whether version supports UHID/AOA (≥2.4) */
  canUhidInput: boolean;
  /** Whether version supports gamepad forwarding (≥2.7) */
  canGamepad: boolean;
}

export default function InputControlPanel({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
  canUhidInput,
  canGamepad,
}: InputControlPanelProps) {
  return (
    <div className="settings-panel" style={{ marginBottom: "1rem" }}>
      <button
        className="panel-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Input & Control</h4>
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
              Keyboard Mode:
              <select
                value={settings.keyboardMode}
                onChange={(e) => onSettingsChange({ keyboardMode: e.target.value as DeviceSettings["keyboardMode"] })}
                style={{
                  backgroundColor: "#1e1e2e",
                  color: "white",
                  border: "1px solid #333",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  width: "100%",
                }}
              >
                <option value="default">Default (SDK)</option>
                <option value="sdk">SDK — Inject key events</option>
                {canUhidInput && (
                  <option value="uhid">UHID — Physical keyboard emulation</option>
                )}
                {canUhidInput && (
                  <option value="aoa">AOA — USB accessory (USB only)</option>
                )}
              </select>
              <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                {!canUhidInput
                  ? "UHID and AOA modes require scrcpy ≥ 2.4"
                  : "SDK: software injection. UHID: hardware emulation (supports shortcuts). AOA: USB-only hardware."}
              </span>
            </label>
          </div>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Mouse Mode:
              <select
                value={settings.mouseMode}
                onChange={(e) => onSettingsChange({ mouseMode: e.target.value as DeviceSettings["mouseMode"] })}
                style={{
                  backgroundColor: "#1e1e2e",
                  color: "white",
                  border: "1px solid #333",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  width: "100%",
                }}
              >
                <option value="default">Default (SDK)</option>
                <option value="sdk">SDK — Inject touch events</option>
                {canUhidInput && (
                  <option value="uhid">UHID — Physical mouse emulation</option>
                )}
                {canUhidInput && (
                  <option value="aoa">AOA — USB accessory (USB only)</option>
                )}
                <option value="disabled">Disabled — No mouse input</option>
              </select>
              <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                {!canUhidInput
                  ? "UHID and AOA modes require scrcpy ≥ 2.4"
                  : "UHID provides relative mouse support. AOA requires USB connection."}
              </span>
            </label>
          </div>
          <hr style={{ borderColor: "#333", margin: "1rem 0" }} />
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              Gamepad Mode:
              <select
                value={settings.gamepadMode}
                onChange={(e) => onSettingsChange({ gamepadMode: e.target.value as DeviceSettings["gamepadMode"] })}
                disabled={!canGamepad}
                style={{
                  backgroundColor: "#1e1e2e",
                  color: "white",
                  border: "1px solid #333",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  width: "100%",
                  opacity: canGamepad ? 1 : 0.5,
                }}
              >
                <option value="disabled">Disabled</option>
                {canGamepad && (
                  <option value="uhid">UHID — Virtual gamepad</option>
                )}
                {canGamepad && (
                  <option value="aoa">AOA — USB accessory (USB only)</option>
                )}
              </select>
              <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                {!canGamepad
                  ? "Gamepad forwarding requires scrcpy ≥ 2.7"
                  : "Forward gamepad inputs to the device. UHID recommended."}
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
