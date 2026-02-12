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
    <div className="settings-panel">
      <button
        className={`panel-header${expanded ? ' expanded' : ''}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4>Network & Connection</h4>
        <ChevronDownIcon />
      </button>
      <div className={`panel-content${expanded ? ' expanded' : ''}`} aria-hidden={!expanded}>
        <div className="row">
          <label
            className="input-label"
          >
            Time Limit (seconds):
            <input
              type="number"
              min="0"
              value={settings.timeLimit}
              onChange={(e) => onSettingsChange({ timeLimit: Number(e.target.value) })}
              placeholder="0 (no limit)"
            />
            <span className="hint">
              Automatically stop mirroring after the given number of seconds (0 = no limit)
            </span>
          </label>
        </div>
        <div className="row">
          <label
            className="checkbox-label"
          >
            <input
              type="checkbox"
              checked={settings.forceAdbForward}
              onChange={(e) => onSettingsChange({ forceAdbForward: e.target.checked })}
            />
            Force ADB Forward
            <span className="hint">
              — use "adb forward" instead of "adb reverse" for connection
            </span>
          </label>
        </div>
        <div className="row">
          <label
            className="checkbox-label"
          >
            <input
              type="checkbox"
              checked={settings.noCleanup}
              onChange={(e) => onSettingsChange({ noCleanup: e.target.checked })}
            />
            No Cleanup
            <span className="hint">
              — don't restore device state on disconnect (useful for reconnection)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
