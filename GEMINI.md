# GEMINI.md

## Project Overview

**scrcpy-gui** is a modern, cross-platform graphical user interface for [scrcpy](https://github.com/Genymobile/scrcpy). It is built using the **Tauri** framework with a **React** (TypeScript) frontend and a **Rust** backend. The project uses **Bun** as its primary package manager and task runner.

### Core Technologies
- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Tauri 2.0 (Rust)
- **Styling**: Vanilla CSS with component-specific stylesheets
- **State Management**: React Hooks (Custom hooks for device/session management)
- **Testing**: Vitest, React Testing Library, Happy-dom
- **Tools**: Bun, Prettier, ESLint

### Key Features
- **Device Management**: Real-time monitoring of connected Android devices via ADB.
- **Health Polling**: Continuous tracking of battery levels, storage availability, and network latency.
- **Command Validation**: Real-time validation of `scrcpy` configuration flags to prevent incompatible options.
- **Preset Management**: Save and load custom mirroring configurations.
- **Logging**: Integrated viewer for application and `scrcpy` process logs.

---

## Building and Running

### Prerequisites
- [Bun](https://bun.sh/) installed.
- [Rust](https://www.rust-lang.org/) and Cargo installed.
- [scrcpy](https://github.com/Genymobile/scrcpy) and `adb` available in the system PATH.

### Key Commands
| Action | Command |
| :--- | :--- |
| **Install Dependencies** | `bun install` |
| **Development (Tauri)** | `bun run tauri dev` |
| **Development (Vite only)** | `bun run dev` |
| **Build Frontend** | `bun run build` |
| **Build App (Production)** | `bun run tauri build` |
| **Run Tests** | `bun test` |
| **Watch Tests** | `bun run test:watch` |

---

## Project Structure

- `src/`: React frontend source code.
    - `components/`: UI components and their specific CSS files.
    - `hooks/`: Custom hooks for logic (e.g., `useScrcpyProcess`, `useDeviceHealth`).
    - `types/`: TypeScript interfaces and type definitions (e.g., `scrcpy.ts`, `health.ts`).
    - `utils/`: Helper functions (e.g., `command-builder.ts`).
- `src-tauri/`: Rust backend source code and Tauri configuration.
- `specs/`: Feature specifications and design documents.
- `.github/`: CI/CD workflows and AI agent prompts/instructions.

---

## Development Conventions

### Coding Style
- **TypeScript**: Mandatory for all frontend code. Ensure interfaces are defined in `src/types/`.
- **Styling**: Use component-specific `.css` files (e.g., `MyComponent.tsx` → `MyComponent.css`).
- **Feature Gating**: Use version-based checks from `src/types/scrcpy.ts` when adding options that depend on specific `scrcpy` versions.

### Testing Practices
- **Unit Tests**: Place `.test.ts` or `.test.tsx` files alongside the source files.
- **Setup**: Global test setup is located in `src/test-setup.ts`.
- **Environment**: Tests run in `happy-dom` via Vitest.

### Workflow
- **Research first**: Consult `specs/` for architectural decisions and feature requirements.
- **Validation**: Ensure all changes are verified with `bun test` before completion.
- **Safety**: Do not commit secrets or sensitive system configuration.
