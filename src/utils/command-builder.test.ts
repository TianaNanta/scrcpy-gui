import { describe, it, expect } from "vitest";
import { buildCommandPreview, buildArgs, formatCommandDisplay } from "./command-builder";
import { DEFAULT_DEVICE_SETTINGS } from "../types/settings";
import type { DeviceSettings } from "../types/settings";

/** Helper to create settings with overrides */
function settings(overrides: Partial<DeviceSettings> = {}): DeviceSettings {
  return { ...DEFAULT_DEVICE_SETTINGS, ...overrides };
}

describe("buildCommandPreview", () => {
  const serial = "DEVICE123";

  describe("defaults", () => {
    it("generates minimal command with defaults (only serial + no-audio since audioForwarding=true is default but produces no extra flags)", () => {
      const cmd = buildCommandPreview(serial, settings());
      expect(cmd).toBe("scrcpy -s DEVICE123");
    });

    it("always starts with scrcpy -s <serial>", () => {
      const cmd = buildCommandPreview("abc", settings());
      expect(cmd.startsWith("scrcpy -s abc")).toBe(true);
    });
  });

  describe("OTG mode", () => {
    it("produces only --otg flag and ignores everything else", () => {
      const cmd = buildCommandPreview(serial, settings({
        otgMode: true,
        maxFps: 60,
        alwaysOnTop: true,
        noAudio: true,
      }));
      expect(cmd).toBe("scrcpy -s DEVICE123 --otg");
    });
  });

  describe("video flags", () => {
    it("adds --no-video when noVideo is true", () => {
      const cmd = buildCommandPreview(serial, settings({ noVideo: true }));
      expect(cmd).toContain("--no-video");
      // Should not add bitrate/size flags when video is off
      expect(cmd).not.toContain("-b ");
    });

    it("adds bitrate when non-default", () => {
      const cmd = buildCommandPreview(serial, settings({ bitrate: 4000000 }));
      expect(cmd).toContain("-b 4000000");
    });

    it("omits bitrate when it equals default (8000000)", () => {
      const cmd = buildCommandPreview(serial, settings({ bitrate: 8000000 }));
      expect(cmd).not.toContain("-b");
    });

    it("adds max-size when > 0", () => {
      const cmd = buildCommandPreview(serial, settings({ maxSize: 1080 }));
      expect(cmd).toContain("--max-size 1080");
    });

    it("adds max-fps when > 0", () => {
      const cmd = buildCommandPreview(serial, settings({ maxFps: 60 }));
      expect(cmd).toContain("--max-fps 60");
    });

    it("adds video-codec when not h264", () => {
      const cmd = buildCommandPreview(serial, settings({ videoCodec: "h265" }));
      expect(cmd).toContain("--video-codec h265");
    });

    it("omits video-codec when h264 (default)", () => {
      const cmd = buildCommandPreview(serial, settings({ videoCodec: "h264" }));
      expect(cmd).not.toContain("--video-codec");
    });

    it("adds video-encoder when set", () => {
      const cmd = buildCommandPreview(serial, settings({ videoEncoder: "OMX.google.h264.encoder" }));
      expect(cmd).toContain("--video-encoder OMX.google.h264.encoder");
    });

    it("adds video-buffer when > 0", () => {
      const cmd = buildCommandPreview(serial, settings({ videoBuffer: 100 }));
      expect(cmd).toContain("--video-buffer 100");
    });
  });

  describe("camera / video source", () => {
    it("adds camera flags when videoSource is camera", () => {
      const cmd = buildCommandPreview(serial, settings({
        videoSource: "camera",
        cameraFacing: "back",
        cameraSize: "1920x1080",
        cameraId: "2",
      }));
      expect(cmd).toContain("--video-source=camera");
      expect(cmd).toContain("--camera-facing=back");
      expect(cmd).toContain("--camera-size=1920x1080");
      expect(cmd).toContain("--camera-id=2");
    });

    it("omits camera flags when videoSource is display", () => {
      const cmd = buildCommandPreview(serial, settings({ videoSource: "display" }));
      expect(cmd).not.toContain("--video-source");
      expect(cmd).not.toContain("--camera-facing");
    });

    it("skips displayId, crop, rotation when camera is selected", () => {
      const cmd = buildCommandPreview(serial, settings({
        videoSource: "camera",
        displayId: 2,
        crop: "100:200:0:0",
        rotation: 90,
      }));
      expect(cmd).not.toContain("--display-id");
      expect(cmd).not.toContain("--crop");
      expect(cmd).not.toContain("--orientation");
    });
  });

  describe("audio flags", () => {
    it("adds --no-audio when noAudio is true", () => {
      const cmd = buildCommandPreview(serial, settings({ noAudio: true }));
      expect(cmd).toContain("--no-audio");
    });

    it("adds --no-audio when audioForwarding is false", () => {
      const cmd = buildCommandPreview(serial, settings({ audioForwarding: false }));
      expect(cmd).toContain("--no-audio");
    });

    it("adds audio codec when not default opus", () => {
      const cmd = buildCommandPreview(serial, settings({ audioCodec: "aac" }));
      expect(cmd).toContain("--audio-codec aac");
    });

    it("omits audio codec when opus (default)", () => {
      const cmd = buildCommandPreview(serial, settings({ audioCodec: "opus" }));
      expect(cmd).not.toContain("--audio-codec");
    });

    it("adds audio bitrate when non-default", () => {
      const cmd = buildCommandPreview(serial, settings({ audioBitrate: 192000 }));
      expect(cmd).toContain("--audio-bit-rate 192000");
    });

    it("omits audio bitrate when default (128000)", () => {
      const cmd = buildCommandPreview(serial, settings({ audioBitrate: 128000 }));
      expect(cmd).not.toContain("--audio-bit-rate");
    });

    it("adds --audio-source=mic for microphone forwarding", () => {
      const cmd = buildCommandPreview(serial, settings({ microphoneForwarding: true }));
      expect(cmd).toContain("--audio-source=mic");
    });
  });

  describe("display flags", () => {
    it("adds display-id when > 0", () => {
      const cmd = buildCommandPreview(serial, settings({ displayId: 2 }));
      expect(cmd).toContain("--display-id 2");
    });

    it("skips display-id when virtualDisplay is on", () => {
      const cmd = buildCommandPreview(serial, settings({ displayId: 2, virtualDisplay: true }));
      expect(cmd).not.toContain("--display-id");
    });

    it("adds orientation when > 0", () => {
      const cmd = buildCommandPreview(serial, settings({ rotation: 90 }));
      expect(cmd).toContain("--orientation 90");
    });

    it("adds crop when set", () => {
      const cmd = buildCommandPreview(serial, settings({ crop: "1080:1920:0:0" }));
      expect(cmd).toContain("--crop 1080:1920:0:0");
    });

    it("adds lock-video-orientation when >= 0", () => {
      const cmd = buildCommandPreview(serial, settings({ lockVideoOrientation: 0 }));
      expect(cmd).toContain("--lock-video-orientation 0");
    });

    it("omits lock-video-orientation when -1 (unlocked)", () => {
      const cmd = buildCommandPreview(serial, settings({ lockVideoOrientation: -1 }));
      expect(cmd).not.toContain("--lock-video-orientation");
    });

    it("adds display-buffer when > 0", () => {
      const cmd = buildCommandPreview(serial, settings({ displayBuffer: 50 }));
      expect(cmd).toContain("--display-buffer 50");
    });
  });

  describe("window flags", () => {
    it("adds window position and size", () => {
      const cmd = buildCommandPreview(serial, settings({
        windowX: 100,
        windowY: 200,
        windowWidth: 800,
        windowHeight: 600,
      }));
      expect(cmd).toContain("--window-x 100");
      expect(cmd).toContain("--window-y 200");
      expect(cmd).toContain("--window-width 800");
      expect(cmd).toContain("--window-height 600");
    });

    it("adds always-on-top", () => {
      const cmd = buildCommandPreview(serial, settings({ alwaysOnTop: true }));
      expect(cmd).toContain("--always-on-top");
    });

    it("adds window-borderless", () => {
      const cmd = buildCommandPreview(serial, settings({ windowBorderless: true }));
      expect(cmd).toContain("--window-borderless");
    });

    it("adds fullscreen", () => {
      const cmd = buildCommandPreview(serial, settings({ fullscreen: true }));
      expect(cmd).toContain("--fullscreen");
    });

    it("adds window-title when set", () => {
      const cmd = buildCommandPreview(serial, settings({ windowTitle: "My Phone" }));
      expect(cmd).toContain('--window-title "My Phone"');
    });
  });

  describe("behavior flags", () => {
    it("adds no-control", () => {
      expect(buildCommandPreview(serial, settings({ noControl: true }))).toContain("--no-control");
    });

    it("adds turn-screen-off", () => {
      expect(buildCommandPreview(serial, settings({ turnScreenOff: true }))).toContain("--turn-screen-off");
    });

    it("adds stay-awake", () => {
      expect(buildCommandPreview(serial, settings({ stayAwake: true }))).toContain("--stay-awake");
    });

    it("adds show-touches", () => {
      expect(buildCommandPreview(serial, settings({ showTouches: true }))).toContain("--show-touches");
    });

    it("adds power-off-on-close", () => {
      expect(buildCommandPreview(serial, settings({ powerOffOnClose: true }))).toContain("--power-off-on-close");
    });

    it("adds no-power-on", () => {
      expect(buildCommandPreview(serial, settings({ noPowerOn: true }))).toContain("--no-power-on");
    });
  });

  describe("recording flags", () => {
    it("adds --record when enabled with file", () => {
      const cmd = buildCommandPreview(serial, settings({
        recordingEnabled: true,
        recordFile: "/tmp/rec.mp4",
      }));
      expect(cmd).toContain("--record /tmp/rec.mp4");
    });

    it("omits --record when recording disabled", () => {
      const cmd = buildCommandPreview(serial, settings({ recordingEnabled: false, recordFile: "/tmp/rec.mp4" }));
      expect(cmd).not.toContain("--record");
    });

    it("omits --record when no file path", () => {
      const cmd = buildCommandPreview(serial, settings({ recordingEnabled: true, recordFile: "" }));
      expect(cmd).not.toContain("--record");
    });
  });

  describe("input mode flags", () => {
    it("adds --keyboard=uhid when not default", () => {
      const cmd = buildCommandPreview(serial, settings({ keyboardMode: "uhid" }));
      expect(cmd).toContain("--keyboard=uhid");
    });

    it("omits --keyboard when default", () => {
      const cmd = buildCommandPreview(serial, settings({ keyboardMode: "default" }));
      expect(cmd).not.toContain("--keyboard");
    });

    it("adds --mouse=aoa when not default", () => {
      const cmd = buildCommandPreview(serial, settings({ mouseMode: "aoa" }));
      expect(cmd).toContain("--mouse=aoa");
    });

    it("adds --gamepad=uhid when not disabled", () => {
      const cmd = buildCommandPreview(serial, settings({ gamepadMode: "uhid" }));
      expect(cmd).toContain("--gamepad=uhid");
    });

    it("omits --gamepad when disabled", () => {
      const cmd = buildCommandPreview(serial, settings({ gamepadMode: "disabled" }));
      expect(cmd).not.toContain("--gamepad");
    });
  });

  describe("V4L2 flags", () => {
    it("adds v4l2-sink when set", () => {
      const cmd = buildCommandPreview(serial, settings({ v4l2Sink: "/dev/video2" }));
      expect(cmd).toContain("--v4l2-sink=/dev/video2");
    });

    it("adds v4l2-buffer when v4l2Sink is set and buffer > 0", () => {
      const cmd = buildCommandPreview(serial, settings({ v4l2Sink: "/dev/video2", v4l2Buffer: 200 }));
      expect(cmd).toContain("--v4l2-buffer 200");
    });

    it("omits v4l2-buffer when no v4l2Sink", () => {
      const cmd = buildCommandPreview(serial, settings({ v4l2Buffer: 200 }));
      expect(cmd).not.toContain("--v4l2-buffer");
    });
  });

  describe("no-playback flag", () => {
    it("adds --no-playback when true", () => {
      expect(buildCommandPreview(serial, settings({ noPlayback: true }))).toContain("--no-playback");
    });
  });

  describe("virtual display flags", () => {
    it("adds --new-display when enabled (no resolution)", () => {
      const cmd = buildCommandPreview(serial, settings({ virtualDisplay: true }));
      expect(cmd).toContain("--new-display");
      expect(cmd).not.toContain("--new-display=");
    });

    it("adds --new-display=WxH when resolution set", () => {
      const cmd = buildCommandPreview(serial, settings({
        virtualDisplay: true,
        virtualDisplayResolution: "1920x1080",
      }));
      expect(cmd).toContain("--new-display=1920x1080");
    });

    it("adds --new-display=WxH/DPI when both set", () => {
      const cmd = buildCommandPreview(serial, settings({
        virtualDisplay: true,
        virtualDisplayResolution: "1920x1080",
        virtualDisplayDpi: 320,
      }));
      expect(cmd).toContain("--new-display=1920x1080/320");
    });

    it("adds --start-app when virtualDisplay + startApp", () => {
      const cmd = buildCommandPreview(serial, settings({
        virtualDisplay: true,
        startApp: "org.videolan.vlc",
      }));
      expect(cmd).toContain("--start-app=org.videolan.vlc");
    });

    it("omits virtual display flags when disabled", () => {
      const cmd = buildCommandPreview(serial, settings({
        virtualDisplay: false,
        virtualDisplayResolution: "1920x1080",
      }));
      expect(cmd).not.toContain("--new-display");
    });
  });

  describe("network flags", () => {
    it("adds --no-cleanup", () => {
      expect(buildCommandPreview(serial, settings({ noCleanup: true }))).toContain("--no-cleanup");
    });

    it("adds --force-adb-forward", () => {
      expect(buildCommandPreview(serial, settings({ forceAdbForward: true }))).toContain("--force-adb-forward");
    });

    it("adds --time-limit when > 0", () => {
      const cmd = buildCommandPreview(serial, settings({ timeLimit: 30 }));
      expect(cmd).toContain("--time-limit 30");
    });
  });

  describe("combined scenarios", () => {
    it("generates a complex camera + audio command", () => {
      const cmd = buildCommandPreview(serial, settings({
        videoSource: "camera",
        cameraFacing: "front",
        cameraSize: "1920x1080",
        audioCodec: "aac",
        audioBitrate: 192000,
        maxFps: 30,
        turnScreenOff: true,
      }));
      expect(cmd).toContain("--video-source=camera");
      expect(cmd).toContain("--camera-facing=front");
      expect(cmd).toContain("--max-fps 30");
      expect(cmd).toContain("--audio-codec aac");
      expect(cmd).toContain("--audio-bit-rate 192000");
      // turnScreenOff is suppressed in camera mode (control disabled)
      expect(cmd).not.toContain("--turn-screen-off");
    });

    it("generates a V4L2 + no-playback command", () => {
      const cmd = buildCommandPreview(serial, settings({
        v4l2Sink: "/dev/video4",
        v4l2Buffer: 50,
        noPlayback: true,
      }));
      expect(cmd).toContain("--v4l2-sink=/dev/video4");
      expect(cmd).toContain("--v4l2-buffer 50");
      expect(cmd).toContain("--no-playback");
    });
  });
});

describe("buildArgs", () => {
  const serial = "DEVICE123";

  it("returns string[] (not a joined string)", () => {
    const args = buildArgs(serial, settings());
    expect(Array.isArray(args)).toBe(true);
    expect(args.every((a) => typeof a === "string")).toBe(true);
  });

  it("starts with -s <serial>", () => {
    const args = buildArgs(serial, settings());
    expect(args[0]).toBe("-s");
    expect(args[1]).toBe("DEVICE123");
  });

  it("OTG mode returns early with only -s and --otg", () => {
    const args = buildArgs(serial, settings({
      otgMode: true,
      maxFps: 60,
      alwaysOnTop: true,
    }));
    expect(args).toEqual(["-s", "DEVICE123", "--otg"]);
  });

  it("suppresses displayId, crop when camera mode", () => {
    const args = buildArgs(serial, settings({
      videoSource: "camera",
      displayId: 2,
      crop: "100:200:0:0",
    }));
    expect(args).not.toContain("--display-id");
    expect(args).not.toContain("--crop");
  });

  it("suppresses displayId, crop when virtualDisplay enabled", () => {
    const args = buildArgs(serial, settings({
      virtualDisplay: true,
      virtualDisplayResolution: "1920x1080",
      displayId: 2,
      crop: "100:200:0:0",
    }));
    expect(args).not.toContain("--display-id");
    expect(args).not.toContain("--crop");
  });

  it("skips default bitrate (8000000)", () => {
    const args = buildArgs(serial, settings({ bitrate: 8000000 }));
    expect(args).not.toContain("-b");
  });

  it("skips default audioBitrate (128000)", () => {
    const args = buildArgs(serial, settings({ audioBitrate: 128000 }));
    expect(args).not.toContain("--audio-bit-rate");
  });

  it("preserves window title with spaces as a single array element", () => {
    const args = buildArgs(serial, settings({ windowTitle: "My Android Phone" }));
    const titleIdx = args.indexOf("--window-title");
    expect(titleIdx).toBeGreaterThan(-1);
    expect(args[titleIdx + 1]).toBe("My Android Phone");
  });

  it("adds --record-format when it differs from file extension", () => {
    const args = buildArgs(serial, settings({
      recordingEnabled: true,
      recordFile: "/tmp/output.mp4",
      recordFormat: "mkv",
    }));
    expect(args).toContain("--record-format");
    expect(args[args.indexOf("--record-format") + 1]).toBe("mkv");
  });

  it("omits --record-format when it matches file extension", () => {
    const args = buildArgs(serial, settings({
      recordingEnabled: true,
      recordFile: "/tmp/output.mp4",
      recordFormat: "mp4",
    }));
    expect(args).not.toContain("--record-format");
  });
});

describe("control-disabled flag suppression", () => {
  const serial = "DEVICE123";

  it("camera mode suppresses --turn-screen-off", () => {
    const args = buildArgs(serial, settings({ videoSource: "camera", turnScreenOff: true }));
    expect(args).not.toContain("--turn-screen-off");
  });

  it("camera mode suppresses --show-touches", () => {
    const args = buildArgs(serial, settings({ videoSource: "camera", showTouches: true }));
    expect(args).not.toContain("--show-touches");
  });

  it("camera mode suppresses --stay-awake", () => {
    const args = buildArgs(serial, settings({ videoSource: "camera", stayAwake: true }));
    expect(args).not.toContain("--stay-awake");
  });

  it("camera mode suppresses --power-off-on-close", () => {
    const args = buildArgs(serial, settings({ videoSource: "camera", powerOffOnClose: true }));
    expect(args).not.toContain("--power-off-on-close");
  });

  it("camera mode does NOT suppress --no-power-on", () => {
    const args = buildArgs(serial, settings({ videoSource: "camera", noPowerOn: true }));
    expect(args).toContain("--no-power-on");
  });

  it("noControl suppresses --turn-screen-off", () => {
    const args = buildArgs(serial, settings({ noControl: true, turnScreenOff: true }));
    expect(args).toContain("--no-control");
    expect(args).not.toContain("--turn-screen-off");
  });

  it("noControl suppresses --show-touches, --stay-awake, --power-off-on-close", () => {
    const args = buildArgs(serial, settings({
      noControl: true,
      showTouches: true,
      stayAwake: true,
      powerOffOnClose: true,
    }));
    expect(args).not.toContain("--show-touches");
    expect(args).not.toContain("--stay-awake");
    expect(args).not.toContain("--power-off-on-close");
  });

  it("camera + virtualDisplay suppresses --start-app", () => {
    const args = buildArgs(serial, settings({
      videoSource: "camera",
      virtualDisplay: true,
      startApp: "com.example.app",
    }));
    expect(args).not.toContain("--start-app=com.example.app");
  });

  it("noControl suppresses --start-app in virtualDisplay", () => {
    const args = buildArgs(serial, settings({
      noControl: true,
      virtualDisplay: true,
      startApp: "com.example.app",
    }));
    expect(args).not.toContain("--start-app=com.example.app");
  });

  it("emits all flags normally when neither camera nor noControl", () => {
    const args = buildArgs(serial, settings({
      turnScreenOff: true,
      stayAwake: true,
      showTouches: true,
      powerOffOnClose: true,
      noPowerOn: true,
    }));
    expect(args).toContain("--turn-screen-off");
    expect(args).toContain("--stay-awake");
    expect(args).toContain("--show-touches");
    expect(args).toContain("--power-off-on-close");
    expect(args).toContain("--no-power-on");
  });

  it("emits --start-app normally when control is enabled", () => {
    const args = buildArgs(serial, settings({
      virtualDisplay: true,
      startApp: "com.example.app",
    }));
    expect(args).toContain("--start-app=com.example.app");
  });
});

describe("formatCommandDisplay", () => {
  it("prepends 'scrcpy' to args", () => {
    const result = formatCommandDisplay(["-s", "abc"]);
    expect(result).toBe("scrcpy -s abc");
  });

  it("quotes values containing spaces", () => {
    const result = formatCommandDisplay(["--window-title", "My Phone"]);
    expect(result).toBe('scrcpy --window-title "My Phone"');
  });

  it("does not quote simple values", () => {
    const result = formatCommandDisplay(["-s", "abc", "--max-fps", "60"]);
    expect(result).toBe("scrcpy -s abc --max-fps 60");
  });

  it("buildCommandPreview uses buildArgs + formatCommandDisplay", () => {
    const fromDeprecated = buildCommandPreview(serial, settings());
    const fromNew = formatCommandDisplay(buildArgs(serial, settings()));
    expect(fromDeprecated).toBe(fromNew);
  });

  const serial = "DEVICE123";
});
