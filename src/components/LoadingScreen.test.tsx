/**
 * LoadingScreen Tests
 *
 * Tests the LoadingScreen component functionality including rendering,
 * default/custom messages, and accessibility attributes.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingScreen from "./LoadingScreen";

describe("LoadingScreen", () => {
  it("renders with default message", () => {
    render(<LoadingScreen />);
    expect(
      screen.getByText("Initializing scrcpy GUI..."),
    ).toBeInTheDocument();
  });

  it("renders with custom message", () => {
    const customMessage = "Loading devices...";
    render(<LoadingScreen message={customMessage} />);
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it("renders spinner element", () => {
    const { container } = render(<LoadingScreen />);
    expect(container.querySelector(".spinner")).toBeInTheDocument();
  });

  it("has correct accessibility role and attributes", () => {
    const { container } = render(<LoadingScreen />);
    const loadingScreen = container.querySelector(".loading-screen");
    expect(loadingScreen).toHaveAttribute("role", "status");
    expect(loadingScreen).toHaveAttribute("aria-live", "polite");
  });

  it("renders loading container with proper structure", () => {
    const { container } = render(<LoadingScreen />);
    expect(container.querySelector(".loading-container")).toBeInTheDocument();
    expect(container.querySelector(".loading-message")).toBeInTheDocument();
  });

  it("displays full screen overlay", () => {
    const { container } = render(<LoadingScreen />);
    const loadingScreen = container.querySelector(
      ".loading-screen",
    ) as HTMLElement;
    expect(loadingScreen).toHaveClass("loading-screen");
    // Should render as fixed position overlay (verified by CSS class)
    expect(loadingScreen).toBeInTheDocument();
  });
});
