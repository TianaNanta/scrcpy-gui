import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import V4L2Panel from "./V4L2Panel";
import { DEFAULT_DEVICE_SETTINGS } from "../../types/settings";
import type { DeviceSettings } from "../../types/settings";

vi.mock("@heroicons/react/24/outline", () => ({
  ChevronDownIcon: (props: Record<string, unknown>) => (
    <span data-testid="chevron" {...props} />
  ),
}));

const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

const settings = (overrides: Partial<DeviceSettings> = {}): DeviceSettings => ({
  ...DEFAULT_DEVICE_SETTINGS,
  ...overrides,
});

describe("V4L2Panel", () => {
  const defaultProps = {
    settings: settings(),
    onSettingsChange: vi.fn(),
    expanded: true,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue([]);
  });

  it("renders the header", () => {
    render(<V4L2Panel {...defaultProps} />);
    expect(screen.getByText("V4L2 Virtual Webcam")).toBeInTheDocument();
  });

  it("calls onToggle when header is clicked", () => {
    render(<V4L2Panel {...defaultProps} />);
    fireEvent.click(screen.getByText("V4L2 Virtual Webcam"));
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it("hides content when collapsed", () => {
    const { container } = render(
      <V4L2Panel {...defaultProps} expanded={false} />,
    );
    const panelContent = container.querySelector(".panel-content");
    expect(panelContent).not.toHaveClass("expanded");
    expect(panelContent).toHaveAttribute("aria-hidden", "true");
  });

  it("has aria-expanded attribute on header", () => {
    render(<V4L2Panel {...defaultProps} />);
    const button = screen.getByRole("button", { name: /V4L2 Virtual Webcam/i });
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("lists V4L2 devices when expanded", async () => {
    mockInvoke.mockResolvedValue(["/dev/video0", "/dev/video1"]);

    render(<V4L2Panel {...defaultProps} />);

    expect(mockInvoke).toHaveBeenCalledWith("list_v4l2_devices");

    await waitFor(() => {
      expect(screen.getByText("/dev/video0")).toBeInTheDocument();
      expect(screen.getByText("/dev/video1")).toBeInTheDocument();
    });
  });

  it("shows 'no devices' message when list is empty", () => {
    render(<V4L2Panel {...defaultProps} />);
    expect(screen.getByText(/No V4L2 devices found/)).toBeInTheDocument();
  });

  it("shows Disabled option", () => {
    render(<V4L2Panel {...defaultProps} />);
    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("changes v4l2 sink", async () => {
    mockInvoke.mockResolvedValue(["/dev/video0", "/dev/video1"]);
    render(<V4L2Panel {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("/dev/video0")).toBeInTheDocument();
    });

    const select = screen.getByDisplayValue("Disabled");
    fireEvent.change(select, { target: { value: "/dev/video0" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      v4l2Sink: "/dev/video0",
    });
  });

  it("does not show buffer and noPlayback when sink is empty", () => {
    render(
      <V4L2Panel {...defaultProps} settings={settings({ v4l2Sink: "" })} />,
    );
    expect(screen.queryByText("V4L2 Buffer (ms):")).not.toBeInTheDocument();
    expect(screen.queryByText("No Playback")).not.toBeInTheDocument();
  });

  it("shows buffer and noPlayback when sink is set", () => {
    render(
      <V4L2Panel
        {...defaultProps}
        settings={settings({ v4l2Sink: "/dev/video0" })}
      />,
    );
    expect(screen.getByText("V4L2 Buffer (ms):")).toBeInTheDocument();
    expect(screen.getByText("No Playback")).toBeInTheDocument();
  });

  it("changes v4l2 buffer", () => {
    render(
      <V4L2Panel
        {...defaultProps}
        settings={settings({ v4l2Sink: "/dev/video0" })}
      />,
    );
    const input = screen.getByPlaceholderText("0 (disabled)");
    fireEvent.change(input, { target: { value: "100" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      v4l2Buffer: 100,
    });
  });

  it("toggles no playback", () => {
    render(
      <V4L2Panel
        {...defaultProps}
        settings={settings({ v4l2Sink: "/dev/video0" })}
      />,
    );
    const checkbox = screen
      .getByText("No Playback")
      .closest("label")!
      .querySelector("input")!;
    fireEvent.click(checkbox);
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      noPlayback: true,
    });
  });
});
