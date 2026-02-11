import { describe, it, expect } from "vitest";
import {
  parseVersion,
  hasAudio,
  hasNoVideo,
  hasCamera,
  hasUhidInput,
  hasGamepad,
  hasVirtualDisplay,
} from "./scrcpy";

describe("parseVersion", () => {
  it("parses a full semver string", () => {
    const v = parseVersion("3.3.4");
    expect(v).toEqual({ major: 3, minor: 3, patch: 4, raw: "3.3.4" });
  });

  it("parses a two-part version (defaults patch to 0)", () => {
    const v = parseVersion("2.1");
    expect(v).toEqual({ major: 2, minor: 1, patch: 0, raw: "2.1" });
  });

  it("parses a single number", () => {
    const v = parseVersion("3");
    expect(v).toEqual({ major: 3, minor: 0, patch: 0, raw: "3" });
  });

  it("handles empty string gracefully", () => {
    const v = parseVersion("");
    expect(v).toEqual({ major: 0, minor: 0, patch: 0, raw: "" });
  });

  it("handles non-numeric input gracefully", () => {
    const v = parseVersion("abc.def");
    expect(v).toEqual({ major: 0, minor: 0, patch: 0, raw: "abc.def" });
  });
});

describe("feature gate helpers", () => {
  const v1_0 = parseVersion("1.0.0");
  const v2_0 = parseVersion("2.0.0");
  const v2_1 = parseVersion("2.1.0");
  const v2_2 = parseVersion("2.2.0");
  const v2_3 = parseVersion("2.3.0");
  const v2_4 = parseVersion("2.4.0");
  const v2_6 = parseVersion("2.6.0");
  const v2_7 = parseVersion("2.7.0");
  const v2_9 = parseVersion("2.9.0");
  const v3_0 = parseVersion("3.0.0");
  const v3_3 = parseVersion("3.3.4");

  describe("hasAudio (≥2.0)", () => {
    it("returns false for 1.x", () => expect(hasAudio(v1_0)).toBe(false));
    it("returns true for 2.0", () => expect(hasAudio(v2_0)).toBe(true));
    it("returns true for 3.x", () => expect(hasAudio(v3_3)).toBe(true));
  });

  describe("hasNoVideo (≥2.1)", () => {
    it("returns false for 2.0", () => expect(hasNoVideo(v2_0)).toBe(false));
    it("returns true for 2.1", () => expect(hasNoVideo(v2_1)).toBe(true));
    it("returns true for 3.x", () => expect(hasNoVideo(v3_3)).toBe(true));
  });

  describe("hasCamera (≥2.2)", () => {
    it("returns false for 2.1", () => expect(hasCamera(v2_1)).toBe(false));
    it("returns true for 2.2", () => expect(hasCamera(v2_2)).toBe(true));
    it("returns true for 2.3", () => expect(hasCamera(v2_3)).toBe(true));
  });

  describe("hasUhidInput (≥2.4)", () => {
    it("returns false for 2.3", () => expect(hasUhidInput(v2_3)).toBe(false));
    it("returns true for 2.4", () => expect(hasUhidInput(v2_4)).toBe(true));
    it("returns true for 3.0", () => expect(hasUhidInput(v3_0)).toBe(true));
  });

  describe("hasGamepad (≥2.7)", () => {
    it("returns false for 2.6", () => expect(hasGamepad(v2_6)).toBe(false));
    it("returns true for 2.7", () => expect(hasGamepad(v2_7)).toBe(true));
    it("returns true for 2.9", () => expect(hasGamepad(v2_9)).toBe(true));
  });

  describe("hasVirtualDisplay (≥3.0)", () => {
    it("returns false for 2.9", () => expect(hasVirtualDisplay(v2_9)).toBe(false));
    it("returns true for 3.0", () => expect(hasVirtualDisplay(v3_0)).toBe(true));
    it("returns true for 3.3", () => expect(hasVirtualDisplay(v3_3)).toBe(true));
  });
});
