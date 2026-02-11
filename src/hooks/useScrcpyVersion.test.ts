import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useScrcpyVersion } from "./useScrcpyVersion";

// Mock @tauri-apps/api/core
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useScrcpyVersion", () => {
  it("returns loading state initially", () => {
    // Never resolve the invoke — stays loading
    mockInvoke.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useScrcpyVersion());
    expect(result.current.loading).toBe(true);
    expect(result.current.version).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("sets version and feature gates on success", async () => {
    mockInvoke.mockResolvedValue({
      major: 3,
      minor: 3,
      patch: 4,
      raw: "3.3.4",
    });
    const { result } = renderHook(() => useScrcpyVersion());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.version).toEqual({
      major: 3,
      minor: 3,
      patch: 4,
      raw: "3.3.4",
    });
    expect(result.current.error).toBeNull();
    expect(result.current.canAudio).toBe(true);
    expect(result.current.canNoVideo).toBe(true);
    expect(result.current.canCamera).toBe(true);
    expect(result.current.canUhidInput).toBe(true);
    expect(result.current.canGamepad).toBe(true);
    expect(result.current.canVirtualDisplay).toBe(true);
  });

  it("sets feature gates correctly for older version (2.0)", async () => {
    mockInvoke.mockResolvedValue({
      major: 2,
      minor: 0,
      patch: 0,
      raw: "2.0.0",
    });
    const { result } = renderHook(() => useScrcpyVersion());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.canAudio).toBe(true);    // ≥2.0
    expect(result.current.canNoVideo).toBe(false);  // ≥2.1
    expect(result.current.canCamera).toBe(false);   // ≥2.2
    expect(result.current.canUhidInput).toBe(false); // ≥2.4
    expect(result.current.canGamepad).toBe(false);  // ≥2.7
    expect(result.current.canVirtualDisplay).toBe(false); // ≥3.0
  });

  it("sets error state on failure", async () => {
    mockInvoke.mockRejectedValue("scrcpy not found");
    const { result } = renderHook(() => useScrcpyVersion());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("scrcpy not found");
    expect(result.current.version).toBeNull();
    expect(result.current.canAudio).toBe(false);
    expect(result.current.canVirtualDisplay).toBe(false);
  });

  it("invokes get_scrcpy_version command", async () => {
    mockInvoke.mockResolvedValue({
      major: 3,
      minor: 0,
      patch: 0,
      raw: "3.0.0",
    });
    renderHook(() => useScrcpyVersion());

    await waitFor(() =>
      expect(mockInvoke).toHaveBeenCalledWith("get_scrcpy_version")
    );
  });
});
