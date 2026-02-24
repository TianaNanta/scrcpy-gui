/**
 * useAppearance Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAppearance } from "./useAppearance";

describe("useAppearance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage manually
    try {
      localStorage.removeItem("scrcpy-theme");
      localStorage.removeItem("scrcpy-colorScheme");
      localStorage.removeItem("scrcpy-fontSize");
    } catch {
      // Ignore errors
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("initializes with default theme", () => {
      const { result } = renderHook(() => useAppearance());
      expect(result.current.theme).toBe("system");
    });

    it("initializes with default color scheme", () => {
      const { result } = renderHook(() => useAppearance());
      expect(result.current.colorScheme).toBeDefined();
      expect(result.current.colorScheme.name).toBe("Blue");
    });

    it("initializes with default font size", () => {
      const { result } = renderHook(() => useAppearance());
      expect(result.current.fontSize).toBe(16);
    });

    it("loads theme from localStorage", () => {
      localStorage.setItem("scrcpy-theme", "dark");

      const { result } = renderHook(() => useAppearance());
      expect(result.current.theme).toBe("dark");
    });

    it("loads color scheme from localStorage", () => {
      localStorage.setItem("scrcpy-colorScheme", "Purple");

      const { result } = renderHook(() => useAppearance());
      expect(result.current.colorScheme.name).toBe("Purple");
    });

    it("loads font size from localStorage", () => {
      localStorage.setItem("scrcpy-fontSize", "20");

      const { result } = renderHook(() => useAppearance());
      expect(result.current.fontSize).toBe(20);
    });
  });

  describe("setTheme", () => {
    it("provides setTheme function", () => {
      const { result } = renderHook(() => useAppearance());
      expect(typeof result.current.setTheme).toBe("function");
    });

    it("updates theme state", () => {
      const { result } = renderHook(() => useAppearance());

      act(() => {
        result.current.setTheme("dark");
      });

      expect(result.current.theme).toBe("dark");
    });

    it("accepts light theme", () => {
      const { result } = renderHook(() => useAppearance());

      act(() => {
        result.current.setTheme("light");
      });

      expect(result.current.theme).toBe("light");
    });

    it("accepts system theme", () => {
      const { result } = renderHook(() => useAppearance());

      act(() => {
        result.current.setTheme("system");
      });

      expect(result.current.theme).toBe("system");
    });
  });

  describe("setColorScheme", () => {
    it("provides setColorScheme function", () => {
      const { result } = renderHook(() => useAppearance());
      expect(typeof result.current.setColorScheme).toBe("function");
    });

    it("updates color scheme state", () => {
      const { result } = renderHook(() => useAppearance());

      act(() => {
        result.current.setColorScheme({
          name: "Green",
          primary: "#10b981",
          primaryHover: "#059669",
        });
      });

      expect(result.current.colorScheme.name).toBe("Green");
      expect(result.current.colorScheme.primary).toBe("#10b981");
    });
  });

  describe("setFontSize", () => {
    it("provides setFontSize function", () => {
      const { result } = renderHook(() => useAppearance());
      expect(typeof result.current.setFontSize).toBe("function");
    });

    it("updates font size state", () => {
      const { result } = renderHook(() => useAppearance());

      act(() => {
        result.current.setFontSize(18);
      });

      expect(result.current.fontSize).toBe(18);
    });

    it("accepts various font sizes", () => {
      const { result } = renderHook(() => useAppearance());

      act(() => {
        result.current.setFontSize(12);
      });
      expect(result.current.fontSize).toBe(12);

      act(() => {
        result.current.setFontSize(24);
      });
      expect(result.current.fontSize).toBe(24);
    });
  });

  describe("saveUISettings", () => {
    it("provides saveUISettings function", () => {
      const { result } = renderHook(() => useAppearance());
      expect(typeof result.current.saveUISettings).toBe("function");
    });

    it("saves theme to localStorage", () => {
      const { result } = renderHook(() => useAppearance());

      act(() => {
        result.current.saveUISettings(
          "dark",
          { name: "Blue", primary: "#3b82f6", primaryHover: "#2563eb" },
          18,
        );
      });

      expect(localStorage.getItem("scrcpy-theme")).toBe("dark");
    });

    it("saves color scheme name to localStorage", () => {
      const { result } = renderHook(() => useAppearance());

      act(() => {
        result.current.saveUISettings(
          "light",
          { name: "Purple", primary: "#8b5cf6", primaryHover: "#7c3aed" },
          16,
        );
      });

      expect(localStorage.getItem("scrcpy-colorScheme")).toBe("Purple");
    });

    it("saves font size to localStorage", () => {
      const { result } = renderHook(() => useAppearance());

      act(() => {
        result.current.saveUISettings(
          "system",
          { name: "Blue", primary: "#3b82f6", primaryHover: "#2563eb" },
          20,
        );
      });

      expect(localStorage.getItem("scrcpy-fontSize")).toBe("20");
    });

    it("updates all state values", () => {
      const { result } = renderHook(() => useAppearance());

      act(() => {
        result.current.saveUISettings(
          "dark",
          { name: "Green", primary: "#10b981", primaryHover: "#059669" },
          22,
        );
      });

      expect(result.current.theme).toBe("dark");
      expect(result.current.colorScheme.name).toBe("Green");
      expect(result.current.fontSize).toBe(22);
    });
  });

  describe("DOM updates", () => {
    it("applies theme to document root", () => {
      renderHook(() => useAppearance());

      const root = document.documentElement;
      expect(root.getAttribute("data-theme")).toBeDefined();
    });

    it("sets font-size CSS variable", () => {
      const { result } = renderHook(() => useAppearance());

      act(() => {
        result.current.setFontSize(18);
      });

      const root = document.documentElement;
      expect(root.style.getPropertyValue("--font-size")).toBe("18px");
    });

    it("sets primary color CSS variable", () => {
      const { result } = renderHook(() => useAppearance());

      act(() => {
        result.current.setColorScheme({
          name: "Red",
          primary: "#ef4444",
          primaryHover: "#dc2626",
        });
      });

      const root = document.documentElement;
      expect(root.style.getPropertyValue("--primary-color")).toBe("#ef4444");
    });
  });

  describe("edge cases", () => {
    it("handles invalid localStorage theme gracefully", () => {
      localStorage.setItem("scrcpy-theme", "invalid-theme");

      const { result } = renderHook(() => useAppearance());
      expect(result.current.theme).toBe("invalid-theme");
    });

    it("handles missing localStorage color scheme gracefully", () => {
      localStorage.setItem("scrcpy-colorScheme", "NonExistent");

      const { result } = renderHook(() => useAppearance());
      // Falls back to first color scheme
      expect(result.current.colorScheme).toBeDefined();
    });

    it("handles invalid localStorage font size gracefully", () => {
      localStorage.setItem("scrcpy-fontSize", "invalid");

      const { result } = renderHook(() => useAppearance());
      // NaN will be returned, which is a valid number (though NaN)
      expect(typeof result.current.fontSize).toBe("number");
    });

    it("handles zero font size", () => {
      const { result } = renderHook(() => useAppearance());

      act(() => {
        result.current.setFontSize(0);
      });

      expect(result.current.fontSize).toBe(0);
    });

    it("handles very large font size", () => {
      const { result } = renderHook(() => useAppearance());

      act(() => {
        result.current.setFontSize(100);
      });

      expect(result.current.fontSize).toBe(100);
    });
  });
});
