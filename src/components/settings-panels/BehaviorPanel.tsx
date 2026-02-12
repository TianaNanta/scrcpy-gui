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
    <div className="settings-panel">
      <button
        className={`panel-header${expanded ? ' expanded' : ''}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4>Behavior</h4>
        <ChevronDownIcon />
      </button>
      <div className={`panel-content${expanded ? ' expanded' : ''}`} aria-hidden={!expanded}>
          {settings.videoSource === "camera" && (
            <div className="version-warning">
              <span>
                Camera mode disables device control — some behavior options will be skipped.
              </span>
            </div>
          )}
          {settings.videoSource !== "camera" && settings.noControl && (
            <div className="version-warning">
              <span>
                Read-only mode — some behavior options will be skipped.
              </span>
            </div>
          )}
          <div className="row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.stayAwake}
                onChange={(e) => onSettingsChange({ stayAwake: e.target.checked })}
              />
              Stay Awake
            </label>
          </div>
          <div className="row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.showTouches}
                onChange={(e) => onSettingsChange({ showTouches: e.target.checked })}
              />
              Show Touches
            </label>
          </div>
          <div className="row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.turnScreenOff}
                onChange={(e) => onSettingsChange({ turnScreenOff: e.target.checked })}
              />
              Turn Screen Off
            </label>
          </div>
          <div className="row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.noControl}
                onChange={(e) => onSettingsChange({ noControl: e.target.checked })}
              />
              Read-only Mode
            </label>
          </div>
          <hr />
          <div className="row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.otgMode}
                onChange={(e) => onSettingsChange({ otgMode: e.target.checked })}
              />
              OTG Mode
              <span className="hint">
                — Physical keyboard/mouse via USB (no mirroring)
              </span>
            </label>
            {settings.otgMode && (
              <div className="version-warning">
                <span>
                  OTG mode requires a USB connection. Video/audio settings are ignored.
                </span>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
