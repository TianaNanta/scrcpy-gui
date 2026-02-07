# Scrcpy GUI

A beautiful graphical user interface for [scrcpy](https://github.com/Genymobile/scrcpy), built with Tauri, React, and TypeScript using Bun as the package manager.

## Features

- List connected Android devices
- Start scrcpy mirroring with customizable options
- Modern, beautiful UI with icons and responsive design
- Dependency checks for ADB and scrcpy
- Customizable themes (Light, Dark, System)
- Multiple color schemes (Blue, Green, Purple, Red, Orange)
- Adjustable font sizes (Small, Medium, Large)
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

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
