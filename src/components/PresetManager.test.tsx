import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PresetManager from "./PresetManager";
import type { Preset } from "../types/settings";
import { DEFAULT_DEVICE_SETTINGS } from "../types/settings";

// Mock heroicons
vi.mock("@heroicons/react/24/outline", () => ({
  DocumentTextIcon: (props: Record<string, unknown>) => (
    <span data-testid="doc-icon" {...props} />
  ),
}));

const makePreset = (overrides: Partial<Preset> = {}): Preset => {
  const {
    recordingEnabled: _1,
    recordFile: _2,
    recordFormat: _3,
    ...rest
  } = DEFAULT_DEVICE_SETTINGS;
  const now = new Date();
  return {
    ...rest,
    id: "preset-1",
    name: "Test Preset",
    tags: [],
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

describe("PresetManager", () => {
  const defaultProps = {
    presets: [] as Preset[],
    onSavePreset: vi.fn(),
    onLoadPreset: vi.fn(),
    onDeletePreset: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Presets header", () => {
    render(<PresetManager {...defaultProps} />);
    expect(screen.getByText("Presets")).toBeInTheDocument();
  });

  it("shows empty state message when no presets", () => {
    render(<PresetManager {...defaultProps} />);
    expect(screen.getByText(/No presets saved yet/)).toBeInTheDocument();
  });

  it("renders preset items with Load and Delete buttons", () => {
    const presets = [makePreset({ id: "p1", name: "High Quality" })];
    render(<PresetManager {...defaultProps} presets={presets} />);

    expect(screen.getByText("High Quality")).toBeInTheDocument();
    expect(screen.getByText("Load")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("calls onLoadPreset when Load is clicked", () => {
    const preset = makePreset({ id: "p1", name: "Gaming" });
    render(<PresetManager {...defaultProps} presets={[preset]} />);

    fireEvent.click(screen.getByText("Load"));
    expect(defaultProps.onLoadPreset).toHaveBeenCalledWith(preset);
  });

  it("calls onDeletePreset when Delete is clicked", () => {
    const preset = makePreset({ id: "p1", name: "Old Preset" });
    render(<PresetManager {...defaultProps} presets={[preset]} />);

    fireEvent.click(screen.getByText("Delete"));
    expect(defaultProps.onDeletePreset).toHaveBeenCalledWith("p1");
  });

  it("does not show Delete when onDeletePreset is not provided", () => {
    const preset = makePreset({ id: "p1", name: "Read Only" });
    render(
      <PresetManager
        presets={[preset]}
        onSavePreset={vi.fn()}
        onLoadPreset={vi.fn()}
      />,
    );

    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("calls onSavePreset when Enter is pressed in the input", () => {
    render(<PresetManager {...defaultProps} />);

    const input = screen.getByPlaceholderText("Preset name");
    fireEvent.change(input, { target: { value: "My New Preset" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(defaultProps.onSavePreset).toHaveBeenCalledWith("My New Preset", []);
  });

  it("does not call onSavePreset for empty name on Enter", () => {
    render(<PresetManager {...defaultProps} />);

    const input = screen.getByPlaceholderText("Preset name");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(defaultProps.onSavePreset).not.toHaveBeenCalled();
  });

  it("saves preset with tags", () => {
    render(<PresetManager {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText("Preset name");
    const tagInput = screen.getByPlaceholderText("Add tags (optional)...");
    const saveButton = screen.getByText("Save Preset");

    fireEvent.change(nameInput, { target: { value: "Tagged Preset" } });
    fireEvent.change(tagInput, { target: { value: "gaming" } });
    fireEvent.keyDown(tagInput, { key: "Enter" });
    fireEvent.click(saveButton);

    expect(defaultProps.onSavePreset).toHaveBeenCalledWith("Tagged Preset", ["gaming"]);
  });

  it("renders multiple presets", () => {
    const presets = [
      makePreset({ id: "p1", name: "Preset A" }),
      makePreset({ id: "p2", name: "Preset B" }),
      makePreset({ id: "p3", name: "Preset C" }),
    ];
    render(<PresetManager {...defaultProps} presets={presets} />);

    expect(screen.getByText("Preset A")).toBeInTheDocument();
    expect(screen.getByText("Preset B")).toBeInTheDocument();
    expect(screen.getByText("Preset C")).toBeInTheDocument();
  });

  it("shows export button when onExport is provided", () => {
    render(<PresetManager {...defaultProps} />);

    const exportButton = screen.getByRole("button", { name: /export/i });
    expect(exportButton).toBeInTheDocument();
  });

  it("calls onExport when export button is clicked", () => {
    render(<PresetManager {...defaultProps} />);

    const exportButton = screen.getByRole("button", { name: /export/i });
    fireEvent.click(exportButton);

    expect(defaultProps.onExport).toHaveBeenCalled();
  });

  it("disables export button when no presets exist", () => {
    render(<PresetManager {...defaultProps} />);

    const exportButton = screen.getByRole("button", { name: /export/i });
    expect(exportButton).toBeDisabled();
  });

  it("enables export button when presets exist", () => {
    const presets = [makePreset({ id: "p1", name: "Test Preset" })];
    render(<PresetManager {...defaultProps} presets={presets} />);

    const exportButton = screen.getByRole("button", { name: /export/i });
    expect(exportButton).not.toBeDisabled();
  });

  it("shows import button when onImport is provided", () => {
    render(<PresetManager {...defaultProps} />);

    const importButton = screen.getByRole("button", { name: /import/i });
    expect(importButton).toBeInTheDocument();
  });

  it("calls onImport when import button is clicked", () => {
    render(<PresetManager {...defaultProps} />);

    const importButton = screen.getByRole("button", { name: /import/i });
    fireEvent.click(importButton);

    expect(defaultProps.onImport).toHaveBeenCalled();
  });
});
