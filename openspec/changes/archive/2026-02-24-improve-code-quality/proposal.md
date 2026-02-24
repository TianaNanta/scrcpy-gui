## Why

The codebase has grown to include 41 test files but has gaps in test coverage, with 8 modules lacking tests (5 components, 2 hooks, 1 utility). Additionally, the main App.tsx file has grown to 1050 lines with multiple concerns mixed together, making it harder to maintain and test. Improving code quality now will reduce technical debt and make future development faster and safer.

## What Changes

### Test Coverage Improvements

- Add unit tests for `DeviceSettingsModal` component
- Add unit tests for `PairDeviceModal` component
- Add unit tests for `FavoriteStar` component
- Add unit tests for `TagBadge` component
- Add unit tests for `TagInput` component
- Add unit tests for `useCommandValidation` hook
- Add unit tests for `useScrcpyOptions` hook
- Add unit tests for `error-messages` utility

### Code Structure Refactoring

- Extract device management logic from App.tsx into `useDeviceManager` hook
- Extract device settings/preset management into `useDeviceSettingsManager` hook
- Extract pair device logic into `usePairDevice` hook
- Extract theme/appearance logic into `useAppearance` hook
- Extract logging logic into `useLogger` hook
- Reduce App.tsx to primarily orchestrate hooks and render components

### Code Quality Standards

- Establish consistent error handling patterns across modules
- Add JSDoc comments to exported functions and components
- Standardize component prop interfaces with TypeScript strict types
- Remove unused imports and dead code

## Capabilities

### New Capabilities

- `test-coverage`: Comprehensive test coverage for all components, hooks, and utilities currently missing tests
- `code-organization`: Refactored App.tsx with extracted custom hooks for better separation of concerns
- `error-handling`: Standardized error handling patterns with consistent user-facing error messages

### Modified Capabilities

(None - this is a refactoring change with no spec-level behavior changes)

## Impact

### Affected Files

**Test Files (new):**

- `src/components/DeviceSettingsModal.test.tsx`
- `src/components/PairDeviceModal.test.tsx`
- `src/components/FavoriteStar.test.tsx`
- `src/components/TagBadge.test.tsx`
- `src/components/TagInput.test.tsx`
- `src/hooks/useCommandValidation.test.ts`
- `src/hooks/useScrcpyOptions.test.ts`
- `src/utils/error-messages.test.ts`

**New Files (hooks):**

- `src/hooks/useDeviceManager.ts`
- `src/hooks/useDeviceSettingsManager.ts`
- `src/hooks/usePairDevice.ts`
- `src/hooks/useAppearance.ts`
- `src/hooks/useLogger.ts`

**Modified Files:**

- `src/App.tsx` - Reduced to orchestration layer
- `src/App.test.tsx` - May need updates for refactored structure

### Dependencies

- No new npm packages required
- Existing test infrastructure (Vitest + Testing Library) is sufficient

### Breaking Changes

- None - purely internal refactoring with no API changes
