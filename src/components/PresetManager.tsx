import { DocumentTextIcon } from "@heroicons/react/24/outline";
import type { Preset } from "../types/settings";

interface PresetManagerProps {
  presets: Preset[];
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: Preset) => void;
  onDeletePreset?: (presetId: string) => void;
}

export default function PresetManager({
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
}: PresetManagerProps) {
  return (
    <div className="tab-content">
      <header className="header">
        <DocumentTextIcon className="header-icon" />
        <h1>Presets</h1>
      </header>
      <section className="section">
        <h2>Save Current Configuration</h2>
        <div className="row">
          <input
            type="text"
            placeholder="Preset name"
            className="input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const input = e.target as HTMLInputElement;
                if (input.value.trim()) {
                  onSavePreset(input.value.trim());
                  input.value = "";
                }
              }
            }}
          />
          <button
            className="btn btn-primary"
            onClick={() => {
              const name = prompt("Enter preset name");
              if (name?.trim()) onSavePreset(name.trim());
            }}
          >
            Save Preset
          </button>
        </div>
      </section>
      <section className="section">
        <h2>Available Presets</h2>
        <div className="presets-list">
          {presets.map((preset) => (
            <div key={preset.id} className="preset-item">
              <span>{preset.name}</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-secondary" onClick={() => onLoadPreset(preset)}>
                  Load
                </button>
                {onDeletePreset && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => onDeletePreset(preset.id)}
                    style={{ color: "#ef4444" }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          {presets.length === 0 && (
            <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "1rem" }}>
              No presets saved yet. Configure your settings and save a preset.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
