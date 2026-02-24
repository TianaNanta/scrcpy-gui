## Context

The scrcpy-gui application is a Tauri-based desktop app built with React and TypeScript. Over time, the main `App.tsx` file has grown to 1050 lines, handling multiple concerns including device management, settings persistence, theme management, logging, and modal state. This makes the component difficult to test, maintain, and reason about.

**Current State:**

- App.tsx contains 1050 lines with 15+ useState hooks
- 41 test files exist with good coverage for most components
- 8 modules lack tests (5 components, 2 hooks, 1 utility)
- Error handling is inconsistent across modules
- Some functions lack JSDoc documentation

**Constraints:**

- Must maintain backward compatibility with existing behavior
- No breaking changes to user-facing features
- Existing test infrastructure (Vitest + Testing Library) should be used
- Must work with Tauri's IPC APIs (invoke, listen)

## Goals / Non-Goals

**Goals:**

- Achieve 100% test coverage for all exported modules
- Reduce App.tsx from 1050 lines to ~200 lines
- Extract domain-specific hooks for better separation of concerns
- Establish consistent error handling patterns
- Add JSDoc documentation to all exported functions

**Non-Goals:**

- No UI/UX changes
- No new features
- No performance optimizations
- No changes to existing API contracts
- No migration to different state management libraries

## Decisions

### 1. Hook Extraction Strategy

**Decision:** Extract 5 custom hooks from App.tsx following the single responsibility principle.

**Hook Structure:**

```typescript
// useDeviceManager - Device CRUD operations
// useDeviceSettingsManager - Device settings and presets
// usePairDevice - Pairing modal logic
// useAppearance - Theme and font settings
// useLogger - Logging with persistence
```

**Rationale:**

- Each hook manages a single domain of state
- Hooks can be tested independently
- App.tsx becomes an orchestrator, not a state container
- Follows React best practices for custom hooks

**Alternatives Considered:**

- Context API + useReducer: Overkill for this size, adds indirection
- Zustand/Jotai: Introduces new dependency, migration effort not justified
- Class components: Antipattern in modern React

### 2. Testing Strategy for Untested Modules

**Decision:** Use Vitest + React Testing Library with consistent patterns across all test files.

**Test Structure per Module:**

```typescript
describe("ModuleName", () => {
  describe("rendering", () => {
    // Component rendering tests
  });
  describe("interactions", () => {
    // User interaction tests
  });
  describe("edge cases", () => {
    // Error states, loading states, empty states
  });
});
```

**Rationale:**

- Consistent with existing 41 test files
- Testing Library promotes testing user behavior, not implementation
- Vitest provides fast, watch-friendly test execution

**Mock Strategy:**

- Mock Tauri APIs (`invoke`, `listen`) for unit tests
- Mock child components only when necessary for isolation
- Use real implementations for hooks being tested

### 3. Error Handling Standardization

**Decision:** Create centralized error handling utility with typed error messages.

**Pattern:**

```typescript
// utils/error-messages.ts (already exists, enhance it)
export function getErrorMessage(error: unknown, context: string): string {
  // Consistent error parsing and user-friendly messages
}

// In hooks/components:
try {
  await someOperation();
} catch (error) {
  const message = getErrorMessage(error, "device-connect");
  addLog("error", message);
}
```

**Rationale:**

- Single source of truth for error messages
- Easier to localize in the future
- Consistent user experience across error states

### 4. App.tsx Refactoring Approach

**Decision:** Incremental extraction with preserved behavior at each step.

**Extraction Order:**

1. Extract `useLogger` (simplest, no dependencies)
2. Extract `useAppearance` (isolated state)
3. Extract `usePairDevice` (modal state + Tauri calls)
4. Extract `useDeviceSettingsManager` (complex but isolated)
5. Extract `useDeviceManager` (most complex, depends on logger)

**Rationale:**

- Start with low-risk extractions
- Build confidence before tackling complex logic
- Each extraction can be tested independently
- Easy to roll back if issues arise

### 5. Documentation Standard

**Decision:** Add JSDoc comments to all exported functions and components.

**Format:**

```typescript
/**
 * Brief description of what the function does
 *
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @example
 * const result = functionName(arg);
 */
```

**Rationale:**

- Improves IDE autocomplete and hover tooltips
- Makes onboarding easier for new contributors
- Standard format (JSDoc) works with TypeScript

## Risks / Trade-offs

**Risk: Breaking existing behavior during refactoring** → Mitigation: Run all existing tests after each extraction; manual QA on critical paths (device connect, mirror, settings save)

**Risk: Hook extraction introduces subtle bugs** → Mitigation: Extract one hook at a time; add integration tests for App.tsx before and after

**Risk: Test coverage takes longer than expected** → Mitigation: Prioritize tests for most critical modules (DeviceSettingsModal, PairDeviceModal); defer less critical tests if needed

**Risk: Refactored code harder to debug** → Mitigation: Keep hooks small and focused; add descriptive log messages; preserve component names for React DevTools

**Trade-off: More files to maintain** → Acceptable: Better separation of concerns outweighs file count increase; each file is smaller and focused

**Trade-off: Slight increase in bundle size** → Negligible: Custom hooks are tree-shaken; no new dependencies

## Migration Plan

### Phase 1: Test Coverage (Low Risk)

1. Add tests for `FavoriteStar`, `TagBadge`, `TagInput` (simple components)
2. Add tests for `error-messages` utility
3. Add tests for `useCommandValidation`, `useScrcpyOptions` hooks
4. Add tests for `DeviceSettingsModal`, `PairDeviceModal` (complex components)

### Phase 2: Hook Extraction (Medium Risk)

1. Create `useLogger` hook, migrate logging from App.tsx
2. Create `useAppearance` hook, migrate theme/font state
3. Create `usePairDevice` hook, migrate pair modal logic
4. Create `useDeviceSettingsManager` hook, migrate settings/presets
5. Create `useDeviceManager` hook, migrate device CRUD
6. Refactor App.tsx to use all extracted hooks

### Phase 3: Documentation & Cleanup (Low Risk)

1. Add JSDoc comments to all new hooks
2. Add JSDoc comments to untested components
3. Remove unused imports from App.tsx
4. Final review and manual QA

### Rollback Strategy

- Each phase is independently deployable
- Git branches allow easy rollback
- No database or config changes, so rollback is clean

## Open Questions

(None - all technical decisions are resolved)
