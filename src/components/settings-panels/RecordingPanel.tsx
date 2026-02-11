import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { invoke } from "@tauri-apps/api/core";
import type { DeviceSettings } from "../../types/settings";

interface RecordingPanelProps {
  settings: DeviceSettings;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function RecordingPanel({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
}: RecordingPanelProps) {
  const selectSaveFile = async () => {
    try {
      const filePath: string | null = await invoke("select_save_file");
      if (filePath) {
        const extension = settings.recordFormat;
        const finalPath = filePath.endsWith(`.${extension}`)
          ? filePath
          : `${filePath}.${extension}`;
        onSettingsChange({ recordFile: finalPath });
      }
    } catch (e) {
      console.error("Failed to select save file:", e);
    }
  };

  return (
    <div className="settings-panel" style={{ marginBottom: "1rem" }}>
      <button
        className="panel-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Recording</h4>
        <ChevronDownIcon
          style={{
            width: "1rem",
            height: "1rem",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>
      {expanded && (
        <div className="panel-content" style={{ padding: "1rem 0" }}>
          <div className="row" style={{ marginBottom: "1rem" }}>
            <label
              className="checkbox-label"
              style={{ color: "white", display: "flex", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={settings.recordingEnabled}
                onChange={(e) => onSettingsChange({ recordingEnabled: e.target.checked })}
                style={{ marginRight: "0.5rem" }}
              />
              Enable Recording
            </label>
          </div>
          {settings.recordingEnabled && (
            <>
              <div className="row" style={{ marginBottom: "1rem" }}>
                <label
                  className="input-label"
                  style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
                >
                  Output Filename:
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      value={settings.recordFile}
                      onChange={(e) => onSettingsChange({ recordFile: e.target.value })}
                      style={{
                        backgroundColor: "#1e1e2e",
                        color: "white",
                        border: "1px solid #333",
                        padding: "0.5rem",
                        borderRadius: "4px",
                        flex: 1,
                      }}
                    />
                    <button
                      onClick={selectSaveFile}
                      style={{
                        backgroundColor: "#333",
                        color: "white",
                        border: "1px solid #555",
                        padding: "0.5rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Browse
                    </button>
                  </div>
                </label>
              </div>
              <div className="row" style={{ marginBottom: "1rem" }}>
                <label
                  className="input-label"
                  style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
                >
                  Container format:
                  <select
                    value={settings.recordFormat}
                    onChange={(e) =>
                      onSettingsChange({ recordFormat: e.target.value as "mp4" | "mkv" })
                    }
                    style={{
                      backgroundColor: "#1e1e2e",
                      color: "white",
                      border: "1px solid #333",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      width: "100%",
                    }}
                  >
                    <option value="mp4">MP4</option>
                    <option value="mkv">MKV</option>
                  </select>
                </label>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
