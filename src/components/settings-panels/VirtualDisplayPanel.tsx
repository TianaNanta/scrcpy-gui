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
    <div className="settings-panel">
      <button
        className={`panel-header${expanded ? " expanded" : ""}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4>Virtual Display</h4>
        <ChevronDownIcon />
      </button>
      <div
        className={`panel-content${expanded ? " expanded" : ""}`}
        aria-hidden={!expanded}
      >
        {!canVirtualDisplay && (
          <div className="version-warning">
            <span>Virtual display requires scrcpy ≥ 3.0</span>
          </div>
        )}
        <div className="row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.virtualDisplay}
              onChange={(e) =>
                onSettingsChange({ virtualDisplay: e.target.checked })
              }
              disabled={!canVirtualDisplay}
            />
            Enable Virtual Display
            <span className="hint">
              — Create a new virtual display on the device
            </span>
          </label>
        </div>

        {settings.virtualDisplay && canVirtualDisplay && (
          <>
            <div className="row">
              <label className="input-label">
                Resolution:
                <input
                  type="text"
                  value={settings.virtualDisplayResolution}
                  onChange={(e) =>
                    onSettingsChange({
                      virtualDisplayResolution: e.target.value,
                    })
                  }
                  placeholder="1920x1080"
                />
                <span className="hint">
                  Virtual display resolution (WxH). Leave empty for device
                  default.
                </span>
              </label>
            </div>
            <div className="row">
              <label className="input-label">
                DPI:
                <input
                  type="number"
                  min="0"
                  value={settings.virtualDisplayDpi}
                  onChange={(e) =>
                    onSettingsChange({
                      virtualDisplayDpi: Number(e.target.value),
                    })
                  }
                  placeholder="0 (default)"
                />
                <span className="hint">
                  Virtual display density (0 = device default)
                </span>
              </label>
            </div>
            <div className="row">
              <label className="input-label">
                Start App:
                <input
                  type="text"
                  value={settings.startApp}
                  onChange={(e) =>
                    onSettingsChange({ startApp: e.target.value })
                  }
                  placeholder="com.example.app"
                />
                <span className="hint">
                  Package name to launch on the virtual display (e.g.
                  org.videolan.vlc)
                </span>
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
