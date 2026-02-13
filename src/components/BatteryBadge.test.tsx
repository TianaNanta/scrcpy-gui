/**
 * BatteryBadge Component Tests
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BatteryBadge } from "./BatteryBadge";

describe("BatteryBadge", () => {
  it("renders without crashing", () => {
    render(<BatteryBadge percentage={50} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("displays battery percentage", () => {
    render(<BatteryBadge percentage={75} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("shows green (good) for battery >10%", () => {
    const { container } = render(<BatteryBadge percentage={50} />);
    const badge = container.querySelector(".battery-badge");
    expect(badge).toHaveClass("battery-good");
  });

  it("shows orange (warning) for battery 5-10%", () => {
    const { container } = render(<BatteryBadge percentage={8} />);
    const badge = container.querySelector(".battery-badge");
    expect(badge).toHaveClass("battery-warning");
  });

  it("shows red (critical) for battery <=5%", () => {
    const { container } = render(<BatteryBadge percentage={3} />);
    const badge = container.querySelector(".battery-badge");
    expect(badge).toHaveClass("battery-critical");
  });

  it("displays charging icon when charging", () => {
    render(<BatteryBadge percentage={50} isCharging={true} />);
    expect(screen.getByText("🔌")).toBeInTheDocument();
  });

  it("displays discharging icon when not charging", () => {
    render(<BatteryBadge percentage={50} isCharging={false} />);
    expect(screen.getByText("🔋")).toBeInTheDocument();
  });

  it("shows charging indicator when charging", () => {
    render(<BatteryBadge percentage={50} isCharging={true} />);
    expect(screen.getByText("⚡")).toBeInTheDocument();
  });

  it("displays temperature in tooltip", () => {
    const { container } = render(
      <BatteryBadge percentage={50} temperature={35} />,
    );
    const tooltip = container.querySelector(".battery-tooltip");
    expect(tooltip?.textContent).toContain("Temperature: 35°C");
  });

  it("displays health status in tooltip", () => {
    const { container } = render(
      <BatteryBadge percentage={50} health="good" />,
    );
    const tooltip = container.querySelector(".battery-tooltip");
    expect(tooltip?.textContent).toContain("Health: good");
  });

  it("has aria-label for accessibility", () => {
    render(<BatteryBadge percentage={75} />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Battery 75%",
    );
  });

  it("calls onClick handler when clicked", () => {
    let clicked = false;
    render(
      <BatteryBadge
        percentage={50}
        onClick={() => {
          clicked = true;
        }}
      />,
    );
    const badge = screen.getByRole("status");
    badge.click();
    expect(clicked).toBe(true);
  });

  it("renders all values together", () => {
    render(
      <BatteryBadge
        percentage={42}
        isCharging={true}
        temperature={32}
        health="warm"
      />,
    );
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByText("🔌")).toBeInTheDocument();
    expect(screen.getByText("⚡")).toBeInTheDocument();
  });
});
