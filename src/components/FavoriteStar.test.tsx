/**
 * FavoriteStar Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FavoriteStar from "./FavoriteStar";

describe("FavoriteStar", () => {
  describe("rendering", () => {
    it("renders without crashing", () => {
      const onToggle = vi.fn();
      render(<FavoriteStar isFavorite={false} onToggle={onToggle} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders as filled star when isFavorite is true", () => {
      const onToggle = vi.fn();
      const { container } = render(
        <FavoriteStar isFavorite={true} onToggle={onToggle} />,
      );
      expect(container.querySelector(".favorite-star")).toHaveClass("favorite");
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Remove from favorites",
      );
    });

    it("renders as outline star when isFavorite is false", () => {
      const onToggle = vi.fn();
      const { container } = render(
        <FavoriteStar isFavorite={false} onToggle={onToggle} />,
      );
      expect(container.querySelector(".favorite-star")).not.toHaveClass(
        "favorite",
      );
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Add to favorites",
      );
    });

    it("applies correct size class for sm size", () => {
      const onToggle = vi.fn();
      const { container } = render(
        <FavoriteStar isFavorite={false} onToggle={onToggle} size="sm" />,
      );
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("w-4", "h-4");
    });

    it("applies correct size class for md size (default)", () => {
      const onToggle = vi.fn();
      const { container } = render(
        <FavoriteStar isFavorite={false} onToggle={onToggle} size="md" />,
      );
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("w-5", "h-5");
    });

    it("applies correct size class for lg size", () => {
      const onToggle = vi.fn();
      const { container } = render(
        <FavoriteStar isFavorite={false} onToggle={onToggle} size="lg" />,
      );
      const icon = container.querySelector("svg");
      expect(icon).toHaveClass("w-6", "h-6");
    });
  });

  describe("interactions", () => {
    it("calls onToggle when clicked", () => {
      const onToggle = vi.fn();
      render(<FavoriteStar isFavorite={false} onToggle={onToggle} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("calls onToggle when clicking on favorite state", () => {
      const onToggle = vi.fn();
      render(<FavoriteStar isFavorite={true} onToggle={onToggle} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("has correct accessible name when not favorite", () => {
      const onToggle = vi.fn();
      render(<FavoriteStar isFavorite={false} onToggle={onToggle} />);

      expect(screen.getByRole("button")).toHaveAccessibleName(
        "Add to favorites",
      );
    });

    it("has correct accessible name when favorite", () => {
      const onToggle = vi.fn();
      render(<FavoriteStar isFavorite={true} onToggle={onToggle} />);

      expect(screen.getByRole("button")).toHaveAccessibleName(
        "Remove from favorites",
      );
    });
  });

  describe("edge cases", () => {
    it("handles rapid clicks without issues", () => {
      const onToggle = vi.fn();
      render(<FavoriteStar isFavorite={false} onToggle={onToggle} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onToggle).toHaveBeenCalledTimes(3);
    });

    it("applies inline style for button", () => {
      const onToggle = vi.fn();
      render(<FavoriteStar isFavorite={true} onToggle={onToggle} />);

      const button = screen.getByRole("button");
      expect(button.style.background).toContain("none");
      expect(button.style.border).toContain("none");
    });
  });
});
