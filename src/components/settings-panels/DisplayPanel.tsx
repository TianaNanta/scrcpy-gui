import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { DeviceSettings } from "../../types/settings";
import { OptionField } from "../OptionField";
import type { ValidationState } from "../../types/validation";

interface DisplayPanelProps {
  settings: DeviceSettings;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  expanded: boolean;
  onToggle: () => void;
  validationState?: ValidationState;
}

export default function DisplayPanel({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
  validationState,
}: DisplayPanelProps) {
  const isCameraSource = settings.videoSource === "camera";
  const isVirtualDisplay = settings.virtualDisplay;
  const displayFieldsDisabled = isCameraSource || isVirtualDisplay;

  return (
    <div className="settings-panel">
      <button
        className={`panel-header${expanded ? " expanded" : ""}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4>Display & Quality</h4>
        <ChevronDownIcon />
      </button>
      <div
        className={`panel-content${expanded ? " expanded" : ""}`}
        aria-hidden={!expanded}
      >
        {displayFieldsDisabled && (
          <div className="version-warning">
            <span>
              {isCameraSource
                ? "Display ID, crop, and rotation are not available in camera mode."
                : "Display ID is not available when virtual display is enabled."}
            </span>
          </div>
        )}
        <div className="row">
          <label className="input-label">
            Resolution Limit:
            <select
              value={settings.maxSize}
              onChange={(e) =>
                onSettingsChange({ maxSize: Number(e.target.value) })
              }
            >
              <option value="0">Unlimited</option>
              <option value="720">720p</option>
              <option value="1080">1080p</option>
              <option value="1440">1440p</option>
            </select>
          </label>
        </div>
        <div className="row">
          <OptionField
            type="number"
            label="Bitrate (bps)"
            value={settings.bitrate}
            onChange={(value) => onSettingsChange({ bitrate: Number(value) })}
            error={validationState?.errors.find(e => e.option === 'video-bit-rate')}
            warning={validationState?.warnings.find(w => w.option === 'video-bit-rate')}
          />
        </div>
        <div className="row">
          <label className="input-label">
            Orientation:
            <select
              value={settings.rotation.toString()}
              onChange={(e) =>
                onSettingsChange({ rotation: Number(e.target.value) })
              }
              disabled={isCameraSource}
            >
              <option value="0">0°</option>
              <option value="90">90°</option>
              <option value="180">180°</option>
              <option value="270">270°</option>
            </select>
          </label>
        </div>
        <div className="row">
          <label className="input-label">
            Lock Video Orientation:
            <select
              value={settings.lockVideoOrientation.toString()}
              onChange={(e) =>
                onSettingsChange({
                  lockVideoOrientation: Number(e.target.value),
                })
              }
            >
              <option value="-1">Unlocked</option>
              <option value="0">0°</option>
              <option value="1">90°</option>
              <option value="2">180°</option>
              <option value="3">270°</option>
            </select>
          </label>
        </div>
        <div className="row">
          <label className="input-label">
            Display ID:
            <input
              type="number"
              min="0"
              value={settings.displayId}
              onChange={(e) =>
                onSettingsChange({ displayId: Number(e.target.value) })
              }
              disabled={displayFieldsDisabled}
              placeholder="0 (default)"
            />
            <span className="hint">
              Select display for multi-display devices (0 = main display)
            </span>
          </label>
        </div>
        <div className="row">
          <label className="input-label">
            Screen Crop:
            <input
              type="text"
              value={settings.crop}
              onChange={(e) => onSettingsChange({ crop: e.target.value })}
              disabled={isCameraSource}
              placeholder="width:height:x:y (e.g. 1080:1920:0:0)"
            />
            <span className="hint">
              Crop format: width:height:x:y (leave empty for no crop)
            </span>
          </label>
        </div>
        <div className="row">
          <label className="input-label">
            Display Buffer (ms):
            <input
              type="number"
              min="0"
              value={settings.displayBuffer}
              onChange={(e) =>
                onSettingsChange({ displayBuffer: Number(e.target.value) })
              }
              placeholder="0 (disabled)"
            />
            <span className="hint">
              Add a buffering delay (in milliseconds) to reduce jitter (0 =
              disabled)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
