/**
 * Props for the TagBadge component
 */
interface TagBadgeProps {
  /** The tag text to display */
  tag: string;
  /** Callback fired when the remove button is clicked */
  onRemove?: () => void;
  /** Whether to show the remove button */
  removable?: boolean;
}

/**
 * TagBadge Component
 *
 * Displays a single tag as a styled badge with an optional remove button.
 *
 * @param props - Component props
 * @returns JSX element
 * @example
 * <TagBadge tag="work" removable onRemove={() => removeTag("work")} />
 */
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
