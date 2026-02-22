import { useState, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export default function TagInput({
  tags,
  onChange,
  placeholder = "Add tags...",
  maxTags = 10,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
      onChange([...tags, trimmed]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className="tag-input-container"
      onClick={handleContainerClick}
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        padding: "var(--space-xs)",
        minHeight: "2.5rem",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "var(--space-xs)",
        cursor: "text",
      }}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="tag-badge"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-text)",
            padding: "var(--space-xs) var(--space-sm)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--font-size-sm)",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-xs)",
          }}
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
            aria-label={`Remove tag ${tag}`}
          >
            <XMarkIcon style={{ width: "1rem", height: "1rem" }} />
          </button>
        </span>
      ))}
      {tags.length < maxTags && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          style={{
            border: "none",
            outline: "none",
            flex: 1,
            minWidth: "120px",
            fontSize: "var(--font-size-sm)",
          }}
          aria-label="Add tags"
        />
      )}
    </div>
  );
}