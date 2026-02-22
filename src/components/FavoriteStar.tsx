import { StarIcon as SolidStarIcon } from "@heroicons/react/24/solid";
import { StarIcon as OutlineStarIcon } from "@heroicons/react/24/outline";

interface FavoriteStarProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
}

export default function FavoriteStar({
  isFavorite,
  onToggle,
  size = "md",
}: FavoriteStarProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`favorite-star ${isFavorite ? "favorite" : ""}`}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: isFavorite ? "var(--color-accent, #fbbf24)" : "var(--color-text-secondary, #6b7280)",
        transition: "color 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = isFavorite
          ? "var(--color-accent-hover, #f59e0b)"
          : "var(--color-text, #374151)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = isFavorite
          ? "var(--color-accent, #fbbf24)"
          : "var(--color-text-secondary, #6b7280)";
      }}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorite ? (
        <SolidStarIcon className={sizeClasses[size]} />
      ) : (
        <OutlineStarIcon className={sizeClasses[size]} />
      )}
    </button>
  );
}