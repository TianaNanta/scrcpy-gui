import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import CommandPreview from "./CommandPreview";
import type { ValidationState } from "../types/validation";

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

  it("renders the Command Preview label", () => {
    render(<CommandPreview command="scrcpy" />);
    expect(screen.getByText("Command Preview:")).toBeInTheDocument();
  });

  it("shows a Copy button", () => {
    render(<CommandPreview command="scrcpy" />);
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("copies to clipboard and shows Copied! on click", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true
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
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("not allowed")),
      },
      writable: true
    });

    const execCommand = vi.fn();
    Object.defineProperty(document, 'execCommand', {
      value: execCommand,
      writable: true
    });

    render(<CommandPreview command="scrcpy -s fallback" />);

    await act(async () => {
      fireEvent.click(screen.getByText("Copy"));
      await Promise.resolve();
      await Promise.resolve(); // Extra tick for the catch path
    });

    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("shows valid status with green checkmark when validation passes", () => {
    const validationState: ValidationState = {
      isValid: true,
      errors: [],
      warnings: [],
      optionStates: {}
    };

    render(<CommandPreview command="scrcpy --max-size=1920" validationState={validationState} />);

    expect(screen.getByText("Valid Command:")).toBeInTheDocument();
    const checkIcon = document.querySelector('.status-icon.valid');
    expect(checkIcon).toBeInTheDocument();
  });

  it("shows error status with red icon when validation has errors", () => {
    const validationState: ValidationState = {
      isValid: false,
      errors: [{ option: 'max-size', message: 'Invalid value', code: 'INVALID_RANGE' }],
      warnings: [],
      optionStates: {}
    };

    render(<CommandPreview command="scrcpy --max-size=-1" validationState={validationState} />);

    expect(screen.getByText("Command Has Errors:")).toBeInTheDocument();
    const errorIcon = document.querySelector('.status-icon.error');
    expect(errorIcon).toBeInTheDocument();
  });

  it("shows warning status with yellow icon when validation has warnings", () => {
    const validationState: ValidationState = {
      isValid: false,
      errors: [],
      warnings: [{ option: 'turn-screen-off', message: 'Conflicts with show-touches', code: 'OPTION_CONFLICT' }],
      optionStates: {}
    };

    render(<CommandPreview command="scrcpy --turn-screen-off --show-touches" validationState={validationState} />);

    expect(screen.getByText("Command Has Warnings:")).toBeInTheDocument();
    const warningIcon = document.querySelector('.status-icon.warning');
    expect(warningIcon).toBeInTheDocument();
  });

  it("shows neutral status when no validation state provided", () => {
    render(<CommandPreview command="scrcpy" />);

    expect(screen.getByText("Command Preview:")).toBeInTheDocument();
    const statusIcon = document.querySelector('.status-icon');
    expect(statusIcon).toBeNull();
  });

  it("highlights invalid options in the command when validation has errors", () => {
    const validationState: ValidationState = {
      isValid: false,
      errors: [{ option: 'max-size', message: 'Invalid value', code: 'INVALID_RANGE' }],
      warnings: [],
      optionStates: {}
    };

    render(<CommandPreview command="scrcpy --max-size=-1 --fullscreen" validationState={validationState} />);

    const invalidSpan = document.querySelector('.command-invalid');
    expect(invalidSpan).toBeInTheDocument();
    expect(invalidSpan?.textContent).toContain('--max-size=-1');
  });
});
