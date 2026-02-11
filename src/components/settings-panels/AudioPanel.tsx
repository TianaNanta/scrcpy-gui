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
    <div className="settings-panel" style={{ marginBottom: "1rem" }}>
      <div
        className="panel-header"
        onClick={onToggle}
        style={{
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 0",
          borderBottom: "1px solid #333",
        }}
      >
        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Audio</h4>
        <ChevronDownIcon
          style={{
            width: "1rem",
            height: "1rem",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </div>
      {expanded && (
        <div className="panel-content" style={{ padding: "1rem 0" }}>
          {!canAudio && (
            <div style={{ padding: "0.5rem", marginBottom: "1rem", backgroundColor: "#1e1e2e", borderRadius: "4px", border: "1px solid #555" }}>
              <span style={{ fontSize: "0.85rem", color: "#f59e0b" }}>
                Audio forwarding requires scrcpy ≥ 2.0
              </span>
            </div>
          )}
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="checkbox-label"
              style={{ color: "white", display: "flex", alignItems: "center", opacity: canAudio ? 1 : 0.5 }}
            >
              <input
                type="checkbox"
                checked={settings.audioForwarding}
                onChange={(e) => onSettingsChange({ audioForwarding: e.target.checked })}
                disabled={!canAudio}
                style={{ marginRight: "0.5rem" }}
              />
              Enable Audio Forwarding
              <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "0.5rem" }}>
                — Forward device audio to computer
              </span>
            </label>
          </div>

          {settings.audioForwarding && canAudio && (
            <>
              <div className="row" style={{ marginBottom: "1rem" }}>
                <label
                  className="input-label"
                  style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
                >
                  Audio Codec:
                  <select
                    value={settings.audioCodec}
                    onChange={(e) => onSettingsChange({ audioCodec: e.target.value })}
                    style={{
                      backgroundColor: "#1e1e2e",
                      color: "white",
                      border: "1px solid #333",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      width: "100%",
                    }}
                  >
                    <option value="opus">Opus (default)</option>
                    <option value="aac">AAC</option>
                    <option value="flac">FLAC</option>
                    <option value="raw">Raw</option>
                  </select>
                  <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                    Opus is recommended for low latency. AAC has wider device support.
                  </span>
                </label>
              </div>
              <div className="row" style={{ marginBottom: "1rem" }}>
                <label
                  className="input-label"
                  style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
                >
                  Audio Bitrate (bps):
                  <input
                    type="number"
                    min="0"
                    value={settings.audioBitrate}
                    onChange={(e) => onSettingsChange({ audioBitrate: Number(e.target.value) })}
                    placeholder="128000"
                    style={{
                      backgroundColor: "#1e1e2e",
                      color: "white",
                      border: "1px solid #333",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      width: "100%",
                    }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                    Audio bitrate in bits per second (0 = default)
                  </span>
                </label>
              </div>
              <div className="row" style={{ marginBottom: "1rem" }}>
                <label
                  className="checkbox-label"
                  style={{ color: "white", display: "flex", alignItems: "center" }}
                >
                  <input
                    type="checkbox"
                    checked={settings.microphoneForwarding}
                    onChange={(e) => onSettingsChange({ microphoneForwarding: e.target.checked })}
                    style={{ marginRight: "0.5rem" }}
                  />
                  Microphone Forwarding
                  <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "0.5rem" }}>
                    — Use device microphone as audio source
                  </span>
                </label>
              </div>
            </>
          )}

          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="checkbox-label"
              style={{ color: "white", display: "flex", alignItems: "center", opacity: canAudio ? 1 : 0.5 }}
            >
              <input
                type="checkbox"
                checked={settings.noAudio}
                onChange={(e) => onSettingsChange({ noAudio: e.target.checked, audioForwarding: e.target.checked ? false : settings.audioForwarding })}
                disabled={!canAudio}
                style={{ marginRight: "0.5rem" }}
              />
              Disable Audio (--no-audio)
              <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "0.5rem" }}>
                — Don't forward audio at all
              </span>
            </label>
          </div>

          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="checkbox-label"
              style={{ color: "white", display: "flex", alignItems: "center", opacity: canNoVideo ? 1 : 0.5 }}
            >
              <input
                type="checkbox"
                checked={settings.noVideo}
                onChange={(e) => onSettingsChange({ noVideo: e.target.checked })}
                disabled={!canNoVideo}
                style={{ marginRight: "0.5rem" }}
              />
              Audio Only (--no-video)
              <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "0.5rem" }}>
                {canNoVideo ? "— Forward audio without mirroring the screen" : "— Requires scrcpy ≥ 2.1"}
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
