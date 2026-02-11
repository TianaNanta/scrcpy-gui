import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { DeviceSettings } from "../../types/settings";

interface V4L2PanelProps {
  settings: DeviceSettings;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  expanded: boolean;
  onToggle: () => void;
}

export default function V4L2Panel({
  settings,
  onSettingsChange,
  expanded,
  onToggle,
}: V4L2PanelProps) {
  const [v4l2Devices, setV4l2Devices] = useState<string[]>([]);

  useEffect(() => {
    if (expanded) {
      invoke<string[]>("list_v4l2_devices")
        .then(setV4l2Devices)
        .catch(() => setV4l2Devices([]));
    }
  }, [expanded]);

  return (
    <div className="settings-panel">
      <button
        className={`panel-header${expanded ? ' expanded' : ''}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4>V4L2 Virtual Webcam</h4>
        <ChevronDownIcon />
      </button>
      <div className={`panel-content${expanded ? ' expanded' : ''}`} aria-hidden={!expanded}>
          <div className="row">
            <label
              className="input-label"
            >
              V4L2 Sink Device:
              <select
                value={settings.v4l2Sink}
                onChange={(e) => onSettingsChange({ v4l2Sink: e.target.value })}
              >
                <option value="">Disabled</option>
                {v4l2Devices.map((dev) => (
                  <option key={dev} value={dev}>
                    {dev}
                  </option>
                ))}
              </select>
              <span className="hint">
                Select a V4L2 loopback device to expose as virtual webcam.
                {v4l2Devices.length === 0 && " No V4L2 devices found — install v4l2loopback."}
              </span>
            </label>
          </div>

          {settings.v4l2Sink && (
            <>
              <div className="row">
                <label
                  className="input-label"
                >
                  V4L2 Buffer (ms):
                  <input
                    type="number"
                    min="0"
                    value={settings.v4l2Buffer}
                    onChange={(e) => onSettingsChange({ v4l2Buffer: Number(e.target.value) })}
                    placeholder="0 (disabled)"
                  />
                  <span className="hint">
                    Add buffering delay for the V4L2 sink (0 = disabled)
                  </span>
                </label>
              </div>
              <div className="row">
                <label
                  className="checkbox-label"
                >
                  <input
                    type="checkbox"
                    checked={settings.noPlayback}
                    onChange={(e) => onSettingsChange({ noPlayback: e.target.checked })}
                  />
                  No Playback
                  <span className="hint">
                    — Only output to V4L2, don't show on screen
                  </span>
                </label>
              </div>
            </>
          )}
      </div>
    </div>
  );
}
