import React from "react";
import { DocumentTextIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import type { Preset } from "../types/settings";
import TagInput from "./TagInput";
import PresetCard from "./PresetCard";

interface PresetManagerProps {
  presets: Preset[];
  onSavePreset: (name: string, tags: string[]) => void;
  onLoadPreset: (preset: Preset) => void;
  onDeletePreset?: (presetId: string) => void;
  onToggleFavorite?: (presetId: string) => void;
  onExport?: () => void;
  onImport?: () => void;
}

export default function PresetManager({
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onToggleFavorite,
  onExport,
  onImport,
}: PresetManagerProps) {
  const [presetName, setPresetName] = React.useState("");
  const [presetTags, setPresetTags] = React.useState<string[]>([]);
  const [filterTags, setFilterTags] = React.useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = React.useState(false);

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim(), presetTags);
      setPresetName("");
      setPresetTags([]);
    }
  };

  const filteredPresets = React.useMemo(() => {
    let filtered = filterTags.length === 0
      ? presets
      : presets.filter(preset =>
          filterTags.every(tag => preset.tags.includes(tag))
        );

    if (showOnlyFavorites) {
      filtered = filtered.filter(preset => preset.isFavorite);
    }

    // Sort favorites first
    return filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0; // Maintain original order for same favorite status
    });
  }, [presets, filterTags, showOnlyFavorites]);
  return (
    <div className="tab-content">
      <header className="header">
        <DocumentTextIcon className="header-icon" />
        <h1>Presets</h1>
      </header>
      <section className="section">
        <h2>Save Current Configuration</h2>
        <div className="row" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <input
            type="text"
            placeholder="Preset name"
            className="input"
            aria-label="Preset name"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSavePreset();
              }
            }}
          />
          <TagInput
            tags={presetTags}
            onChange={setPresetTags}
            placeholder="Add tags (optional)..."
          />
          <button
            className="btn btn-primary"
            onClick={handleSavePreset}
            disabled={!presetName.trim()}
          >
            Save Preset
          </button>
        </div>
      </section>
      <section className="section">
        <h2>Available Presets</h2>
        <div style={{ marginBottom: "var(--space-md)", display: "flex", gap: "var(--space-sm)" }}>
          {onExport && (
            <button
              className="btn btn-secondary"
              onClick={onExport}
              disabled={presets.length === 0}
              title="Export presets to file"
            >
              <ArrowDownTrayIcon style={{ width: "1rem", height: "1rem", marginRight: "var(--space-xs)" }} />
              Export
            </button>
          )}
          {onImport && (
            <button
              className="btn btn-secondary"
              onClick={onImport}
              title="Import presets from file"
            >
              <ArrowUpTrayIcon style={{ width: "1rem", height: "1rem", marginRight: "var(--space-xs)" }} />
              Import
            </button>
          )}
        </div>
        <div style={{ marginBottom: "var(--space-md)" }}>
          <label style={{ display: "block", marginBottom: "var(--space-xs)" }}>
            Filter by tags:
          </label>
          <TagInput
            tags={filterTags}
            onChange={setFilterTags}
            placeholder="Filter tags..."
          />
          <div style={{ marginTop: "var(--space-sm)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
              <input
                type="checkbox"
                checked={showOnlyFavorites}
                onChange={(e) => setShowOnlyFavorites(e.target.checked)}
              />
              Show only favorites
            </label>
          </div>
        </div>
        <div className="presets-list">
          {filteredPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onLoad={() => onLoadPreset(preset)}
              onDelete={onDeletePreset ? () => onDeletePreset(preset.id) : undefined}
              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(preset.id) : undefined}
            />
          ))}
          {filteredPresets.length === 0 && (
            <p
              className="text-caption"
              style={{ textAlign: "center", padding: "var(--space-lg)" }}
            >
              {filterTags.length > 0
                ? "No presets match the selected tags."
                : "No presets saved yet. Configure your settings and save a preset."
              }
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
