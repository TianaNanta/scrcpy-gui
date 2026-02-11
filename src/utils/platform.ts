import { platform } from "@tauri-apps/plugin-os";

/** Current OS platform — synchronous compile-time constant from Tauri OS plugin */
const currentPlatform = platform();

export const isLinux = currentPlatform === "linux";
export const isWindows = currentPlatform === "windows";
export const isMacOS = currentPlatform === "macos";
