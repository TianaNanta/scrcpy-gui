# Scrcpy GUI

A beautiful graphical user interface for [scrcpy](https://github.com/Genymobile/scrcpy), built with Tauri, React, and TypeScript using Bun as the package manager.

## Features

- **Device Health Monitoring**: Real-time battery, storage, and network latency status for connected devices
  - Battery percentage, charge status, and temperature display
  - Storage usage with warning indicators when free space is low (<500MB)
  - Network quality assessment based on ADB latency (excellent/good/fair/poor)
  - Automatic status polling with configurable intervals
  - Smart error recovery with exponential backoff retry logic
- List connected Android devices with status indicators
- Start scrcpy mirroring with customizable options
- Modern, beautiful UI with icons and responsive design
- Dependency checks for ADB and scrcpy
- Customizable themes via dropdown (Light, Dark, System)
- Multiple color schemes via dropdown (Blue, Green, Purple, Red, Orange)
- Adjustable font sizes via number input (12-24px)
- Configuration presets and comprehensive logging

## Prerequisites

- [scrcpy](https://github.com/Genymobile/scrcpy) installed on your system
- Android device with USB debugging enabled
- ADB (Android Debug Bridge) installed

## Installation

1. Clone this repository
2. Install dependencies: `bun install`
3. Run in development: `bun run tauri dev`
4. Build for production: `bun run tauri build`

## Usage

1. Connect your Android device via USB
2. Enable USB debugging on the device
3. Run the app
4. Use the sidebar to navigate between tabs:
   - **Devices**: Select device and configure scrcpy options
   - **Presets**: Save and load configuration presets
   - **Logs**: View application and scrcpy logs
   - **Settings**: Customize theme, color scheme, and font size
5. Click "Start Scrcpy" to begin mirroring

## Device Health Monitoring

The app continuously monitors connected device health and displays real-time status:

### Status Indicators

- **Battery Badge**: Shows current battery percentage with color coding
  - 🟢 Green: Good battery level (≥20%)
  - 🟡 Yellow: Low battery warning (<20%)
  - 🔴 Red: Critical battery (<5%)
- **Storage Badge**: Displays available storage
  - 🟢 Green: Adequate space (>500MB free)
  - 🟡 Yellow: Low storage warning (<500MB free)
- **Network Quality**: Indicates ADB latency-based connection quality
  - 🟢 Excellent: <100ms latency
  - 🟡 Good: <500ms latency
  - 🟠 Fair: <2s latency
  - 🔴 Poor: ≥2s latency or disconnected

### Polling Behavior

- **Default Interval**: Health checks run every 2 seconds
- **Retry Strategy**: Failed health queries use exponential backoff (max 3 attempts)
- **Auto-Reconnection**: Device automatically reconnects if temporarily unavailable
- **Error Recovery**: Detailed error messages guide troubleshooting for common issues

### Troubleshooting

If you see error messages in the device health display:

1. **"Device offline"** - Reconnect device via USB or WiFi ADB
2. **"ADB command failed"** - Verify ADB is properly installed and in PATH
3. **"Permission denied"** - Ensure USB debugging is enabled on device
4. **"Connection timeout"** - Check network connectivity or USB connection

## Real-time Command Validation

The app provides comprehensive validation for scrcpy command configurations to prevent errors and ensure successful mirroring sessions.

### Validation Features

- **Real-time Feedback**: Options are validated as you type or select them
- **Error Prevention**: Invalid configurations are blocked before execution
- **Conflict Detection**: Incompatible option combinations are detected and warned about
- **Visual Indicators**: Command preview shows validation status with color-coded indicators

### Validation Status

The command preview displays validation status:

- **🟢 Valid Command**: All options are valid and compatible
- **🔴 Command Has Errors**: Blocking validation errors prevent execution
- **🟡 Command Has Warnings**: Potential issues that may cause problems

### Common Validation Rules

- **Numeric Ranges**: Bitrate, size, and FPS values must be within valid ranges
- **Enum Values**: Video codec, audio codec, and other options must use supported values
- **API Level Compatibility**: Some options require minimum Android API levels
- **Conflict Detection**: Options like `--turn-screen-off` and `--show-touches` cannot be used together
- **Dependency Requirements**: Camera options require video source to be set to "camera"

### Validation Examples

**Valid Configuration:**
```
scrcpy --max-size=1920 --video-bit-rate=8000000 --fullscreen
```
*Status: 🟢 Valid Command*

**Invalid Configuration:**
```
scrcpy --max-size=-1 --turn-screen-off --show-touches
```
*Status: 🔴 Command Has Errors*
- `--max-size=-1`: Value must be positive
- `--turn-screen-off` + `--show-touches`: Conflicting options

---

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
