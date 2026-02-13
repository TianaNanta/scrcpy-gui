import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WindowPanel from "./WindowPanel";
import { DEFAULT_DEVICE_SETTINGS } from "../../types/settings";
import type { DeviceSettings } from "../../types/settings";

vi.mock("@heroicons/react/24/outline", () => ({
  ChevronDownIcon: (props: Record<string, unknown>) => (
    <span data-testid="chevron" {...props} />
  ),
}));

const settings = (overrides: Partial<DeviceSettings> = {}): DeviceSettings => ({
  ...DEFAULT_DEVICE_SETTINGS,
  ...overrides,
});

describe("WindowPanel", () => {
  const defaultProps = {
    settings: settings(),
    onSettingsChange: vi.fn(),
    expanded: true,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the header", () => {
    render(<WindowPanel {...defaultProps} />);
    expect(screen.getByText("Window Management")).toBeInTheDocument();
  });

  it("calls onToggle when header is clicked", () => {
    render(<WindowPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Window Management"));
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it("hides content when collapsed", () => {
    const { container } = render(
      <WindowPanel {...defaultProps} expanded={false} />,
    );
    const panelContent = container.querySelector(".panel-content");
    expect(panelContent).not.toHaveClass("expanded");
    expect(panelContent).toHaveAttribute("aria-hidden", "true");
  });

  it("has aria-expanded attribute on header", () => {
    render(<WindowPanel {...defaultProps} />);
    const button = screen.getByRole("button", { name: /Window Management/i });
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("changes window X position", () => {
    render(<WindowPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("X");
    fireEvent.change(input, { target: { value: "100" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      windowX: 100,
    });
  });

  it("changes window Y position", () => {
    render(<WindowPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("Y");
    fireEvent.change(input, { target: { value: "200" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      windowY: 200,
    });
  });

  it("changes window width", () => {
    render(<WindowPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("Width");
    fireEvent.change(input, { target: { value: "800" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      windowWidth: 800,
    });
  });

  it("changes window height", () => {
    render(<WindowPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("Height");
    fireEvent.change(input, { target: { value: "600" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      windowHeight: 600,
    });
  });

  it("toggles always on top", () => {
    render(<WindowPanel {...defaultProps} />);
    const checkbox = screen
      .getByText("Always on Top")
      .closest("label")!
      .querySelector("input")!;
    fireEvent.click(checkbox);
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      alwaysOnTop: true,
    });
  });

  it("toggles borderless window", () => {
    render(<WindowPanel {...defaultProps} />);
    const checkbox = screen
      .getByText("Borderless Window")
      .closest("label")!
      .querySelector("input")!;
    fireEvent.click(checkbox);
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      windowBorderless: true,
    });
  });

  it("changes window title", () => {
    render(<WindowPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("Default (device model)");
    fireEvent.change(input, { target: { value: "My Device" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      windowTitle: "My Device",
    });
  });

  it("toggles fullscreen", () => {
    render(<WindowPanel {...defaultProps} />);
    const checkbox = screen
      .getByText("Fullscreen Mode")
      .closest("label")!
      .querySelector("input")!;
    fireEvent.click(checkbox);
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      fullscreen: true,
    });
  });
});
