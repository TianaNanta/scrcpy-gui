<!--
  Sync Impact Report
  ==================
  Version change: N/A → 1.0.0 (initial adoption)
  Modified principles: N/A (first version)
  Added sections:
    - Core Principles (4 principles: Code Quality, Testing, UX, Performance)
    - Technology Stack Constraints
    - Development Workflow
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no update needed (generic placeholder)
    - .specify/templates/spec-template.md ✅ no update needed (generic placeholder)
    - .specify/templates/tasks-template.md ✅ no update needed (generic placeholder)
    - .specify/templates/checklist-template.md ✅ no update needed (generic placeholder)
    - .specify/templates/agent-file-template.md ✅ no update needed (generic placeholder)
    - .specify/templates/commands/ ✅ no command files present
  Follow-up TODOs: None
-->

# Scrcpy GUI Constitution

## Core Principles

### I. Code Quality & Type Safety (NON-NEGOTIABLE)

- All TypeScript code MUST use strict mode (`strict: true` in
  tsconfig); `any` types are forbidden except with explicit inline
  justification.
- Rust code MUST compile with zero warnings; `#[allow(...)]`
  annotations require inline rationale.
- All React components MUST be functional components with typed
  props interfaces.
- Tauri command signatures MUST have full type definitions on both
  Rust and TypeScript sides; type mismatches between frontend and
  backend are considered blocking bugs.
- Dead code, unused imports, and commented-out code blocks MUST be
  removed before merge.
- Functions exceeding 50 lines MUST be refactored or justified
  with inline documentation explaining the complexity.

**Rationale**: A Tauri app spans two languages and an IPC boundary.
Strict typing on both sides prevents the most common class of
runtime bugs — serialization mismatches and uncaught nulls.

### II. Testing Standards

- Every Tauri command MUST have at least one unit test on the Rust
  side validating both success and error paths.
- Frontend components with user interaction MUST have test coverage
  for primary user flows.
- Bug fixes MUST include a regression test that fails without the
  fix and passes with it.
- Test files MUST be co-located with source: `Component.test.tsx`
  alongside `Component.tsx` for frontend; Rust tests in the same
  module or a sibling `tests/` directory.
- Tests MUST be deterministic: no reliance on device connectivity,
  network state, or timing. Use mocks for ADB/scrcpy process
  interactions.
- All tests MUST pass in CI before merge; flaky tests MUST be
  quarantined and tracked as bugs.

**Rationale**: scrcpy-gui depends on external processes (adb, scrcpy)
that are unavailable in CI. Deterministic mocks are the only way to
maintain a reliable test suite.

### III. User Experience Consistency

- All UI interactions MUST provide visual feedback within 100ms
  (loading indicators, button state changes, toast notifications).
- Error messages displayed to users MUST be actionable: describe
  what went wrong AND suggest a resolution. Raw error codes or
  stack traces MUST NOT surface in the UI.
- Theme and color scheme changes MUST apply immediately without
  page reload; all components MUST respect the active theme via
  CSS custom properties.
- Layout MUST remain functional from 800×600 to 4K resolution.
  No horizontal scrollbars, no overflowing content, no broken
  layouts.
- Navigation patterns MUST be consistent: sidebar for primary
  navigation, modals for confirmations, inline editing for
  settings.
- Keyboard accessibility MUST be maintained for all interactive
  elements; tab order MUST follow visual layout.

**Rationale**: The app targets users who may not be developers.
Consistent, responsive UX with clear error guidance reduces support
burden and builds trust.

### IV. Performance Requirements

- Application cold start to interactive UI MUST complete within
  3 seconds on a mid-range machine.
- Device list refresh MUST complete within 2 seconds; UI MUST
  remain responsive during background operations (ADB queries,
  scrcpy process management).
- React component re-renders MUST be scoped: parent state changes
  MUST NOT trigger full-tree re-renders. Use `React.memo`,
  `useMemo`, and `useCallback` where measurable benefit exists.
- Tauri IPC calls MUST be non-blocking on the frontend;
  long-running backend operations MUST use async commands with
  progress feedback.
- Memory usage MUST remain stable during extended sessions; no
  unbounded growth in log buffers, device polling, or event
  listeners.
- Frontend bundle size MUST stay under 500KB gzipped (excluding
  Tauri shell); new dependencies require size-impact justification.

**Rationale**: scrcpy-gui is a companion tool — users expect it to
be lightweight and instant. Unbounded memory growth during long
mirroring sessions is a critical usability failure.

## Technology Stack Constraints

- **Frontend**: React 18+ with TypeScript (strict mode), Vite for
  bundling, Bun as package manager.
- **Backend**: Rust (latest stable edition), Tauri 2.x framework.
- **Styling**: CSS modules or scoped CSS; no CSS-in-JS runtime
  libraries. All styles MUST support theming via CSS custom
  properties.
- **State Management**: React built-in state (`useState`,
  `useReducer`, `useContext`) MUST be preferred. External state
  libraries require demonstrated need and documented justification.
- **Dependencies**: New npm or Cargo dependencies MUST be justified
  with purpose, bundle size impact, and maintenance status. Prefer
  standard library and existing dependencies over new additions.
- **Platform Support**: Linux is the primary target;
  platform-specific code MUST be isolated behind Tauri APIs or
  explicit platform abstractions.

## Development Workflow

- **Branch Strategy**: Feature branches off `main`; descriptive
  names following `feature/description` or `fix/description`.
- **Commit Messages**: Follow conventional commits format (`feat:`,
  `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
- **Code Review**: All changes MUST be reviewed before merge;
  reviewer MUST verify constitution compliance for principles I–IV.
- **Build Verification**: `bun run build` and `cargo build` MUST
  succeed with zero errors and zero warnings before merge.
- **Formatting**: TypeScript formatted consistently (Prettier or
  equivalent); Rust formatted with `rustfmt`. Formatting MUST be
  enforced in CI.
- **Documentation**: Public APIs, Tauri commands, and non-obvious
  logic MUST have doc comments. README MUST be updated when
  user-facing features change.

## Governance

This constitution is the authoritative reference for all development
decisions in the Scrcpy GUI project. It supersedes informal
practices and ad-hoc conventions.

- **Amendments**: Any change to this constitution MUST be documented
  with rationale, reviewed by the project maintainer, and versioned
  according to semantic versioning (MAJOR for principle
  removals/redefinitions, MINOR for additions/expansions, PATCH for
  clarifications).
- **Compliance**: All code reviews and pull requests MUST verify
  adherence to principles I–IV. Non-compliant code MUST NOT be
  merged without an explicit, documented exception.
- **Exceptions**: Temporary exceptions MUST be tracked as TODO
  comments with linked issues and a resolution timeline.
- **Review Cadence**: Constitution relevance MUST be reviewed
  quarterly or when major architectural decisions arise.

**Version**: 1.0.0 | **Ratified**: 2026-02-11 | **Last Amended**: 2026-02-11
