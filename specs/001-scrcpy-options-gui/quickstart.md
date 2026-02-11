# Quickstart: Complete scrcpy Options GUI

**Feature**: 001-scrcpy-options-gui
**Date**: 2026-02-11

## Prerequisites

- Rust 1.93+ (`rustup update stable`)
- Bun 1.3+ (`bun --version`)
- scrcpy 2.0+ (`scrcpy --version`) — v3.0+ recommended for all features
- Android device with USB debugging enabled
- Linux recommended (required for V4L2 features)

## Setup

```bash
# Clone and switch to feature branch
git checkout 001-scrcpy-options-gui

# Install frontend dependencies
bun install

# Verify Rust builds
cd src-tauri && cargo build && cd ..

# Run in development
bun run tauri dev
```

## Verify New Features

### 1. Input Mode Selection (P1)

1. Connect an Android device via USB
2. Click the device card to open settings
3. Expand "Input & Control" panel
4. Select "Physical keyboard (UHID)" from keyboard dropdown
5. Click "Start Scrcpy"
6. **Verify**: Command preview shows `--keyboard=uhid`
7. **Verify**: Keyboard input works as physical device input

### 2. Audio Forwarding (P1)

1. Open device settings for an Android 11+ device
2. Expand "Audio" panel
3. Toggle "Audio Forwarding" ON
4. Set codec to "AAC" and bitrate to 192000
5. Click "Start Scrcpy"
6. **Verify**: Command shows `--audio-codec=aac --audio-bit-rate=192000`
7. **Verify**: Audio plays through computer speakers

### 3. Camera Mirroring (P2)

1. Open device settings for an Android 12+ device
2. Expand "Video Source" panel
3. Select "Camera" from video source dropdown
4. Select "Front" facing, set size to "1920x1080"
5. Click "Start Scrcpy"
6. **Verify**: Command shows `--video-source=camera --camera-facing=front --camera-size=1920x1080`
7. **Verify**: Camera feed displays in scrcpy window

### 4. V4L2 Virtual Webcam (P2, Linux only)

1. Load the V4L2 loopback module: `sudo modprobe v4l2loopback`
2. Open device settings
3. Expand "V4L2" panel (only visible on Linux)
4. Enable "V4L2 Sink", select `/dev/video2`
5. Check "No Playback"
6. Click "Start Scrcpy"
7. **Verify**: Command shows `--v4l2-sink=/dev/video2 --no-playback`
8. **Verify**: Video device appears in `v4l2-ctl --list-devices`

### 5. Virtual Display (P3)

1. Open device settings
2. Expand "Virtual Display" panel
3. Enable "Virtual Display", set resolution to "1920x1080"
4. Set "Start App" to a package name (e.g., `com.android.settings`)
5. Click "Start Scrcpy"
6. **Verify**: Command shows `--new-display=1920x1080 --start-app=com.android.settings`

### 6. OTG Mode (P3)

1. Connect a device via USB (not wireless)
2. Select "OTG" as connection mode
3. Click "Start Scrcpy"
4. **Verify**: Command shows `--otg`
5. **Verify**: No video window opens
6. **Verify**: Keyboard/mouse input forwards to device

### 7. Error Capture

1. Start scrcpy with an invalid option combination
2. Check the "Logs" tab
3. **Verify**: scrcpy error output appears with timestamp and actionable message

## Run Tests

```bash
# Frontend tests
bun run test

# Rust tests
cd src-tauri && cargo test && cd ..

# Build verification (constitution requirement)
bun run build
cd src-tauri && cargo build 2>&1 | grep -c warning  # must be 0
```

## Feature Gating Verification

1. Run `scrcpy --version` to note your version
2. Open the app
3. **Verify**: Features requiring newer versions than installed are disabled with tooltips
4. Example: If scrcpy 2.3.x is installed, camera mirroring (2.2+) is enabled but gamepad (2.7+) is disabled

## Preset Migration

1. If you have existing presets from v0.3.x, load them
2. **Verify**: Presets load without errors
3. **Verify**: New fields have sensible defaults (keyboard=default, audio=enabled, etc.)
4. Save a preset that includes new options
5. Reload the app
6. **Verify**: New preset loads with all fields intact
