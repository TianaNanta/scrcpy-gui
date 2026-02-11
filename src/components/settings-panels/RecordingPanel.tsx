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
    <div className="settings-panel">
      <button
        className={`panel-header${expanded ? ' expanded' : ''}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4>Recording</h4>
        <ChevronDownIcon />
      </button>
      <div className={`panel-content${expanded ? ' expanded' : ''}`} aria-hidden={!expanded}>
          <div className="row">
            <label
              className="checkbox-label"
            >
              <input
                type="checkbox"
                checked={settings.recordingEnabled}
                onChange={(e) => onSettingsChange({ recordingEnabled: e.target.checked })}
              />
              Enable Recording
            </label>
          </div>
          {settings.recordingEnabled && (
            <>
              <div className="row">
                <label
                  className="input-label"
                >
                  Output Filename:
                  <div className="input-with-button">
                    <input
                      type="text"
                      value={settings.recordFile}
                      onChange={(e) => onSettingsChange({ recordFile: e.target.value })}
                    />
                    <button
                      onClick={selectSaveFile}
                      className="browse-button"
                    >
                      Browse
                    </button>
                  </div>
                </label>
              </div>
              <div className="row">
                <label
                  className="input-label"
                >
                  Container format:
                  <select
                    value={settings.recordFormat}
                    onChange={(e) =>
                      onSettingsChange({ recordFormat: e.target.value as "mp4" | "mkv" })
                    }
                  >
                    <option value="mp4">MP4</option>
                    <option value="mkv">MKV</option>
                  </select>
                </label>
              </div>
            </>
          )}
      </div>
    </div>
  );
}
