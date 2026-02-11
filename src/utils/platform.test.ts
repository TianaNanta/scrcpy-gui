import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @tauri-apps/plugin-os before importing the module under test
vi.mock("@tauri-apps/plugin-os", () => ({
  platform: vi.fn(() => "linux"),
}));

describe("platform utils", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports isLinux as true when platform is linux", async () => {
    const { platform } = await import("@tauri-apps/plugin-os");
    vi.mocked(platform).mockReturnValue("linux" as ReturnType<typeof platform>);
    const mod = await import("./platform");
    expect(mod.isLinux).toBe(true);
    expect(mod.isWindows).toBe(false);
    expect(mod.isMacOS).toBe(false);
  });
});
