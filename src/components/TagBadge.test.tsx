/**
 * TagBadge Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TagBadge from "./TagBadge";

describe("TagBadge", () => {
  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<TagBadge tag="test-tag" />);
      expect(screen.getByText("test-tag")).toBeInTheDocument();
    });

    it("displays the tag label", () => {
      render(<TagBadge tag="my-tag" />);
      expect(screen.getByText("my-tag")).toBeInTheDocument();
    });

    it("renders with tag-badge class", () => {
      const { container } = render(<TagBadge tag="test-tag" />);
      expect(container.querySelector(".tag-badge")).toBeInTheDocument();
    });

    it("does not show remove button when removable is false", () => {
      render(<TagBadge tag="test-tag" removable={false} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("does not show remove button when removable is true but onRemove is not provided", () => {
      render(<TagBadge tag="test-tag" removable={true} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("shows remove button when removable is true and onRemove is provided", () => {
      const onRemove = vi.fn();
      render(<TagBadge tag="test-tag" removable={true} onRemove={onRemove} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("remove button has accessible label", () => {
      const onRemove = vi.fn();
      render(<TagBadge tag="my-tag" removable={true} onRemove={onRemove} />);
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Remove tag my-tag",
      );
    });
  });

  describe("interactions", () => {
    it("calls onRemove when remove button is clicked", () => {
      const onRemove = vi.fn();
      render(<TagBadge tag="test-tag" removable={true} onRemove={onRemove} />);

      const removeButton = screen.getByRole("button");
      fireEvent.click(removeButton);

      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it("does not call onRemove when badge itself is clicked", () => {
      const onRemove = vi.fn();
      const { container } = render(
        <TagBadge tag="test-tag" removable={true} onRemove={onRemove} />,
      );

      const badge = container.querySelector(".tag-badge");
      if (badge) {
        fireEvent.click(badge);
      }

      expect(onRemove).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles empty tag string", () => {
      const { container } = render(<TagBadge tag="" />);
      expect(container.querySelector(".tag-badge")).toBeInTheDocument();
    });

    it("handles long tag names", () => {
      const longTag = "very-long-tag-name-that-might-overflow";
      render(<TagBadge tag={longTag} />);
      expect(screen.getByText(longTag)).toBeInTheDocument();
    });

    it("handles special characters in tag", () => {
      const specialTag = "tag-with-special-chars-!@#$%";
      render(<TagBadge tag={specialTag} />);
      expect(screen.getByText(specialTag)).toBeInTheDocument();
    });

    it("handles multiple rapid clicks on remove button", () => {
      const onRemove = vi.fn();
      render(<TagBadge tag="test-tag" removable={true} onRemove={onRemove} />);

      const removeButton = screen.getByRole("button");
      fireEvent.click(removeButton);
      fireEvent.click(removeButton);
      fireEvent.click(removeButton);

      expect(onRemove).toHaveBeenCalledTimes(3);
    });
  });
});
