# scrcpy-gui Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-11

## Active Technologies
- `localStorage` (frontend) — no database, no Tauri store plugin (001-scrcpy-options-gui)
- TypeScript ~5.6.2 (strict mode) + Rust stable (Tauri 2.x) + React 18.3, Vite 6, Tauri 2, tokio 1, serde 1, @tauri-apps/api 2, @heroicons/react 2 (003-bug-fixes-ui-devices)
- localStorage (frontend: device settings, names, presets, theme); no backend DB (003-bug-fixes-ui-devices)

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
- 003-bug-fixes-ui-devices: Added TypeScript ~5.6.2 (strict mode) + Rust stable (Tauri 2.x) + React 18.3, Vite 6, Tauri 2, tokio 1, serde 1, @tauri-apps/api 2, @heroicons/react 2
- 001-scrcpy-options-gui: Added TypeScript ~5.6 (strict mode) + Rust 1.93 (edition 2021) + Tauri 2.x, React 18.3, Vite 6.x, tokio 1.x, serde 1.x, rfd 0.16

- 001-scrcpy-options-gui: Added TypeScript ~5.6 (strict mode) + Rust 1.93 (edition 2021) + Tauri 2.x, React 18.3, Vite 6.x, tokio 1.x, serde 1.x, rfd 0.16

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
