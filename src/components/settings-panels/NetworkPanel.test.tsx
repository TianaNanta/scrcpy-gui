import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NetworkPanel from "./NetworkPanel";
import { DEFAULT_DEVICE_SETTINGS } from "../../types/settings";
import type { DeviceSettings } from "../../types/settings";

// Mock heroicons
vi.mock("@heroicons/react/24/outline", () => ({
  ChevronDownIcon: (props: Record<string, unknown>) => (
    <span data-testid="chevron" {...props} />
  ),
}));

const settings = (overrides: Partial<DeviceSettings> = {}): DeviceSettings => ({
  ...DEFAULT_DEVICE_SETTINGS,
  ...overrides,
});

describe("NetworkPanel", () => {
  const defaultProps = {
    settings: settings(),
    onSettingsChange: vi.fn(),
    expanded: true,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Network & Connection header", () => {
    render(<NetworkPanel {...defaultProps} />);
    expect(screen.getByText("Network & Connection")).toBeInTheDocument();
  });

  it("calls onToggle when header is clicked", () => {
    render(<NetworkPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Network & Connection"));
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it("hides content when collapsed", () => {
    const { container } = render(
      <NetworkPanel {...defaultProps} expanded={false} />,
    );
    const panelContent = container.querySelector(".panel-content");
    expect(panelContent).not.toHaveClass("expanded");
    expect(panelContent).toHaveAttribute("aria-hidden", "true");
  });

  it("renders time limit input", () => {
    render(<NetworkPanel {...defaultProps} />);
    expect(screen.getByText(/Time Limit/)).toBeInTheDocument();
  });

  it("calls onSettingsChange when noCleanup is toggled", () => {
    render(<NetworkPanel {...defaultProps} />);
    const checkbox = screen
      .getByText("No Cleanup")
      .closest("label")!
      .querySelector("input")!;
    fireEvent.click(checkbox);
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      noCleanup: true,
    });
  });

  it("calls onSettingsChange when forceAdbForward is toggled", () => {
    render(<NetworkPanel {...defaultProps} />);
    const checkbox = screen
      .getByText("Force ADB Forward")
      .closest("label")!
      .querySelector("input")!;
    fireEvent.click(checkbox);
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      forceAdbForward: true,
    });
  });
});
