/** Parsed scrcpy version for feature gating */
export interface ScrcpyVersion {
  major: number;
  minor: number;
  patch: number;
  raw: string;
}

/**
 * Parse a raw version string like "3.3.4" into ScrcpyVersion.
 * Patch defaults to 0 if absent (e.g., "2.1" → { major: 2, minor: 1, patch: 0 }).
 */
export function parseVersion(raw: string): ScrcpyVersion {
  const parts = raw.split(".");
  return {
    major: parseInt(parts[0], 10) || 0,
    minor: parseInt(parts[1], 10) || 0,
    patch: parseInt(parts[2], 10) || 0,
    raw,
  };
}

/** Check if version >= minMajor.minMinor */
function versionAtLeast(
  v: ScrcpyVersion,
  minMajor: number,
  minMinor: number,
): boolean {
  return v.major > minMajor || (v.major === minMajor && v.minor >= minMinor);
}

// ─── Feature Gate Helpers ───────────────────────────────────────────────────

/** Audio forwarding (--no-audio to disable): scrcpy ≥ 2.0 */
export function hasAudio(v: ScrcpyVersion): boolean {
  return versionAtLeast(v, 2, 0);
}

/** --no-video (audio-only): scrcpy ≥ 2.1 */
export function hasNoVideo(v: ScrcpyVersion): boolean {
  return versionAtLeast(v, 2, 1);
}

/** Camera mirroring (--video-source=camera): scrcpy ≥ 2.2 */
export function hasCamera(v: ScrcpyVersion): boolean {
  return versionAtLeast(v, 2, 2);
}

/** UHID/AOA input modes (--keyboard=uhid, --mouse=uhid): scrcpy ≥ 2.4 */
export function hasUhidInput(v: ScrcpyVersion): boolean {
  return versionAtLeast(v, 2, 4);
}

/** Gamepad forwarding (--gamepad=uhid): scrcpy ≥ 2.7 */
export function hasGamepad(v: ScrcpyVersion): boolean {
  return versionAtLeast(v, 2, 7);
}

/** Virtual display (--new-display): scrcpy ≥ 3.0 */
export function hasVirtualDisplay(v: ScrcpyVersion): boolean {
  return versionAtLeast(v, 3, 0);
}
