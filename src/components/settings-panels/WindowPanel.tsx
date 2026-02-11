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
    <div className="settings-panel">
      <button
        className={`panel-header${expanded ? ' expanded' : ''}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4>Window Management</h4>
        <ChevronDownIcon />
      </button>
      <div className={`panel-content${expanded ? ' expanded' : ''}`} aria-hidden={!expanded}>
          <div className="row">
            <label
              className="input-label"
            >
              Window Position:
              <div>
                <input
                  type="number"
                  min="0"
                  value={settings.windowX}
                  onChange={(e) => onSettingsChange({ windowX: Number(e.target.value) })}
                  placeholder="X"
                />
                <input
                  type="number"
                  min="0"
                  value={settings.windowY}
                  onChange={(e) => onSettingsChange({ windowY: Number(e.target.value) })}
                  placeholder="Y"
                />
              </div>
              <span className="hint">
                X and Y coordinates (0 = default position)
              </span>
            </label>
          </div>
          <div className="row">
            <label
              className="input-label"
            >
              Window Size:
              <div>
                <input
                  type="number"
                  min="0"
                  value={settings.windowWidth}
                  onChange={(e) => onSettingsChange({ windowWidth: Number(e.target.value) })}
                  placeholder="Width"
                />
                <input
                  type="number"
                  min="0"
                  value={settings.windowHeight}
                  onChange={(e) => onSettingsChange({ windowHeight: Number(e.target.value) })}
                  placeholder="Height"
                />
              </div>
              <span className="hint">
                Width and Height in pixels (0 = auto)
              </span>
            </label>
          </div>
          <div className="row">
            <label
              className="checkbox-label"
            >
              <input
                type="checkbox"
                checked={settings.alwaysOnTop}
                onChange={(e) => onSettingsChange({ alwaysOnTop: e.target.checked })}
              />
              Always on Top
            </label>
          </div>
          <div className="row">
            <label
              className="checkbox-label"
            >
              <input
                type="checkbox"
                checked={settings.windowBorderless}
                onChange={(e) => onSettingsChange({ windowBorderless: e.target.checked })}
              />
              Borderless Window
            </label>
          </div>
          <div className="row">
            <label
              className="input-label"
            >
              Window Title:
              <input
                type="text"
                value={settings.windowTitle}
                onChange={(e) => onSettingsChange({ windowTitle: e.target.value })}
                placeholder="Default (device model)"
              />
              <span className="hint">
                Custom window title (leave empty for default)
              </span>
            </label>
          </div>
          <div className="row">
            <label
              className="checkbox-label"
            >
              <input
                type="checkbox"
                checked={settings.fullscreen}
                onChange={(e) => onSettingsChange({ fullscreen: e.target.checked })}
              />
              Fullscreen Mode
            </label>
          </div>
      </div>
    </div>
  );
}
