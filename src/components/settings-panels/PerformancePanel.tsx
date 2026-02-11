import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { DeviceSettings } from "../../types/settings";

interface PerformancePanelProps {
  settings: DeviceSettings;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function PerformancePanel({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
}: PerformancePanelProps) {
  return (
    <div className="settings-panel">
      <button
        className={`panel-header${expanded ? ' expanded' : ''}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4>Performance & Quality</h4>
        <ChevronDownIcon />
      </button>
      <div className={`panel-content${expanded ? ' expanded' : ''}`} aria-hidden={!expanded}>
          <div className="row">
            <label className="input-label">
              Maximum FPS:
              <input
                type="number"
                min="0"
                max="240"
                value={settings.maxFps}
                onChange={(e) => onSettingsChange({ maxFps: Number(e.target.value) })}
                placeholder="0 (unlimited)"
              />
              <span className="hint">
                Limit the capture frame rate (0 = unlimited)
              </span>
            </label>
          </div>
          <div className="row">
            <label className="input-label">
              Video Codec:
              <select
                value={settings.videoCodec}
                onChange={(e) => onSettingsChange({ videoCodec: e.target.value })}
              >
                <option value="h264">H.264 (default)</option>
                <option value="h265">H.265 (HEVC)</option>
                <option value="av1">AV1</option>
              </select>
              <span className="hint">
                H.265 and AV1 may offer better quality at lower bitrates but require device support
              </span>
            </label>
          </div>
          <div className="row">
            <label className="input-label">
              Video Encoder:
              <input
                type="text"
                value={settings.videoEncoder}
                onChange={(e) => onSettingsChange({ videoEncoder: e.target.value })}
                placeholder="Default (auto-select)"
              />
              <span className="hint">
                Specific encoder name (e.g. OMX.qcom.video.encoder.avc). Leave empty for auto
              </span>
            </label>
          </div>
          <div className="row">
            <label className="input-label">
              Video Buffer (ms):
              <input
                type="number"
                min="0"
                value={settings.videoBuffer}
                onChange={(e) => onSettingsChange({ videoBuffer: Number(e.target.value) })}
                placeholder="0 (disabled)"
              />
              <span className="hint">
                Add a buffering delay for video (in milliseconds) to reduce jitter
              </span>
            </label>
          </div>
          <div className="row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.powerOffOnClose}
                onChange={(e) => onSettingsChange({ powerOffOnClose: e.target.checked })}
              />
              Power Off on Close
              <span className="hint">
                — turn device screen off when scrcpy closes
              </span>
            </label>
          </div>
          <div className="row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.noPowerOn}
                onChange={(e) => onSettingsChange({ noPowerOn: e.target.checked })}
              />
              Don't Power On
              <span className="hint">
                — don't wake the device when starting scrcpy
              </span>
            </label>
          </div>
      </div>
    </div>
  );
}
