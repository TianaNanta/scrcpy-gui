/**
 * TagInput Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TagInput from "./TagInput";

describe("TagInput", () => {
  describe("rendering", () => {
    it("renders without crashing", () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders initial tags", () => {
      const onChange = vi.fn();
      const tags = ["tag1", "tag2", "tag3"];
      render(<TagInput tags={tags} onChange={onChange} />);

      tags.forEach((tag) => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });

    it("renders input with placeholder when no tags", () => {
      const onChange = vi.fn();
      render(
        <TagInput tags={[]} onChange={onChange} placeholder="Add tags..." />,
      );
      expect(screen.getByPlaceholderText("Add tags...")).toBeInTheDocument();
    });

    it("does not show placeholder when tags exist", () => {
      const onChange = vi.fn();
      render(
        <TagInput
          tags={["tag1"]}
          onChange={onChange}
          placeholder="Add tags..."
        />,
      );
      expect(
        screen.queryByPlaceholderText("Add tags..."),
      ).not.toBeInTheDocument();
    });

    it("hides input when max tags reached", () => {
      const onChange = vi.fn();
      const tags = ["tag1", "tag2", "tag3"];
      render(<TagInput tags={tags} onChange={onChange} maxTags={3} />);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("shows input when under max tags", () => {
      const onChange = vi.fn();
      const tags = ["tag1", "tag2"];
      render(<TagInput tags={tags} onChange={onChange} maxTags={5} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders remove button for each tag", () => {
      const onChange = vi.fn();
      const tags = ["tag1", "tag2"];
      render(<TagInput tags={tags} onChange={onChange} />);

      const removeButtons = screen.getAllByRole("button");
      expect(removeButtons).toHaveLength(2);
    });
  });

  describe("interactions", () => {
    it("adds tag on Enter key", () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "new-tag" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onChange).toHaveBeenCalledWith(["new-tag"]);
    });

    it("clears input after adding tag", () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "new-tag" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(input.value).toBe("");
    });

    it("adds tag on comma key", () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "new-tag" } });
      fireEvent.keyDown(input, { key: "," });

      expect(onChange).toHaveBeenCalledWith(["new-tag"]);
    });

    it("trims whitespace from tag", () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "  spaced-tag  " } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onChange).toHaveBeenCalledWith(["spaced-tag"]);
    });

    it("does not add empty tag", () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "   " } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not add duplicate tag", () => {
      const onChange = vi.fn();
      render(<TagInput tags={["existing-tag"]} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "existing-tag" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("removes tag when remove button is clicked", () => {
      const onChange = vi.fn();
      const tags = ["tag1", "tag2", "tag3"];
      render(<TagInput tags={tags} onChange={onChange} />);

      const removeButtons = screen.getAllByRole("button");
      fireEvent.click(removeButtons[1]);

      expect(onChange).toHaveBeenCalledWith(["tag1", "tag3"]);
    });

    it("removes last tag on Backspace when input is empty", () => {
      const onChange = vi.fn();
      const tags = ["tag1", "tag2"];
      render(<TagInput tags={tags} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.keyDown(input, { key: "Backspace" });

      expect(onChange).toHaveBeenCalledWith(["tag1"]);
    });

    it("does not remove tag on Backspace when input has content", () => {
      const onChange = vi.fn();
      const tags = ["tag1", "tag2"];
      render(<TagInput tags={tags} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "typing" } });
      fireEvent.keyDown(input, { key: "Backspace" });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not add tag when max tags reached", () => {
      const onChange = vi.fn();
      const tags = ["tag1", "tag2", "tag3"];
      render(<TagInput tags={tags} onChange={onChange} maxTags={3} />);

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("focuses input when container is clicked", () => {
      const onChange = vi.fn();
      const { container } = render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      const focusSpy = vi.spyOn(input, "focus");

      const tagContainer = container.querySelector(".tag-input-container");
      if (tagContainer) {
        fireEvent.click(tagContainer);
      }

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles empty tags array", () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("handles single tag", () => {
      const onChange = vi.fn();
      render(<TagInput tags={["only-tag"]} onChange={onChange} />);
      expect(screen.getByText("only-tag")).toBeInTheDocument();
    });

    it("handles special characters in tag", () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "tag-with-special!@#" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onChange).toHaveBeenCalledWith(["tag-with-special!@#"]);
    });

    it("handles removing all tags", () => {
      const onChange = vi.fn();
      const tags = ["tag1"];
      render(<TagInput tags={tags} onChange={onChange} />);

      const removeButton = screen.getByRole("button");
      fireEvent.click(removeButton);

      expect(onChange).toHaveBeenCalledWith([]);
    });

    it("handles rapid tag additions", () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);

      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "tag1" } });
      fireEvent.keyDown(input, { key: "Enter" });

      fireEvent.change(input, { target: { value: "tag2" } });
      fireEvent.keyDown(input, { key: "Enter" });

      fireEvent.change(input, { target: { value: "tag3" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it("has correct accessible label for input", () => {
      const onChange = vi.fn();
      render(<TagInput tags={[]} onChange={onChange} />);
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-label",
        "Add tags",
      );
    });

    it("has correct accessible label for remove buttons", () => {
      const onChange = vi.fn();
      render(<TagInput tags={["my-tag"]} onChange={onChange} />);
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Remove tag my-tag",
      );
    });
  });
});
