/**
 * useCommandValidation Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCommandValidation } from "./useCommandValidation";
import type {
  CommandConfiguration,
  ValidationState,
} from "../types/validation";

vi.mock("../utils/validation", () => ({
  validateCommandConfiguration: vi.fn(
    (config: CommandConfiguration): ValidationState => {
      const errors: { option: string; message: string; code: string }[] = [];
      const warnings: { option: string; message: string; code: string }[] = [];
      const optionStates: Record<string, { isValid: boolean }> = {};

      const conflictingOptions = [
        ["no-video", "video-source"],
        ["no-audio", "audio-codec"],
      ];

      for (const [opt1, opt2] of conflictingOptions) {
        if (config.options[opt1] && config.options[opt2]) {
          errors.push({
            option: opt1,
            message: `Cannot use ${opt1} with ${opt2}`,
            code: "CONFLICT",
          });
        }
      }

      for (const key of Object.keys(config.options)) {
        optionStates[key] = { isValid: true };
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        optionStates,
      };
    },
  ),
}));

describe("useCommandValidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validation state", () => {
    it("returns initial validation state", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: {} }),
      );

      expect(result.current.validation).toBeDefined();
      expect(result.current.errors).toBeDefined();
      expect(result.current.warnings).toBeDefined();
      expect(result.current.isValid).toBeDefined();
    });

    it("returns isValid boolean", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: {} }),
      );

      expect(typeof result.current.isValid).toBe("boolean");
    });

    it("returns errors array", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: {} }),
      );

      expect(Array.isArray(result.current.errors)).toBe(true);
    });

    it("returns warnings array", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: {} }),
      );

      expect(Array.isArray(result.current.warnings)).toBe(true);
    });

    it("returns config object", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: { "max-size": 1920 } }),
      );

      expect(result.current.config).toBeDefined();
      expect(result.current.config.options).toBeDefined();
    });
  });

  describe("detecting conflicting options", () => {
    it("detects conflicts between no-video and video-source", () => {
      const { result } = renderHook(() =>
        useCommandValidation({
          options: {
            "no-video": true,
            "video-source": "camera",
          },
        }),
      );

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.length).toBeGreaterThan(0);
    });

    it("detects conflicts between no-audio and audio-codec", () => {
      const { result } = renderHook(() =>
        useCommandValidation({
          options: {
            "no-audio": true,
            "audio-codec": "opus",
          },
        }),
      );

      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.length).toBeGreaterThan(0);
    });

    it("returns valid when no conflicts exist", () => {
      const { result } = renderHook(() =>
        useCommandValidation({
          options: {
            "max-size": 1920,
            "video-codec": "h264",
          },
        }),
      );

      expect(result.current.isValid).toBe(true);
      expect(result.current.errors.length).toBe(0);
    });
  });

  describe("updateOption", () => {
    it("provides updateOption function", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: {} }),
      );

      expect(typeof result.current.updateOption).toBe("function");
    });

    it("updates config when updateOption is called", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: {} }),
      );

      act(() => {
        result.current.updateOption("max-size", 1920);
      });

      expect(result.current.config.options["max-size"]).toBe(1920);
    });

    it("preserves existing options when updating", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: { "video-codec": "h264" } }),
      );

      act(() => {
        result.current.updateOption("max-size", 1920);
      });

      expect(result.current.config.options["video-codec"]).toBe("h264");
      expect(result.current.config.options["max-size"]).toBe(1920);
    });

    it("revalidates after option update", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: {} }),
      );

      act(() => {
        result.current.updateOption("no-video", true);
      });

      expect(result.current.isValid).toBe(true);

      act(() => {
        result.current.updateOption("video-source", "camera");
      });

      expect(result.current.isValid).toBe(false);
    });
  });

  describe("validateConfig", () => {
    it("provides validateConfig function", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: {} }),
      );

      expect(typeof result.current.validateConfig).toBe("function");
    });

    it("returns validation state when called", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: { "max-size": 1920 } }),
      );

      let validation: ValidationState;
      act(() => {
        validation = result.current.validateConfig();
      });

      expect(validation!).toBeDefined();
      expect(validation!.isValid).toBe(true);
    });
  });

  describe("syncing with currentSettings", () => {
    it("syncs config when currentSettings changes", () => {
      const { result, rerender } = renderHook(
        ({ settings }) => useCommandValidation(settings),
        {
          initialProps: {
            settings: {
              options: { "max-size": 1920 },
            } as Partial<CommandConfiguration>,
          },
        },
      );

      expect(result.current.config.options["max-size"]).toBe(1920);

      rerender({
        settings: {
          options: { "max-size": 2048, "video-codec": "h264" },
        } as Partial<CommandConfiguration>,
      });

      expect(result.current.config.options["max-size"]).toBe(2048);
      expect(result.current.config.options["video-codec"]).toBe("h264");
    });
  });

  describe("edge cases", () => {
    it("handles empty options", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: {} }),
      );

      expect(result.current.isValid).toBe(true);
      expect(result.current.errors.length).toBe(0);
    });

    it("handles undefined options gracefully", () => {
      const { result } = renderHook(() => useCommandValidation({}));

      expect(result.current.config).toBeDefined();
    });

    it("handles null option values", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: { "max-size": null } }),
      );

      expect(result.current.config.options["max-size"]).toBeNull();
    });

    it("handles boolean option values", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: { "no-video": true } }),
      );

      expect(result.current.config.options["no-video"]).toBe(true);
    });

    it("handles string option values", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: { "video-codec": "h264" } }),
      );

      expect(result.current.config.options["video-codec"]).toBe("h264");
    });

    it("handles numeric option values", () => {
      const { result } = renderHook(() =>
        useCommandValidation({ options: { "max-size": 1920 } }),
      );

      expect(result.current.config.options["max-size"]).toBe(1920);
    });
  });
});
