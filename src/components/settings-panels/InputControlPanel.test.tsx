import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InputControlPanel from "./InputControlPanel";
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

describe("InputControlPanel", () => {
  const defaultProps = {
    settings: settings(),
    onSettingsChange: vi.fn(),
    expanded: true,
    onToggle: vi.fn(),
    canUhidInput: true,
    canGamepad: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Input & Control header", () => {
    render(<InputControlPanel {...defaultProps} />);
    expect(screen.getByText("Input & Control")).toBeInTheDocument();
  });

  it("calls onToggle when header is clicked", () => {
    render(<InputControlPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Input & Control"));
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it("hides content when collapsed", () => {
    const { container } = render(
      <InputControlPanel {...defaultProps} expanded={false} />,
    );
    const panelContent = container.querySelector(".panel-content");
    expect(panelContent).not.toHaveClass("expanded");
    expect(panelContent).toHaveAttribute("aria-hidden", "true");
  });

  it("shows all input mode labels when expanded", () => {
    render(<InputControlPanel {...defaultProps} />);
    expect(screen.getByText("Keyboard Mode:")).toBeInTheDocument();
    expect(screen.getByText("Mouse Mode:")).toBeInTheDocument();
    expect(screen.getByText("Gamepad Mode:")).toBeInTheDocument();
  });

  it("shows UHID/AOA options when canUhidInput is true", () => {
    render(<InputControlPanel {...defaultProps} />);
    // UHID option should exist for keyboard (there are multiple UHID options for keyboard, mouse, gamepad)
    const uhidOptions = screen.getAllByText(/UHID/);
    expect(uhidOptions.length).toBeGreaterThanOrEqual(3);
  });

  it("hides UHID/AOA keyboard/mouse options when canUhidInput is false", () => {
    render(<InputControlPanel {...defaultProps} canUhidInput={false} />);
    const warnings = screen.getAllByText(/UHID and AOA modes require scrcpy/);
    expect(warnings.length).toBe(2); // One for keyboard, one for mouse
  });

  it("disables gamepad select when canGamepad is false", () => {
    render(<InputControlPanel {...defaultProps} canGamepad={false} />);
    expect(
      screen.getByText(/Gamepad forwarding requires scrcpy ≥ 2.7/),
    ).toBeInTheDocument();
  });

  it("calls onSettingsChange when keyboard mode is changed", () => {
    render(<InputControlPanel {...defaultProps} />);
    const selects = screen.getAllByRole("combobox");
    // First select is keyboard mode
    fireEvent.change(selects[0], { target: { value: "uhid" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      keyboardMode: "uhid",
    });
  });

  it("calls onSettingsChange when mouse mode is changed", () => {
    render(<InputControlPanel {...defaultProps} />);
    const selects = screen.getAllByRole("combobox");
    // Second select is mouse mode
    fireEvent.change(selects[1], { target: { value: "aoa" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      mouseMode: "aoa",
    });
  });

  it("calls onSettingsChange when gamepad mode is changed", () => {
    render(<InputControlPanel {...defaultProps} />);
    const selects = screen.getAllByRole("combobox");
    // Third select is gamepad mode
    fireEvent.change(selects[2], { target: { value: "uhid" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      gamepadMode: "uhid",
    });
  });
});
