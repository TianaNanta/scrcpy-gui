/**
 * StorageBadge Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StorageBadge } from "./StorageBadge";

describe("StorageBadge", () => {
  it("renders without crashing", () => {
    render(<StorageBadge free={100 * 1024 * 1024} total={500 * 1024 * 1024} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("displays storage usage percentage", () => {
    const free = 100 * 1024 * 1024; // 100MB
    const total = 500 * 1024 * 1024; // 500MB
    render(<StorageBadge free={free} total={total} />);
    const usagePercent = 80; // (500-100)/500 = 80%
    expect(screen.getByText(`${usagePercent}%`)).toBeInTheDocument();
  });

  it("shows green (good) for storage >500MB free", () => {
    const { container } = render(
      <StorageBadge free={1000 * 1024 * 1024} total={2000 * 1024 * 1024} />,
    );
    const badge = container.querySelector(".storage-badge");
    expect(badge).toHaveClass("storage-good");
  });

  it("shows orange (warning) for storage 200-500MB free", () => {
    const { container } = render(
      <StorageBadge free={300 * 1024 * 1024} total={1000 * 1024 * 1024} />,
    );
    const badge = container.querySelector(".storage-badge");
    expect(badge).toHaveClass("storage-warning");
  });

  it("shows red (critical) for storage <200MB free", () => {
    const { container } = render(
      <StorageBadge free={100 * 1024 * 1024} total={1000 * 1024 * 1024} />,
    );
    const badge = container.querySelector(".storage-badge");
    expect(badge).toHaveClass("storage-critical");
  });

  it("displays storage icon", () => {
    render(
      <StorageBadge free={500 * 1024 * 1024} total={1000 * 1024 * 1024} />,
    );
    expect(screen.getByText("💾")).toBeInTheDocument();
  });

  it("shows free space in tooltip", () => {
    const { container } = render(
      <StorageBadge free={250 * 1024 * 1024} total={1000 * 1024 * 1024} />,
    );
    const tooltip = container.querySelector(".storage-tooltip");
    expect(tooltip?.textContent).toContain("Free:");
    expect(tooltip?.textContent).toContain("250.0 MB");
  });

  it("shows used space in tooltip", () => {
    const { container } = render(
      <StorageBadge free={250 * 1024 * 1024} total={1000 * 1024 * 1024} />,
    );
    const tooltip = container.querySelector(".storage-tooltip");
    expect(tooltip?.textContent).toContain("Used:");
    expect(tooltip?.textContent).toContain("750.0 MB");
  });

  it("shows total space in tooltip", () => {
    const { container } = render(
      <StorageBadge free={250 * 1024 * 1024} total={1000 * 1024 * 1024} />,
    );
    const tooltip = container.querySelector(".storage-tooltip");
    expect(tooltip?.textContent).toContain("Total:");
    expect(tooltip?.textContent).toContain("1000.0 MB");
  });

  it("has aria-label for accessibility", () => {
    render(
      <StorageBadge free={500 * 1024 * 1024} total={1000 * 1024 * 1024} />,
    );
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-label", "Storage 50% used");
  });

  it("calls onClick handler when clicked", () => {
    let clicked = false;
    render(
      <StorageBadge
        free={500 * 1024 * 1024}
        total={1000 * 1024 * 1024}
        onClick={() => {
          clicked = true;
        }}
      />,
    );
    const badge = screen.getByRole("status");
    badge.click();
    expect(clicked).toBe(true);
  });

  it("handles zero total gracefully", () => {
    render(<StorageBadge free={0} total={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("formats large storage correctly", () => {
    const { container } = render(
      <StorageBadge
        free={500 * 1024 * 1024 * 1024}
        total={1024 * 1024 * 1024 * 1024}
      />,
    );
    const tooltip = container.querySelector(".storage-tooltip");
    expect(tooltip?.textContent).toContain("500.0 GB");
  });
});
