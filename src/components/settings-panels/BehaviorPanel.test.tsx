import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BehaviorPanel from "./BehaviorPanel";
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

describe("BehaviorPanel", () => {
  const defaultProps = {
    settings: settings(),
    onSettingsChange: vi.fn(),
    expanded: true,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Behavior header", () => {
    render(<BehaviorPanel {...defaultProps} />);
    expect(screen.getByText("Behavior")).toBeInTheDocument();
  });

  it("calls onToggle when header is clicked", () => {
    render(<BehaviorPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Behavior"));
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it("hides content when collapsed", () => {
    const { container } = render(<BehaviorPanel {...defaultProps} expanded={false} />);
    const panelContent = container.querySelector(".panel-content");
    expect(panelContent).not.toHaveClass("expanded");
    expect(panelContent).toHaveAttribute("aria-hidden", "true");
  });

  it("shows all checkboxes when expanded", () => {
    render(<BehaviorPanel {...defaultProps} />);
    expect(screen.getByText("Stay Awake")).toBeInTheDocument();
    expect(screen.getByText("Show Touches")).toBeInTheDocument();
    expect(screen.getByText("Turn Screen Off")).toBeInTheDocument();
  });

  it("calls onSettingsChange with stayAwake when toggled", () => {
    render(<BehaviorPanel {...defaultProps} />);
    const checkbox = screen.getByText("Stay Awake").closest("label")!.querySelector("input")!;
    fireEvent.click(checkbox);
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({ stayAwake: true });
  });

  it("calls onSettingsChange with showTouches when toggled", () => {
    render(<BehaviorPanel {...defaultProps} />);
    const checkbox = screen.getByText("Show Touches").closest("label")!.querySelector("input")!;
    fireEvent.click(checkbox);
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({ showTouches: true });
  });

  it("calls onSettingsChange with turnScreenOff when toggled", () => {
    render(<BehaviorPanel {...defaultProps} />);
    const checkbox = screen.getByText("Turn Screen Off").closest("label")!.querySelector("input")!;
    fireEvent.click(checkbox);
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({ turnScreenOff: true });
  });

  it("reflects current settings values in checkboxes", () => {
    render(
      <BehaviorPanel
        {...defaultProps}
        settings={settings({ stayAwake: true, showTouches: true })}
      />,
    );
    const stayAwakeCheckbox = screen.getByText("Stay Awake").closest("label")!.querySelector("input")!;
    const showTouchesCheckbox = screen.getByText("Show Touches").closest("label")!.querySelector("input")!;
    expect(stayAwakeCheckbox.checked).toBe(true);
    expect(showTouchesCheckbox.checked).toBe(true);
  });
});
