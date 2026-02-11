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
    <div className="settings-panel">
      <button
        className={`panel-header${expanded ? ' expanded' : ''}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4>Video Source</h4>
        <ChevronDownIcon />
      </button>
      <div className={`panel-content${expanded ? ' expanded' : ''}`} aria-hidden={!expanded}>
          {!canCamera && (
            <div className="version-warning">
              <span>
                Camera mirroring requires scrcpy ≥ 2.2 and Android 12+
              </span>
            </div>
          )}
          <div className="row">
            <label
              className="input-label"
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
              >
                <option value="display">Display (screen mirroring)</option>
                {canCamera && <option value="camera">Camera</option>}
              </select>
            </label>
          </div>

          {isCamera && canCamera && (
            <>
              <div className="row">
                <label
                  className="input-label"
                >
                  Camera Facing:
                  <select
                    value={settings.cameraFacing}
                    onChange={(e) =>
                      onSettingsChange({ cameraFacing: e.target.value as DeviceSettings["cameraFacing"] })
                    }
                  >
                    <option value="front">Front</option>
                    <option value="back">Back</option>
                    <option value="external">External</option>
                  </select>
                </label>
              </div>
              <div className="row">
                <label
                  className="input-label"
                >
                  Camera Size:
                  <input
                    type="text"
                    value={settings.cameraSize}
                    onChange={(e) => onSettingsChange({ cameraSize: e.target.value })}
                    placeholder="1920x1080"
                  />
                  <span className="hint">
                    Camera resolution (WxH). Leave empty for default.
                  </span>
                </label>
              </div>
              <div className="row">
                <label
                  className="input-label"
                >
                  Camera ID:
                  <input
                    type="text"
                    value={settings.cameraId}
                    onChange={(e) => onSettingsChange({ cameraId: e.target.value })}
                    placeholder="Auto (leave empty)"
                  />
                  <span className="hint">
                    Specific camera ID if the device has multiple cameras of the same facing direction.
                  </span>
                </label>
              </div>
            </>
          )}
        </div>
    </div>
  );
}
