import "@testing-library/jest-dom";
import { randomFillSync } from "node:crypto";

// WebCrypto polyfill for happy-dom (required by Tauri API mocks)
if (!globalThis.crypto?.getRandomValues) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      getRandomValues: (buf: Uint8Array) => randomFillSync(buf),
    },
  });
}

// localStorage mock for happy-dom
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Integration test utilities for validation system
export const createTestDeviceSettings = () => ({
  name: "Test Device",
  bitrate: 8000000,
  maxSize: 1920,
  maxFps: 60,
  videoCodec: "h264" as const,
  videoEncoder: "",
  videoBuffer: 0,
  videoSource: "display" as const,
  cameraFacing: "front" as const,
  cameraSize: "",
  cameraId: "",
  audioForwarding: true,
  audioBitrate: 128000,
  audioCodec: "opus" as const,
  microphoneForwarding: false,
  noAudio: false,
  noVideo: false,
  noPlayback: false,
  displayId: 0,
  rotation: 0,
  crop: "",
  lockVideoOrientation: -1,
  displayBuffer: 0,
  windowX: 0,
  windowY: 0,
  windowWidth: 0,
  windowHeight: 0,
  alwaysOnTop: false,
  windowBorderless: false,
  fullscreen: false,
  windowTitle: "",
  noControl: false,
  turnScreenOff: false,
  stayAwake: false,
  showTouches: false,
  powerOffOnClose: false,
  noPowerOn: false,
  recordingEnabled: false,
  recordFile: "",
  recordFormat: "mp4" as const,
  keyboardMode: "default" as const,
  mouseMode: "default" as const,
  gamepadMode: "disabled" as const,
  v4l2Sink: "",
  v4l2Buffer: 0,
  virtualDisplay: false,
  virtualDisplayResolution: "",
  virtualDisplayDpi: 0,
  startApp: "",
  otgMode: false,
  noCleanup: false,
  forceAdbForward: false,
  timeLimit: 0,
  ipAddress: "",
  port: 5555,
});

export const createTestValidationConfig = (overrides = {}) => ({
  options: {
    "max-size": 1920,
    "video-bit-rate": 8000000,
    fullscreen: true,
    ...overrides,
  },
});
