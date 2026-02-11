import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DisplayPanel from "./DisplayPanel";
import { DEFAULT_DEVICE_SETTINGS } from "../../types/settings";
import type { DeviceSettings } from "../../types/settings";

// Mock heroicons
vi.mock("@heroicons/react/24/outline", () => ({
  ChevronDownIcon: (props: Record<string, unknown>) => <span data-testid="chevron" {...props} />,
}));

const settings = (overrides: Partial<DeviceSettings> = {}): DeviceSettings => ({
  ...DEFAULT_DEVICE_SETTINGS,
  ...overrides,
});

describe("DisplayPanel", () => {
  const defaultProps = {
    settings: settings(),
    onSettingsChange: vi.fn(),
    expanded: true,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Display & Quality header", () => {
    render(<DisplayPanel {...defaultProps} />);
    expect(screen.getByText("Display & Quality")).toBeInTheDocument();
  });

  it("calls onToggle when header is clicked", () => {
    render(<DisplayPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Display & Quality"));
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it("hides content when collapsed", () => {
    render(<DisplayPanel {...defaultProps} expanded={false} />);
    expect(screen.queryByText("Max Size")).not.toBeInTheDocument();
  });

  it("shows warning when camera source is selected", () => {
    render(
      <DisplayPanel {...defaultProps} settings={settings({ videoSource: "camera" })} />,
    );
    expect(screen.getByText(/not available in camera mode/)).toBeInTheDocument();
  });

  it("shows warning when virtual display is enabled", () => {
    render(
      <DisplayPanel {...defaultProps} settings={settings({ virtualDisplay: true })} />,
    );
    expect(screen.getByText(/not available when virtual display/)).toBeInTheDocument();
  });

  it("does not show warning in normal display mode", () => {
    render(<DisplayPanel {...defaultProps} />);
    expect(screen.queryByText(/not available in camera mode/)).not.toBeInTheDocument();
    expect(screen.queryByText(/not available when virtual display/)).not.toBeInTheDocument();
  });
});
