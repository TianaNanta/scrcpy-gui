import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PresetCard from "./PresetCard";
import type { Preset } from "../types/settings";

function createMockPreset(overrides: Partial<Preset> = {}): Preset {
  const now = new Date();
  return {
    id: "preset-1",
    name: "Test Preset",
    bitrate: 8000000,
    maxSize: 1920,
    maxFps: 60,
    videoCodec: "h264" as const,
    videoEncoder: "",
    videoBuffer: 0,
    videoSource: "display" as const,
    cameraFacing: "front" as const,
    cameraSize: "",
    cameraId: "",
    audioForwarding: true,
    audioBitrate: 128000,
    audioCodec: "opus" as const,
    microphoneForwarding: false,
    noAudio: false,
    noVideo: false,
    noPlayback: false,
    displayId: 0,
    rotation: 0,
    crop: "",
    lockVideoOrientation: -1,
    displayBuffer: 0,
    windowX: 0,
    windowY: 0,
    windowWidth: 0,
    windowHeight: 0,
    alwaysOnTop: false,
    windowBorderless: false,
    fullscreen: false,
    windowTitle: "",
    noControl: false,
    turnScreenOff: false,
    stayAwake: false,
    showTouches: false,
    powerOffOnClose: false,
    noPowerOn: false,
    keyboardMode: "default" as const,
    mouseMode: "default" as const,
    gamepadMode: "disabled" as const,
    v4l2Sink: "",
    v4l2Buffer: 0,
    virtualDisplay: false,
    virtualDisplayResolution: "",
    virtualDisplayDpi: 0,
    startApp: "",
    otgMode: false,
    noCleanup: false,
    forceAdbForward: false,
    timeLimit: 0,
    ipAddress: "",
    port: 5555,
    tags: [],
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("PresetCard", () => {
  const defaultProps = {
    preset: createMockPreset(),
    onLoad: vi.fn(),
    onDelete: vi.fn(),
    onToggleFavorite: vi.fn(),
  };

  it("renders preset name and actions", () => {
    render(<PresetCard {...defaultProps} />);

    expect(screen.getByText("Test Preset")).toBeInTheDocument();
    expect(screen.getByText("Load")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("calls onLoad when Load button is clicked", () => {
    render(<PresetCard {...defaultProps} />);

    const loadButton = screen.getByText("Load");
    fireEvent.click(loadButton);

    expect(defaultProps.onLoad).toHaveBeenCalled();
  });

  it("calls onDelete when Delete button is clicked", () => {
    render(<PresetCard {...defaultProps} />);

    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    expect(defaultProps.onDelete).toHaveBeenCalled();
  });

  it("shows favorite star when onToggleFavorite is provided", () => {
    render(<PresetCard {...defaultProps} />);

    const starButton = screen.getByLabelText("Add to favorites");
    expect(starButton).toBeInTheDocument();
  });

  it("calls onToggleFavorite when star is clicked", () => {
    render(<PresetCard {...defaultProps} />);

    const starButton = screen.getByLabelText("Add to favorites");
    fireEvent.click(starButton);

    expect(defaultProps.onToggleFavorite).toHaveBeenCalled();
  });

  it("shows filled star for favorite presets", () => {
    const favoritePreset = createMockPreset({ isFavorite: true });
    render(<PresetCard {...defaultProps} preset={favoritePreset} />);

    const starButton = screen.getByLabelText("Remove from favorites");
    expect(starButton).toBeInTheDocument();
  });

  it("displays tags when preset has tags", () => {
    const presetWithTags = createMockPreset({ tags: ["gaming", "high-quality"] });
    render(<PresetCard {...defaultProps} preset={presetWithTags} />);

    expect(screen.getByText("gaming")).toBeInTheDocument();
    expect(screen.getByText("high-quality")).toBeInTheDocument();
  });

  it("does not show Delete button when onDelete is not provided", () => {
    render(<PresetCard {...defaultProps} onDelete={undefined} />);

    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("does not show favorite star when onToggleFavorite is not provided", () => {
    render(<PresetCard {...defaultProps} onToggleFavorite={undefined} />);

    expect(screen.queryByLabelText("Add to favorites")).not.toBeInTheDocument();
  });
});