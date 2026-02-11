import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  type ScrcpyVersion,
  parseVersion,
  hasAudio,
  hasNoVideo,
  hasCamera,
  hasUhidInput,
  hasGamepad,
  hasVirtualDisplay,
} from "../types/scrcpy";

interface ScrcpyVersionState {
  version: ScrcpyVersion | null;
  loading: boolean;
  error: string | null;
  /** Audio forwarding (≥2.0) */
  canAudio: boolean;
  /** --no-video (≥2.1) */
  canNoVideo: boolean;
  /** Camera mirroring (≥2.2) */
  canCamera: boolean;
  /** UHID/AOA input modes (≥2.4) */
  canUhidInput: boolean;
  /** Gamepad forwarding (≥2.7) */
  canGamepad: boolean;
  /** Virtual display (≥3.0) */
  canVirtualDisplay: boolean;
}

export function useScrcpyVersion(): ScrcpyVersionState {
  const [version, setVersion] = useState<ScrcpyVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await invoke<{
          major: number;
          minor: number;
          patch: number;
          raw: string;
        }>("get_scrcpy_version");
        if (!cancelled) {
          setVersion(parseVersion(result.raw));
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const v = version;
  return {
    version,
    loading,
    error,
    canAudio: v ? hasAudio(v) : false,
    canNoVideo: v ? hasNoVideo(v) : false,
    canCamera: v ? hasCamera(v) : false,
    canUhidInput: v ? hasUhidInput(v) : false,
    canGamepad: v ? hasGamepad(v) : false,
    canVirtualDisplay: v ? hasVirtualDisplay(v) : false,
  };
}
