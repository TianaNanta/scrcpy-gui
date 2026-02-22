import type { Preset } from "../types/settings";
import TagBadge from "./TagBadge";
import FavoriteStar from "./FavoriteStar";

interface PresetCardProps {
  preset: Preset;
  onLoad: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
}

export default function PresetCard({ preset, onLoad, onDelete, onToggleFavorite }: PresetCardProps) {
  return (
    <div className="preset-item">
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", marginBottom: "var(--space-xs)" }}>
          {onToggleFavorite && (
            <FavoriteStar
              isFavorite={preset.isFavorite}
              onToggle={onToggleFavorite}
              size="sm"
            />
          )}
          <div style={{ fontWeight: "bold" }}>
            {preset.name}
          </div>
        </div>
        {preset.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)" }}>
            {preset.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>
      <div className="preset-actions">
        <button
          className="btn btn-secondary"
          onClick={onLoad}
          aria-label={`Load preset ${preset.name}`}
        >
          Load
        </button>
        {onDelete && (
          <button
            className="btn btn-secondary btn-delete-text"
            onClick={onDelete}
            aria-label={`Delete preset ${preset.name}`}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}