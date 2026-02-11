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
    <div className="settings-panel">
      <button
        className={`panel-header${expanded ? ' expanded' : ''}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4>Input & Control</h4>
        <ChevronDownIcon />
      </button>
      <div className={`panel-content${expanded ? ' expanded' : ''}`} aria-hidden={!expanded}>
          <div className="row">
            <label
              className="input-label"
            >
              Keyboard Mode:
              <select
                value={settings.keyboardMode}
                onChange={(e) => onSettingsChange({ keyboardMode: e.target.value as DeviceSettings["keyboardMode"] })}
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
              <span className="hint">
                {!canUhidInput
                  ? "UHID and AOA modes require scrcpy ≥ 2.4"
                  : "SDK: software injection. UHID: hardware emulation (supports shortcuts). AOA: USB-only hardware."}
              </span>
            </label>
          </div>
          <div className="row">
            <label
              className="input-label"
            >
              Mouse Mode:
              <select
                value={settings.mouseMode}
                onChange={(e) => onSettingsChange({ mouseMode: e.target.value as DeviceSettings["mouseMode"] })}
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
              <span className="hint">
                {!canUhidInput
                  ? "UHID and AOA modes require scrcpy ≥ 2.4"
                  : "UHID provides relative mouse support. AOA requires USB connection."}
              </span>
            </label>
          </div>
          <hr />
          <div className="row">
            <label
              className="input-label"
            >
              Gamepad Mode:
              <select
                value={settings.gamepadMode}
                onChange={(e) => onSettingsChange({ gamepadMode: e.target.value as DeviceSettings["gamepadMode"] })}
                disabled={!canGamepad}
              >
                <option value="disabled">Disabled</option>
                {canGamepad && (
                  <option value="uhid">UHID — Virtual gamepad</option>
                )}
                {canGamepad && (
                  <option value="aoa">AOA — USB accessory (USB only)</option>
                )}
              </select>
              <span className="hint">
                {!canGamepad
                  ? "Gamepad forwarding requires scrcpy ≥ 2.7"
                  : "Forward gamepad inputs to the device. UHID recommended."}
              </span>
            </label>
          </div>
      </div>
    </div>
  );
}
