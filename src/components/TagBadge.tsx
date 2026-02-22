interface TagBadgeProps {
  tag: string;
  onRemove?: () => void;
  removable?: boolean;
}

export default function TagBadge({
  tag,
  onRemove,
  removable = false,
}: TagBadgeProps) {
  return (
    <span
      className="tag-badge"
      style={{
        backgroundColor: "var(--color-secondary)",
        color: "var(--color-text)",
        padding: "var(--space-xs) var(--space-sm)",
        borderRadius: "var(--radius-sm)",
        fontSize: "var(--font-size-sm)",
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-xs)",
      }}
    >
      {tag}
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: "none",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            fontSize: "var(--font-size-xs)",
          }}
          aria-label={`Remove tag ${tag}`}
        >
          ×
        </button>
      )}
    </span>
  );
}