import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import VideoSourcePanel from "./VideoSourcePanel";
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

describe("VideoSourcePanel", () => {
  const defaultProps = {
    settings: settings(),
    onSettingsChange: vi.fn(),
    expanded: true,
    onToggle: vi.fn(),
    canCamera: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the header", () => {
    render(<VideoSourcePanel {...defaultProps} />);
    expect(screen.getByText("Video Source")).toBeInTheDocument();
  });

  it("calls onToggle when header is clicked", () => {
    render(<VideoSourcePanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Video Source"));
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it("hides content when collapsed", () => {
    const { container } = render(
      <VideoSourcePanel {...defaultProps} expanded={false} />,
    );
    const panelContent = container.querySelector(".panel-content");
    expect(panelContent).not.toHaveClass("expanded");
    expect(panelContent).toHaveAttribute("aria-hidden", "true");
  });

  it("has aria-expanded attribute on header", () => {
    render(<VideoSourcePanel {...defaultProps} />);
    const button = screen.getByRole("button", { name: /Video Source/i });
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("shows version warning when canCamera is false", () => {
    render(<VideoSourcePanel {...defaultProps} canCamera={false} />);
    expect(
      screen.getByText(/Camera mirroring requires scrcpy ≥ 2.2/),
    ).toBeInTheDocument();
  });

  it("does not show version warning when canCamera is true", () => {
    render(<VideoSourcePanel {...defaultProps} canCamera={true} />);
    expect(
      screen.queryByText(/Camera mirroring requires/),
    ).not.toBeInTheDocument();
  });

  it("shows camera option when canCamera is true", () => {
    render(<VideoSourcePanel {...defaultProps} canCamera={true} />);
    expect(screen.getByText("Camera")).toBeInTheDocument();
  });

  it("does not show camera option when canCamera is false", () => {
    render(<VideoSourcePanel {...defaultProps} canCamera={false} />);
    expect(
      screen.queryByRole("option", { name: "Camera" }),
    ).not.toBeInTheDocument();
  });

  it("does not show camera fields when display is selected", () => {
    render(
      <VideoSourcePanel
        {...defaultProps}
        settings={settings({ videoSource: "display" })}
      />,
    );
    expect(screen.queryByText("Camera Facing:")).not.toBeInTheDocument();
    expect(screen.queryByText("Camera Size:")).not.toBeInTheDocument();
    expect(screen.queryByText("Camera ID:")).not.toBeInTheDocument();
  });

  it("shows camera fields when camera is selected", () => {
    render(
      <VideoSourcePanel
        {...defaultProps}
        settings={settings({ videoSource: "camera" })}
      />,
    );
    expect(screen.getByText("Camera Facing:")).toBeInTheDocument();
    expect(screen.getByText("Camera Size:")).toBeInTheDocument();
    expect(screen.getByText("Camera ID:")).toBeInTheDocument();
  });

  it("changes video source", () => {
    render(<VideoSourcePanel {...defaultProps} />);
    const select = screen.getByDisplayValue("Display (screen mirroring)");
    fireEvent.change(select, { target: { value: "camera" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({ videoSource: "camera" }),
    );
  });

  it("resets camera fields when switching back to display", () => {
    render(
      <VideoSourcePanel
        {...defaultProps}
        settings={settings({ videoSource: "camera" })}
      />,
    );
    const select = screen.getByDisplayValue("Camera");
    fireEvent.change(select, { target: { value: "display" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        videoSource: "display",
        cameraFacing: "front",
        cameraSize: "",
        cameraId: "",
      }),
    );
  });

  it("changes camera facing", () => {
    render(
      <VideoSourcePanel
        {...defaultProps}
        settings={settings({ videoSource: "camera" })}
      />,
    );
    const select = screen.getByDisplayValue("Front");
    fireEvent.change(select, { target: { value: "back" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      cameraFacing: "back",
    });
  });

  it("changes camera size", () => {
    render(
      <VideoSourcePanel
        {...defaultProps}
        settings={settings({ videoSource: "camera" })}
      />,
    );
    const input = screen.getByPlaceholderText("1920x1080");
    fireEvent.change(input, { target: { value: "1280x720" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      cameraSize: "1280x720",
    });
  });

  it("changes camera ID", () => {
    render(
      <VideoSourcePanel
        {...defaultProps}
        settings={settings({ videoSource: "camera" })}
      />,
    );
    const input = screen.getByPlaceholderText("Auto (leave empty)");
    fireEvent.change(input, { target: { value: "2" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
      cameraId: "2",
    });
  });
});
