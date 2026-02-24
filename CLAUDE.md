# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**scrcpy-gui** is a cross-platform desktop application for scrcpy (Android screen mirroring) built with Tauri 2.0 and React 18. The frontend is written in TypeScript with Vite, while the backend is a Rust binary that handles native device communication and process management.

### Core Technology Stack
- **Frontend**: React 18.3.1 + TypeScript + Vite
- **Backend**: Tauri 2.0 (Rust)
- **Package Manager**: Bun (primary runtime)
- **Testing**: Vitest with Happy DOM environment
- **UI Icons**: Heroicons
- **Styling**: Custom CSS (not Tailwind/Bootstrap)

### Key Features
- Real-time device health monitoring (battery, storage, network latency)
- Comprehensive scrcpy command validation with conflict detection
- Preset management for saving/loading configurations
- Dependency checking for ADB and scrcpy
- Theme customization (light/dark/system) with color schemes
- Application and scrcpy process logging

## Development Commands

### Essential Commands
```bash
# Install dependencies
bun install

# Start development (Tauri + React hot-reload)
bun run tauri dev

# Build frontend only
bun run build

# Build production app
bun run tauri build

# Run tests
bun run test

# Run tests in watch mode
bun run test:watch
```

### Additional Commands
```bash
# Preview built frontend
bun run preview
```

## Architecture Overview

### Frontend Structure
- **`src/components/`**: React UI components organized by feature
  - Each component has its own CSS file (e.g., `DeviceCard.tsx` → `DeviceCard.css`)
  - Key components: DeviceList, DeviceSettingsModal, PresetManager, LogViewer
- **`src/hooks/`**: Custom React hooks for state management
  - `useDeviceSettings` - Device configuration state
  - `useDeviceHealth` - Real-time device health monitoring
  - `useScrcpyOptions` - scrcpy command configuration
  - `useAppearance` - Theme and UI settings
  - `useLogger` - Application and scrcpy logging
  - `usePairDevice` - Device pairing logic
- **`src/types/`**: TypeScript interfaces and type definitions
- **`src/utils/`**: Utility functions and helpers
  - `command-builder.ts` - Builds scrcpy commands from settings
  - `validation.ts` - Command validation and conflict detection

### Backend Architecture (Tauri/Rust)
- Located in `src-tauri/` directory
- Handles device communication via ADB
- Manages scrcpy process lifecycle
- Provides cross-platform native functionality

### State Management Pattern
- Component-level state with React hooks
- No global state management library
- Custom hooks shared between related components
- Local state is kept within components that need it

### Testing Strategy
- Tests placed alongside source files (`.test.ts` or `.test.tsx`)
- Happy DOM environment via Vitest
- Global test setup in `src/test-setup.ts`
- Comprehensive test coverage for:
  - Device health monitoring (31+ tests)
  - Command validation (33+ tests)
  - Integration tests with mock device data

## Conventions

### Component Styling
- Each component has its own CSS file in the same directory
- No Tailwind or Bootstrap - custom CSS classes only
- CSS follows BEM-like naming convention

### TypeScript Usage
- Strict mode enabled (`"strict": true`)
- Interfaces defined in `src/types/`
- Mandatory type annotations for function parameters and return types
- Avoid `any` type - use specific interfaces

### File Organization
- Component files include both component and test
- Type definitions grouped by domain (device, health, scrcpy, settings)
- Utility functions are pure and side-effect free
- Hooks follow React conventions (use_ prefix)

### Important Notes
- Development server runs on port 1420 (configured in `vite.config.ts`)
- Tauri expects a fixed port - fail if port 1420 is not available
- Always run tests after making changes (`bun run test`)
- Use component-specific CSS files, not global stylesheets
- Preserve Tauri security model - never open unsanitized input to shell commands
- No database or persistence layer - settings stored in localStorage via Tauri APIs