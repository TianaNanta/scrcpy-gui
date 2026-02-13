import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { DeviceSettings } from "../../types/settings";

interface AudioPanelProps {
  settings: DeviceSettings;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  expanded: boolean;
  onToggle: () => void;
  /** Audio forwarding available (≥2.0) */
  canAudio: boolean;
  /** No-video mode available (≥2.1) */
  canNoVideo: boolean;
}

export default function AudioPanel({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
  canAudio,
  canNoVideo,
}: AudioPanelProps) {
  return (
    <div className="settings-panel">
      <button
        className={`panel-header${expanded ? " expanded" : ""}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4>Audio</h4>
        <ChevronDownIcon />
      </button>
      <div
        className={`panel-content${expanded ? " expanded" : ""}`}
        aria-hidden={!expanded}
      >
        {!canAudio && (
          <div className="version-warning">
            <span>Audio forwarding requires scrcpy ≥ 2.0</span>
          </div>
        )}
        <div className="row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.audioForwarding}
              onChange={(e) =>
                onSettingsChange({ audioForwarding: e.target.checked })
              }
              disabled={!canAudio}
            />
            Enable Audio Forwarding
            <span className="hint">— Forward device audio to computer</span>
          </label>
        </div>

        {settings.audioForwarding && canAudio && (
          <>
            <div className="row">
              <label className="input-label">
                Audio Codec:
                <select
                  value={settings.audioCodec}
                  onChange={(e) =>
                    onSettingsChange({ audioCodec: e.target.value })
                  }
                >
                  <option value="opus">Opus (default)</option>
                  <option value="aac">AAC</option>
                  <option value="flac">FLAC</option>
                  <option value="raw">Raw</option>
                </select>
                <span className="hint">
                  Opus is recommended for low latency. AAC has wider device
                  support.
                </span>
              </label>
            </div>
            <div className="row">
              <label className="input-label">
                Audio Bitrate (bps):
                <input
                  type="number"
                  min="0"
                  value={settings.audioBitrate}
                  onChange={(e) =>
                    onSettingsChange({ audioBitrate: Number(e.target.value) })
                  }
                  placeholder="128000"
                />
                <span className="hint">
                  Audio bitrate in bits per second (0 = default)
                </span>
              </label>
            </div>
            <div className="row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.microphoneForwarding}
                  onChange={(e) =>
                    onSettingsChange({ microphoneForwarding: e.target.checked })
                  }
                />
                Microphone Forwarding
                <span className="hint">
                  — Use device microphone as audio source
                </span>
              </label>
            </div>
          </>
        )}

        <div className="row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.noAudio}
              onChange={(e) =>
                onSettingsChange({
                  noAudio: e.target.checked,
                  audioForwarding: e.target.checked
                    ? false
                    : settings.audioForwarding,
                })
              }
              disabled={!canAudio}
            />
            Disable Audio (--no-audio)
            <span className="hint">— Don't forward audio at all</span>
          </label>
        </div>

        <div className="row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.noVideo}
              onChange={(e) => onSettingsChange({ noVideo: e.target.checked })}
              disabled={!canNoVideo}
            />
            Audio Only (--no-video)
            <span className="hint">
              {canNoVideo
                ? "— Forward audio without mirroring the screen"
                : "— Requires scrcpy ≥ 2.1"}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
