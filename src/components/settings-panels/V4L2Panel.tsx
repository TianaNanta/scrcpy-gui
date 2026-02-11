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
    <div className="settings-panel" style={{ marginBottom: "1rem" }}>
      <button
        className="panel-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>V4L2 Virtual Webcam</h4>
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
              className="input-label"
              style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
            >
              V4L2 Sink Device:
              <select
                value={settings.v4l2Sink}
                onChange={(e) => onSettingsChange({ v4l2Sink: e.target.value })}
                style={{
                  backgroundColor: "#1e1e2e",
                  color: "white",
                  border: "1px solid #333",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  width: "100%",
                }}
              >
                <option value="">Disabled</option>
                {v4l2Devices.map((dev) => (
                  <option key={dev} value={dev}>
                    {dev}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.25rem", display: "block" }}>
                Select a V4L2 loopback device to expose as virtual webcam.
                {v4l2Devices.length === 0 && " No V4L2 devices found — install v4l2loopback."}
              </span>
            </label>
          </div>

          {settings.v4l2Sink && (
            <>
              <div className="row" style={{ marginBottom: "1rem" }}>
                <label
                  className="input-label"
                  style={{ color: "white", display: "block", marginBottom: "0.5rem" }}
                >
                  V4L2 Buffer (ms):
                  <input
                    type="number"
                    min="0"
                    value={settings.v4l2Buffer}
                    onChange={(e) => onSettingsChange({ v4l2Buffer: Number(e.target.value) })}
                    placeholder="0 (disabled)"
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
                    Add buffering delay for the V4L2 sink (0 = disabled)
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
                    checked={settings.noPlayback}
                    onChange={(e) => onSettingsChange({ noPlayback: e.target.checked })}
                    style={{ marginRight: "0.5rem" }}
                  />
                  No Playback
                  <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "0.5rem" }}>
                    — Only output to V4L2, don't show on screen
                  </span>
                </label>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
