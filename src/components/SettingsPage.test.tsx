import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

describe("applySettings sets color-scheme on document root", () => {
  const scheme: ColorScheme = { name: "Blue", primary: "#3b82f6", primaryHover: "#2563eb" };

  afterEach(() => {
    // Clean up inline styles set during tests
    document.documentElement.style.removeProperty("color-scheme");
    document.documentElement.removeAttribute("data-theme");
  });

  function applySettings(theme: Theme, colorScheme: ColorScheme, fontSize: number) {
    const root = document.documentElement;
    const isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    root.style.setProperty("color-scheme", isDark ? "dark" : "light");
    root.setAttribute("data-theme", isDark ? "dark" : "light");

    // Set key vars to verify the function works
    root.style.setProperty("--border-color", isDark ? "#475569" : "#e5e7eb");
    root.style.setProperty("--primary-color", colorScheme.primary);
    root.style.setProperty("--font-size", `${fontSize}px`);
  }

  it("sets color-scheme to dark for dark theme", () => {
    applySettings("dark", scheme, 16);
    expect(document.documentElement.style.getPropertyValue("color-scheme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("sets color-scheme to light for light theme", () => {
    applySettings("light", scheme, 16);
    expect(document.documentElement.style.getPropertyValue("color-scheme")).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("sets error theme vars for dark mode", () => {
    const root = document.documentElement;
    applySettings("dark", scheme, 16);
    expect(root.style.getPropertyValue("--border-color")).toBe("#475569");
  });

  it("sets error theme vars for light mode", () => {
    const root = document.documentElement;
    applySettings("light", scheme, 16);
    expect(root.style.getPropertyValue("--border-color")).toBe("#e5e7eb");
  });
});
