import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PerformancePanel from "./PerformancePanel";
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

describe("PerformancePanel", () => {
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
    render(<PerformancePanel {...defaultProps} />);
    expect(screen.getByText("Performance & Quality")).toBeInTheDocument();
  });

  it("calls onToggle when header is clicked", () => {
    render(<PerformancePanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Performance & Quality"));
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it("hides content when collapsed", () => {
    const { container } = render(
      <PerformancePanel {...defaultProps} expanded={false} />,
    );
    const panelContent = container.querySelector(".panel-content");
    expect(panelContent).not.toHaveClass("expanded");
    expect(panelContent).toHaveAttribute("aria-hidden", "true");
  });

  it("has aria-expanded attribute on header", () => {
    render(<PerformancePanel {...defaultProps} expanded={true} />);
    const button = screen.getByRole("button", {
      name: /Performance & Quality/i,
    });
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("changes maxFps", () => {
    render(<PerformancePanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("0 (unlimited)");
    fireEvent.change(input, { target: { value: "60" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({ maxFps: 60 });
  });

  it("changes video codec", () => {
    render(<PerformancePanel {...defaultProps} />);
    const select = screen.getByDisplayValue("H.264 (default)");
    fireEvent.change(select, { target: { value: "h265" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      videoCodec: "h265",
    });
  });

  it("changes video encoder", () => {
    render(<PerformancePanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("Default (auto-select)");
    fireEvent.change(input, {
      target: { value: "OMX.qcom.video.encoder.avc" },
    });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      videoEncoder: "OMX.qcom.video.encoder.avc",
    });
  });

  it("changes video buffer", () => {
    render(<PerformancePanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("0 (disabled)");
    fireEvent.change(input, { target: { value: "50" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      videoBuffer: 50,
    });
  });

  it("toggles power off on close", () => {
    render(<PerformancePanel {...defaultProps} />);
    const checkbox = screen
      .getByText("Power Off on Close")
      .closest("label")!
      .querySelector("input")!;
    fireEvent.click(checkbox);
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      powerOffOnClose: true,
    });
  });

  it("toggles no power on", () => {
    render(<PerformancePanel {...defaultProps} />);
    const checkbox = screen
      .getByText("Don't Power On")
      .closest("label")!
      .querySelector("input")!;
    fireEvent.click(checkbox);
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      noPowerOn: true,
    });
  });
});
