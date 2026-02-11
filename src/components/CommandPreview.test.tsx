import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import CommandPreview from "./CommandPreview";

describe("CommandPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the command text", () => {
    render(<CommandPreview command="scrcpy -s DEV123 --no-audio" />);
    expect(screen.getByText("scrcpy -s DEV123 --no-audio")).toBeInTheDocument();
  });

  it("renders the Generated Command label", () => {
    render(<CommandPreview command="scrcpy" />);
    expect(screen.getByText("Generated Command:")).toBeInTheDocument();
  });

  it("shows a Copy button", () => {
    render(<CommandPreview command="scrcpy" />);
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("copies to clipboard and shows Copied! on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<CommandPreview command="scrcpy -s abc" />);

    await act(async () => {
      fireEvent.click(screen.getByText("Copy"));
      // Let the promise resolve
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith("scrcpy -s abc");
    expect(screen.getByText("Copied!")).toBeInTheDocument();

    // After 2s timeout, should revert to "Copy"
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("uses fallback copy when clipboard API fails", async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("not allowed")),
      },
    });

    const execCommand = vi.fn();
    document.execCommand = execCommand;

    render(<CommandPreview command="scrcpy -s fallback" />);

    await act(async () => {
      fireEvent.click(screen.getByText("Copy"));
      await Promise.resolve();
      await Promise.resolve(); // Extra tick for the catch path
    });

    expect(execCommand).toHaveBeenCalledWith("copy");
  });
});
