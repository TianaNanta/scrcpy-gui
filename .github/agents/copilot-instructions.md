# scrcpy-gui Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-11

## Active Technologies
- `localStorage` (frontend) — no database, no Tauri store plugin (001-scrcpy-options-gui)
- TypeScript ~5.6.2 (strict mode) + Rust stable (Tauri 2.x) + React 18.3, Vite 6, Tauri 2, tokio 1, serde 1, @tauri-apps/api 2, @heroicons/react 2 (003-bug-fixes-ui-devices)
- localStorage (frontend: device settings, names, presets, theme); no backend DB (003-bug-fixes-ui-devices)
- TypeScript ~5.6.2 (strict) + Rust stable (edition 2021) + React 18.3, Tauri 2.x, Vite 6, @heroicons/react, tokio 1, serde 1, chrono 0.4 (003-bug-fixes-ui-devices)
- localStorage (frontend device settings, presets, names); Tauri app data dir (device registry JSON) (003-bug-fixes-ui-devices)
- Rust 1.75+ (backend), React 18.3+, TypeScript 5.6+ (frontend) (004-device-health-polling)
- Local state in React `useState` and Tauri state management; device health data cached in memory per session (not persisted to disk) (004-device-health-polling)
- TypeScript (React 18+ strict mode), Rust (latest stable for Tauri 2.x) + React, Tauri, Bun package manager, Vite bundler (001-realtime-command-validation)
- N/A (in-memory validation state) (001-realtime-command-validation)

- TypeScript ~5.6 (strict mode) + Rust 1.93 (edition 2021) + Tauri 2.x, React 18.3, Vite 6.x, tokio 1.x, serde 1.x, rfd 0.16 (001-scrcpy-options-gui)

## Project Structure

```text
src/
tests/
```

## Commands

cargo test [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] cargo clippy

## Code Style

TypeScript ~5.6 (strict mode) + Rust 1.93 (edition 2021): Follow standard conventions

## Recent Changes
- 001-realtime-command-validation: Added TypeScript (React 18+ strict mode), Rust (latest stable for Tauri 2.x) + React, Tauri, Bun package manager, Vite bundler
- 004-device-health-polling: Added Rust 1.75+ (backend), React 18.3+, TypeScript 5.6+ (frontend)
- 004-device-health-polling: Added Rust 1.75+ (backend), React 18.3+, TypeScript 5.6+ (frontend)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
