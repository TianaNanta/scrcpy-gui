import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SettingsPage from "./SettingsPage";
import type { ColorScheme, Theme } from "../types/settings";

// Mock heroicons
vi.mock("@heroicons/react/24/outline", () => ({
  AdjustmentsHorizontalIcon: (props: Record<string, unknown>) => <span data-testid="adjust-icon" {...props} />,
}));

describe("SettingsPage", () => {
  const defaultScheme: ColorScheme = { name: "Blue", primary: "#3b82f6", primaryHover: "#2563eb" };
  const defaultProps = {
    theme: "dark" as Theme,
    colorScheme: defaultScheme,
    fontSize: 14,
    onThemeChange: vi.fn(),
    onColorSchemeChange: vi.fn(),
    onFontSizeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Settings header", () => {
    render(<SettingsPage {...defaultProps} />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders theme selection with correct value", () => {
    render(<SettingsPage {...defaultProps} />);
    const themeSelect = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    expect(themeSelect.value).toBe("dark");
  });

  it("calls onThemeChange when theme is changed", () => {
    render(<SettingsPage {...defaultProps} />);
    const themeSelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(themeSelect, { target: { value: "light" } });
    expect(defaultProps.onThemeChange).toHaveBeenCalledWith("light");
  });

  it("renders color scheme options", () => {
    render(<SettingsPage {...defaultProps} />);
    // All color scheme options should be present
    expect(screen.getByText("Blue")).toBeInTheDocument();
    expect(screen.getByText("Green")).toBeInTheDocument();
    expect(screen.getByText("Purple")).toBeInTheDocument();
    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(screen.getByText("Orange")).toBeInTheDocument();
  });

  it("calls onColorSchemeChange when scheme is changed", () => {
    render(<SettingsPage {...defaultProps} />);
    const colorSelect = screen.getAllByRole("combobox")[1];
    fireEvent.change(colorSelect, { target: { value: "Green" } });
    expect(defaultProps.onColorSchemeChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Green" }),
    );
  });

  it("renders font size section", () => {
    render(<SettingsPage {...defaultProps} />);
    expect(screen.getByText("Font Size")).toBeInTheDocument();
  });
});
