import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RecordingPanel from "./RecordingPanel";
import { DEFAULT_DEVICE_SETTINGS } from "../../types/settings";
import type { DeviceSettings } from "../../types/settings";

vi.mock("@heroicons/react/24/outline", () => ({
  ChevronDownIcon: (props: Record<string, unknown>) => <span data-testid="chevron" {...props} />,
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const settings = (overrides: Partial<DeviceSettings> = {}): DeviceSettings => ({
  ...DEFAULT_DEVICE_SETTINGS,
  ...overrides,
});

describe("RecordingPanel", () => {
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
    render(<RecordingPanel {...defaultProps} />);
    expect(screen.getByText("Recording")).toBeInTheDocument();
  });

  it("calls onToggle when header is clicked", () => {
    render(<RecordingPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Recording"));
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it("hides content when collapsed", () => {
    const { container } = render(<RecordingPanel {...defaultProps} expanded={false} />);
    const panelContent = container.querySelector(".panel-content");
    expect(panelContent).not.toHaveClass("expanded");
    expect(panelContent).toHaveAttribute("aria-hidden", "true");
  });

  it("has aria-expanded attribute on header", () => {
    render(<RecordingPanel {...defaultProps} />);
    const button = screen.getByRole("button", { name: /Recording/i });
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("shows enable recording checkbox", () => {
    render(<RecordingPanel {...defaultProps} />);
    expect(screen.getByText("Enable Recording")).toBeInTheDocument();
  });

  it("does not show file/format options when recording is disabled", () => {
    render(<RecordingPanel {...defaultProps} settings={settings({ recordingEnabled: false })} />);
    expect(screen.queryByText("Output Filename:")).not.toBeInTheDocument();
    expect(screen.queryByText("Container format:")).not.toBeInTheDocument();
  });

  it("shows file/format options when recording is enabled", () => {
    render(<RecordingPanel {...defaultProps} settings={settings({ recordingEnabled: true })} />);
    expect(screen.getByText("Output Filename:")).toBeInTheDocument();
    expect(screen.getByText("Container format:")).toBeInTheDocument();
  });

  it("toggles recording enabled", () => {
    render(<RecordingPanel {...defaultProps} />);
    const checkbox = screen.getByText("Enable Recording").closest("label")!.querySelector("input")!;
    fireEvent.click(checkbox);
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({ recordingEnabled: true });
  });

  it("changes record format", () => {
    render(<RecordingPanel {...defaultProps} settings={settings({ recordingEnabled: true })} />);
    const select = screen.getByDisplayValue("MP4");
    fireEvent.change(select, { target: { value: "mkv" } });
    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({ recordFormat: "mkv" });
  });

  it("renders browse button when recording is enabled", () => {
    render(<RecordingPanel {...defaultProps} settings={settings({ recordingEnabled: true })} />);
    expect(screen.getByText("Browse")).toBeInTheDocument();
  });

  it("calls invoke when browse is clicked", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValue("/tmp/video.mp4");

    render(
      <RecordingPanel
        {...defaultProps}
        settings={settings({ recordingEnabled: true, recordFormat: "mp4" })}
      />,
    );
    fireEvent.click(screen.getByText("Browse"));

    // Wait for the async invoke to resolve
    await vi.waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("select_save_file");
    });
  });
});
