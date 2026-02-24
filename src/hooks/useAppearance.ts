/**
 * useAppearance Hook
 *
 * Manages theme, color scheme, and font size settings with persistence.
 * Automatically applies theme changes to the DOM and listens for system theme changes.
 *
 * @returns Object containing appearance state and setter functions
 * @example
 * const { theme, colorScheme, fontSize, setTheme, saveUISettings } = useAppearance();
 * setTheme("dark");
 * saveUISettings("dark", colorScheme, 18);
 */

import { useState, useCallback, useEffect } from "react";
import type { Theme, ColorScheme } from "../types/settings";
import { colorSchemes } from "../components/SettingsPage";

const THEME_STORAGE_KEY = "scrcpy-theme";
const COLOR_SCHEME_STORAGE_KEY = "scrcpy-colorScheme";
const FONT_SIZE_STORAGE_KEY = "scrcpy-fontSize";

const DEFAULT_FONT_SIZE = 16;
const DEFAULT_THEME: Theme = "system";

/**
 * Return type for useAppearance hook
 */
export interface UseAppearanceReturn {
  /** Current theme setting (light, dark, or system) */
  theme: Theme;
  /** Current color scheme object */
  colorScheme: ColorScheme;
  /** Current font size in pixels */
  fontSize: number;
  /** Set the theme */
  setTheme: (theme: Theme) => void;
  /** Set the color scheme */
  setColorScheme: (colorScheme: ColorScheme) => void;
  /** Set the font size */
  setFontSize: (fontSize: number) => void;
  /** Save all UI settings at once and persist to localStorage */
  saveUISettings: (
    theme: Theme,
    colorScheme: ColorScheme,
    fontSize: number,
  ) => void;
}

function applyThemeToDOM(
  theme: Theme,
  colorScheme: ColorScheme,
  fontSize: number,
): void {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Set color-scheme for native form controls (selects, scrollbars, etc.)
  root.style.setProperty("color-scheme", isDark ? "dark" : "light");
  root.setAttribute("data-theme", isDark ? "dark" : "light");

  if (isDark) {
    root.style.setProperty(
      "--background",
      "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    );
    root.style.setProperty("--surface", "rgba(30, 41, 59, 0.95)");
    root.style.setProperty("--text-primary", "#f1f5f9");
    root.style.setProperty("--text-secondary", "#94a3b8");
    root.style.setProperty("--border-color", "#475569");
    root.style.setProperty("--input-bg", "rgba(30, 41, 59, 0.95)");
    // Error theme vars (dark)
    root.style.setProperty("--error-bg", "rgba(239, 68, 68, 0.15)");
    root.style.setProperty("--error-text", "#fca5a5");
    root.style.setProperty("--error-border", "rgba(239, 68, 68, 0.3)");
    root.style.setProperty("--separator-color", "rgba(255, 255, 255, 0.1)");
    // Shadow tokens (dark — higher opacity)
    root.style.setProperty("--shadow-subtle", "0 1px 2px rgba(0,0,0,0.20)");
    root.style.setProperty("--shadow-medium", "0 2px 8px rgba(0,0,0,0.30)");
    root.style.setProperty("--shadow-elevated", "0 8px 24px rgba(0,0,0,0.40)");
    root.style.setProperty("--shadow-floating", "0 16px 48px rgba(0,0,0,0.50)");
    // Status colors (dark)
    root.style.setProperty("--status-success-bg", "hsl(145, 40%, 18%)");
    root.style.setProperty("--status-success-text", "hsl(145, 60%, 65%)");
    root.style.setProperty("--status-error-bg", "hsl(0, 45%, 20%)");
    root.style.setProperty("--status-error-text", "hsl(0, 65%, 68%)");
    root.style.setProperty("--status-warning-bg", "hsl(40, 45%, 18%)");
    root.style.setProperty("--status-warning-text", "hsl(40, 70%, 65%)");
    root.style.setProperty("--status-info-bg", "hsl(210, 40%, 18%)");
    root.style.setProperty("--status-info-text", "hsl(210, 60%, 65%)");
  } else {
    root.style.setProperty(
      "--background",
      "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    );
    root.style.setProperty("--surface", "rgba(255, 255, 255, 0.95)");
    root.style.setProperty("--text-primary", "#1f2937");
    root.style.setProperty("--text-secondary", "#6b7280");
    root.style.setProperty("--border-color", "#e5e7eb");
    root.style.setProperty("--input-bg", "white");
    // Error theme vars (light)
    root.style.setProperty("--error-bg", "#fee2e2");
    root.style.setProperty("--error-text", "#dc2626");
    root.style.setProperty("--error-border", "#fecaca");
    root.style.setProperty("--separator-color", "rgba(0, 0, 0, 0.1)");
    // Shadow tokens (light)
    root.style.setProperty("--shadow-subtle", "0 1px 2px rgba(0,0,0,0.06)");
    root.style.setProperty("--shadow-medium", "0 2px 8px rgba(0,0,0,0.10)");
    root.style.setProperty("--shadow-elevated", "0 8px 24px rgba(0,0,0,0.12)");
    root.style.setProperty("--shadow-floating", "0 16px 48px rgba(0,0,0,0.16)");
    // Status colors (light)
    root.style.setProperty("--status-success-bg", "hsl(145, 65%, 92%)");
    root.style.setProperty("--status-success-text", "hsl(145, 70%, 28%)");
    root.style.setProperty("--status-error-bg", "hsl(0, 75%, 93%)");
    root.style.setProperty("--status-error-text", "hsl(0, 70%, 35%)");
    root.style.setProperty("--status-warning-bg", "hsl(40, 90%, 90%)");
    root.style.setProperty("--status-warning-text", "hsl(30, 80%, 30%)");
    root.style.setProperty("--status-info-bg", "hsl(210, 75%, 92%)");
    root.style.setProperty("--status-info-text", "hsl(210, 70%, 32%)");
  }
  root.style.setProperty("--primary-color", colorScheme.primary);
  root.style.setProperty("--primary-hover", colorScheme.primaryHover);
  root.style.setProperty(
    "--primary-color-rgb",
    colorScheme.primary
      .replace("#", "")
      .match(/.{2}/g)
      ?.map((h) => parseInt(h, 16))
      .join(", ") || "59, 130, 246",
  );
  root.style.setProperty("--font-size", `${fontSize}px`);
}

export function useAppearance(): UseAppearanceReturn {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return (saved as Theme) || DEFAULT_THEME;
  });

  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const savedName = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    return colorSchemes.find((s) => s.name === savedName) || colorSchemes[0];
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_FONT_SIZE;
  });

  // Apply theme on mount and changes
  useEffect(() => {
    applyThemeToDOM(theme, colorScheme, fontSize);
  }, [theme, colorScheme, fontSize]);

  // Listen for OS theme changes when in system mode
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyThemeToDOM(theme, colorScheme, fontSize);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, colorScheme, fontSize]);

  const saveUISettings = useCallback(
    (newTheme: Theme, newColorScheme: ColorScheme, newFontSize: number) => {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, newColorScheme.name);
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, newFontSize.toString());
      setTheme(newTheme);
      setColorScheme(newColorScheme);
      setFontSize(newFontSize);
    },
    [],
  );

  return {
    theme,
    colorScheme,
    fontSize,
    setTheme,
    setColorScheme,
    setFontSize,
    saveUISettings,
  };
}
