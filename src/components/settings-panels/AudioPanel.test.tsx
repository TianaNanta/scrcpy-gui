import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AudioPanel from "./AudioPanel";
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

describe("AudioPanel", () => {
  const defaultProps = {
    settings: settings(),
    onSettingsChange: vi.fn(),
    expanded: true,
    onToggle: vi.fn(),
    canAudio: true,
    canNoVideo: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Audio header", () => {
    render(<AudioPanel {...defaultProps} />);
    expect(screen.getByText("Audio")).toBeInTheDocument();
  });

  it("calls onToggle when header is clicked", () => {
    render(<AudioPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Audio"));
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it("hides content when collapsed", () => {
    const { container } = render(<AudioPanel {...defaultProps} expanded={false} />);
    const panelContent = container.querySelector(".panel-content");
    expect(panelContent).not.toHaveClass("expanded");
    expect(panelContent).toHaveAttribute("aria-hidden", "true");
  });

  it("shows version warning when canAudio is false", () => {
    render(<AudioPanel {...defaultProps} canAudio={false} />);
    expect(screen.getByText(/Audio forwarding requires scrcpy ≥ 2.0/)).toBeInTheDocument();
  });

  it("does not show version warning when canAudio is true", () => {
    render(<AudioPanel {...defaultProps} canAudio={true} />);
    expect(screen.queryByText(/Audio forwarding requires/)).not.toBeInTheDocument();
  });

  it("renders audio forwarding checkbox", () => {
    render(<AudioPanel {...defaultProps} />);
    expect(screen.getByText("Enable Audio Forwarding")).toBeInTheDocument();
  });

  it("toggles audio forwarding", () => {
    render(
      <AudioPanel {...defaultProps} settings={settings({ audioForwarding: true })} />,
    );
    const checkbox = screen.getByText("Enable Audio Forwarding").closest("label")!.querySelector("input")!;
    fireEvent.click(checkbox);
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ audioForwarding: false }),
    );
  });
});
