import type { DeviceSettings } from "../types/settings";

/**
 * Build a scrcpy command preview string from DeviceSettings.
 * This is the single source of truth for command generation.
 * Returns the full command string including "scrcpy".
 */
export function buildCommandPreview(serial: string, settings: DeviceSettings): string {
  const args: string[] = ["scrcpy", "-s", serial];

  // OTG mode — standalone, no other video/audio flags
  if (settings.otgMode) {
    args.push("--otg");
    return args.join(" ");
  }

  // ─── Video ────────────────────────────────────────────────────────────────
  if (settings.noVideo) {
    args.push("--no-video");
  } else {
    if (settings.bitrate > 0 && settings.bitrate !== 8000000) {
      args.push("-b", settings.bitrate.toString());
    }
    if (settings.maxSize > 0) {
      args.push("--max-size", settings.maxSize.toString());
    }
    if (settings.maxFps > 0) {
      args.push("--max-fps", settings.maxFps.toString());
    }
    if (settings.videoCodec && settings.videoCodec !== "h264") {
      args.push("--video-codec", settings.videoCodec);
    }
    if (settings.videoEncoder) {
      args.push("--video-encoder", settings.videoEncoder);
    }
    if (settings.videoBuffer > 0) {
      args.push("--video-buffer", settings.videoBuffer.toString());
    }
  }

  // ─── Video Source ─────────────────────────────────────────────────────────
  if (settings.videoSource === "camera") {
    args.push("--video-source=camera");
    if (settings.cameraFacing) {
      args.push(`--camera-facing=${settings.cameraFacing}`);
    }
    if (settings.cameraSize) {
      args.push(`--camera-size=${settings.cameraSize}`);
    }
    if (settings.cameraId) {
      args.push(`--camera-id=${settings.cameraId}`);
    }
  }

  // ─── Audio ────────────────────────────────────────────────────────────────
  if (settings.noAudio) {
    args.push("--no-audio");
  } else if (settings.audioForwarding) {
    if (settings.audioBitrate > 0 && settings.audioBitrate !== 128000) {
      args.push("--audio-bit-rate", settings.audioBitrate.toString());
    }
    if (settings.audioCodec && settings.audioCodec !== "opus") {
      args.push("--audio-codec", settings.audioCodec);
    }
    if (settings.microphoneForwarding) {
      args.push("--audio-source=mic");
    }
  } else {
    // audioForwarding is false → explicitly disable
    args.push("--no-audio");
  }

  // ─── Display ──────────────────────────────────────────────────────────────
  if (settings.displayId > 0 && settings.videoSource !== "camera" && !settings.virtualDisplay) {
    args.push("--display-id", settings.displayId.toString());
  }
  if (settings.rotation > 0 && settings.videoSource !== "camera") {
    args.push("--orientation", settings.rotation.toString());
  }
  if (settings.crop && settings.videoSource !== "camera") {
    args.push("--crop", settings.crop);
  }
  if (settings.lockVideoOrientation >= 0) {
    args.push("--lock-video-orientation", settings.lockVideoOrientation.toString());
  }
  if (settings.displayBuffer > 0) {
    args.push("--display-buffer", settings.displayBuffer.toString());
  }

  // ─── Window ───────────────────────────────────────────────────────────────
  if (settings.windowX > 0) {
    args.push("--window-x", settings.windowX.toString());
  }
  if (settings.windowY > 0) {
    args.push("--window-y", settings.windowY.toString());
  }
  if (settings.windowWidth > 0) {
    args.push("--window-width", settings.windowWidth.toString());
  }
  if (settings.windowHeight > 0) {
    args.push("--window-height", settings.windowHeight.toString());
  }
  if (settings.alwaysOnTop) {
    args.push("--always-on-top");
  }
  if (settings.windowBorderless) {
    args.push("--window-borderless");
  }
  if (settings.fullscreen) {
    args.push("--fullscreen");
  }
  if (settings.windowTitle) {
    args.push("--window-title", settings.windowTitle);
  }

  // ─── Behavior ─────────────────────────────────────────────────────────────
  if (settings.noControl) {
    args.push("--no-control");
  }
  if (settings.turnScreenOff) {
    args.push("--turn-screen-off");
  }
  if (settings.stayAwake) {
    args.push("--stay-awake");
  }
  if (settings.showTouches) {
    args.push("--show-touches");
  }
  if (settings.powerOffOnClose) {
    args.push("--power-off-on-close");
  }
  if (settings.noPowerOn) {
    args.push("--no-power-on");
  }

  // ─── Recording ────────────────────────────────────────────────────────────
  if (settings.recordingEnabled && settings.recordFile) {
    args.push("--record", settings.recordFile);
  }

  // ─── Input Modes ──────────────────────────────────────────────────────────
  if (settings.keyboardMode !== "default") {
    args.push(`--keyboard=${settings.keyboardMode}`);
  }
  if (settings.mouseMode !== "default") {
    args.push(`--mouse=${settings.mouseMode}`);
  }
  if (settings.gamepadMode !== "disabled") {
    args.push(`--gamepad=${settings.gamepadMode}`);
  }

  // ─── V4L2 ─────────────────────────────────────────────────────────────────
  if (settings.v4l2Sink) {
    args.push(`--v4l2-sink=${settings.v4l2Sink}`);
    if (settings.v4l2Buffer > 0) {
      args.push("--v4l2-buffer", settings.v4l2Buffer.toString());
    }
  }

  // ─── No Playback ──────────────────────────────────────────────────────────
  if (settings.noPlayback) {
    args.push("--no-playback");
  }

  // ─── Virtual Display ──────────────────────────────────────────────────────
  if (settings.virtualDisplay) {
    let newDisplay = "--new-display";
    if (settings.virtualDisplayResolution) {
      newDisplay += `=${settings.virtualDisplayResolution}`;
      if (settings.virtualDisplayDpi > 0) {
        newDisplay += `/${settings.virtualDisplayDpi}`;
      }
    }
    args.push(newDisplay);
    if (settings.startApp) {
      args.push(`--start-app=${settings.startApp}`);
    }
  }

  // ─── Network ──────────────────────────────────────────────────────────────
  if (settings.noCleanup) {
    args.push("--no-cleanup");
  }
  if (settings.forceAdbForward) {
    args.push("--force-adb-forward");
  }
  if (settings.timeLimit > 0) {
    args.push("--time-limit", settings.timeLimit.toString());
  }

  return args.join(" ");
}
