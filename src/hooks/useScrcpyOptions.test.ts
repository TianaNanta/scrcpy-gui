/**
 * useScrcpyOptions Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrcpyOptions } from "./useScrcpyOptions";

describe("useScrcpyOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("options object", () => {
    it("returns config with options", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      expect(result.current.config).toBeDefined();
      expect(result.current.config.options).toBeDefined();
      expect(typeof result.current.config.options).toBe("object");
    });

    it("initializes with empty options", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      expect(result.current.config.options).toEqual({});
    });

    it("provides validation object", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      expect(result.current.validation).toBeDefined();
    });
  });

  describe("updateOption", () => {
    it("provides updateOption function", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      expect(typeof result.current.updateOption).toBe("function");
    });

    it("updates option value when called", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      act(() => {
        result.current.updateOption("max-size", 1920);
      });

      expect(result.current.config.options["max-size"]).toBe(1920);
    });

    it("preserves other options when updating", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      act(() => {
        result.current.updateOption("max-size", 1920);
      });

      act(() => {
        result.current.updateOption("video-codec", "h264");
      });

      expect(result.current.config.options["max-size"]).toBe(1920);
      expect(result.current.config.options["video-codec"]).toBe("h264");
    });

    it("overwrites existing option value", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      act(() => {
        result.current.updateOption("max-size", 1920);
      });

      act(() => {
        result.current.updateOption("max-size", 2048);
      });

      expect(result.current.config.options["max-size"]).toBe(2048);
    });
  });

  describe("clearOptions", () => {
    it("provides clearOptions function", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      expect(typeof result.current.clearOptions).toBe("function");
    });

    it("clears all options when called", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      act(() => {
        result.current.updateOption("max-size", 1920);
        result.current.updateOption("video-codec", "h264");
      });

      expect(result.current.config.options["max-size"]).toBe(1920);
      expect(result.current.config.options["video-codec"]).toBe("h264");

      act(() => {
        result.current.clearOptions();
      });

      expect(result.current.config.options).toEqual({});
    });
  });

  describe("removeOption", () => {
    it("provides removeOption function", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      expect(typeof result.current.removeOption).toBe("function");
    });

    it("removes option value", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      act(() => {
        result.current.updateOption("max-size", 1920);
      });

      act(() => {
        result.current.removeOption("max-size");
      });

      expect(result.current.config.options["max-size"]).toBeUndefined();
    });

    it("does not affect other options when removing", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      act(() => {
        result.current.updateOption("max-size", 1920);
        result.current.updateOption("video-codec", "h264");
      });

      act(() => {
        result.current.removeOption("max-size");
      });

      expect(result.current.config.options["max-size"]).toBeUndefined();
      expect(result.current.config.options["video-codec"]).toBe("h264");
    });
  });

  describe("isValid property", () => {
    it("provides isValid boolean", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      expect(typeof result.current.isValid).toBe("boolean");
    });

    it("returns true when no errors", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      expect(result.current.isValid).toBe(true);
    });
  });

  describe("validation errors and warnings", () => {
    it("provides errors in validation object", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      expect(Array.isArray(result.current.validation.errors)).toBe(true);
    });

    it("provides warnings in validation object", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      expect(Array.isArray(result.current.validation.warnings)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles null option value", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      act(() => {
        result.current.updateOption("max-size", null);
      });

      expect(result.current.config.options["max-size"]).toBeNull();
    });

    it("handles undefined option value", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      act(() => {
        result.current.updateOption("max-size", undefined);
      });

      expect(result.current.config.options["max-size"]).toBeUndefined();
    });

    it("handles boolean option value", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      act(() => {
        result.current.updateOption("no-video", true);
      });

      expect(result.current.config.options["no-video"]).toBe(true);
    });

    it("handles string option value", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      act(() => {
        result.current.updateOption("video-codec", "h264");
      });

      expect(result.current.config.options["video-codec"]).toBe("h264");
    });

    it("handles numeric option value", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      act(() => {
        result.current.updateOption("max-size", 1920);
      });

      expect(result.current.config.options["max-size"]).toBe(1920);
    });

    it("handles array option value", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      act(() => {
        result.current.updateOption("video-source", ["camera", "display"]);
      });

      expect(result.current.config.options["video-source"]).toEqual([
        "camera",
        "display",
      ]);
    });

    it("handles object option value", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      act(() => {
        result.current.updateOption("window-config", {
          width: 1920,
          height: 1080,
        });
      });

      expect(result.current.config.options["window-config"]).toEqual({
        width: 1920,
        height: 1080,
      });
    });

    it("handles removing non-existent option", () => {
      const { result } = renderHook(() => useScrcpyOptions());

      act(() => {
        result.current.removeOption("non-existent");
      });

      expect(result.current.config.options["non-existent"]).toBeUndefined();
    });
  });
});
