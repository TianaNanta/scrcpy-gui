import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import VirtualDisplayPanel from "./VirtualDisplayPanel";
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

describe("VirtualDisplayPanel", () => {
  const defaultProps = {
    settings: settings(),
    onSettingsChange: vi.fn(),
    expanded: true,
    onToggle: vi.fn(),
    canVirtualDisplay: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Virtual Display header", () => {
    render(<VirtualDisplayPanel {...defaultProps} />);
    expect(screen.getByText("Virtual Display")).toBeInTheDocument();
  });

  it("calls onToggle when header is clicked", () => {
    render(<VirtualDisplayPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Virtual Display"));
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it("hides content when collapsed", () => {
    const { container } = render(
      <VirtualDisplayPanel {...defaultProps} expanded={false} />,
    );
    const panelContent = container.querySelector(".panel-content");
    expect(panelContent).not.toHaveClass("expanded");
    expect(panelContent).toHaveAttribute("aria-hidden", "true");
  });

  it("shows version warning when canVirtualDisplay is false", () => {
    render(<VirtualDisplayPanel {...defaultProps} canVirtualDisplay={false} />);
    expect(
      screen.getByText(/Virtual display requires scrcpy ≥ 3.0/),
    ).toBeInTheDocument();
  });

  it("does not show version warning when canVirtualDisplay is true", () => {
    render(<VirtualDisplayPanel {...defaultProps} canVirtualDisplay={true} />);
    expect(
      screen.queryByText(/Virtual display requires scrcpy/),
    ).not.toBeInTheDocument();
  });

  it("checkbox is disabled when canVirtualDisplay is false", () => {
    render(<VirtualDisplayPanel {...defaultProps} canVirtualDisplay={false} />);
    const checkbox = screen
      .getByText("Enable Virtual Display")
      .closest("label")!
      .querySelector("input")!;
    expect(checkbox.disabled).toBe(true);
  });

  it("toggles virtualDisplay setting", () => {
    render(<VirtualDisplayPanel {...defaultProps} />);
    const checkbox = screen
      .getByText("Enable Virtual Display")
      .closest("label")!
      .querySelector("input")!;
    fireEvent.click(checkbox);
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      virtualDisplay: true,
    });
  });

  it("shows resolution and DPI inputs when virtualDisplay is enabled", () => {
    render(
      <VirtualDisplayPanel
        {...defaultProps}
        settings={settings({ virtualDisplay: true })}
      />,
    );
    expect(screen.getByText("Resolution:")).toBeInTheDocument();
    expect(screen.getByText("DPI:")).toBeInTheDocument();
  });

  it("hides resolution and DPI inputs when virtualDisplay is disabled", () => {
    render(
      <VirtualDisplayPanel
        {...defaultProps}
        settings={settings({ virtualDisplay: false })}
      />,
    );
    expect(screen.queryByText("Resolution:")).not.toBeInTheDocument();
    expect(screen.queryByText("DPI:")).not.toBeInTheDocument();
  });
});
