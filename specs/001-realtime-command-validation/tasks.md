# Tasks: Real-time Command Validation & Flag Conflicts

**Input**: Design documents from `/specs/001-realtime-command-validation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included per constitution requirements for Tauri commands and UI components.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `src/` at repository root
- **Backend**: `src-tauri/src/` for Rust components
- Paths follow the structure defined in plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic validation structure

- [x] T001 Create validation types directory and base interfaces in src/types/validation.ts
- [x] T002 Initialize validation utilities directory structure in src/utils/validation.ts
- [x] T003 [P] Configure validation-related CSS variables in src/styles/validation.css
- [x] T004 [P] Update existing hooks to support validation integration in src/hooks/useScrcpyOptions.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core validation logic and scrcpy option definitions that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Define ScrcpyOption interface with all option metadata in src/types/validation.ts
- [x] T006 Implement ValidationRule and ConflictRule interfaces in src/types/validation.ts
- [x] T007 Create scrcpy options registry with all 50+ options from research in src/utils/validation.ts
- [x] T008 Implement core validation functions (validateOption, checkConflicts) in src/utils/validation.ts
- [x] T009 Add version-aware validation logic for Android API levels in src/utils/validation.ts
- [x] T010 Create command formatting utility for preview generation in src/utils/validation.ts
- [x] T011 [P] Add unit tests for validation functions in src/utils/validation.test.ts
- [x] T012 [P] Add unit tests for option registry in src/utils/validation.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 5: Polish & Production Readiness

**Purpose**: Final quality improvements, testing, and validation to ensure production-ready code

- [x] T033 Update README.md with comprehensive validation features documentation and examples
- [x] T034 Code cleanup and import path fixes across test files
- [x] T035 Performance optimization with conflict map for O(1) lookups and validation timing <50ms
- [x] T036 Create comprehensive integration tests validating cross-user-story functionality
- [x] T037 Accessibility improvements with ARIA labels, screen reader support, and keyboard navigation
- [x] T038 Quickstart validation tests ensuring all documented scenarios work correctly

**Checkpoint**: Feature complete and production-ready with full test coverage, documentation, and accessibility compliance

---

## Phase 3: User Story 1 - Basic Command Validation (Priority: P1) 🎯 MVP

**Goal**: Provide real-time validation feedback for individual scrcpy option values

**Independent Test**: Configure options in the GUI, enter invalid values (negative numbers, wrong formats), verify immediate error messages appear and valid values show no errors

### Tests for User Story 1 ⚠️

- [x] T013 [P] [US1] Unit tests for option value validation in src/utils/validation.test.ts
- [x] T014 [P] [US1] Component tests for OptionField validation display in src/components/OptionField.tsx

### Implementation for User Story 1

- [x] T015 [US1] Create useCommandValidation hook for real-time validation state in src/hooks/useCommandValidation.ts
- [x] T016 [US1] Implement OptionField component with validation feedback in src/components/OptionField.tsx
- [x] T017 [US1] Add validation error display styles in src/styles/validation.css
- [x] T018 [US1] Integrate OptionField into existing option selection UI components
- [x] T019 [US1] Connect validation hook to option change events for real-time feedback

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - users can see validation errors for invalid option values

---

## Phase 4: User Story 2 - Flag Conflict Detection (Priority: P2)

**Goal**: Detect and warn about conflicting scrcpy flag combinations in real-time

**Independent Test**: Select known conflicting options (e.g., turn-screen-off + show-touches), verify warning banners appear and execution is blocked

### Tests for User Story 2 ⚠️

- [x] T020 [P] [US2] Unit tests for conflict detection logic in src/utils/validation.test.ts
- [x] T021 [P] [US2] Component tests for ValidationBanner display in src/components/ValidationBanner.test.tsx

### Implementation for User Story 2

- [x] T022 [US2] Implement conflict detection in validation utilities in src/utils/validation.ts
- [x] T023 [US2] Create ValidationBanner component for conflict warnings in src/components/ValidationBanner.tsx
- [x] T024 [US2] Add conflict warning styles in src/styles/validation.css
- [x] T025 [US2] Integrate conflict checking into useCommandValidation hook in src/hooks/useCommandValidation.ts
- [x] T026 [US2] Add execution blocking logic when conflicts exist in command execution flow

**Checkpoint**: All user stories should now be independently functional - command preview shows validation status for complete configurations

---

## Phase 5: User Story 3 - Command Preview & Formatting (Priority: P3)

**Goal**: Show formatted scrcpy command with validation status indicators

**Independent Test**: Configure options, verify command preview updates in real-time, shows validation status, and highlights invalid options

### Tests for User Story 3 ⚠️

- [x] T027 [P] [US3] Unit tests for command formatting in src/utils/validation.test.ts
- [x] T028 [P] [US3] Component tests for CommandPreview display in src/components/CommandPreview.test.tsx

### Implementation for User Story 3

- [x] T029 [US3] Implement command formatting utility in src/utils/validation.ts
- [x] T030 [US3] Create CommandPreview component with validation status in src/components/CommandPreview.tsx
- [x] T031 [US3] Add command preview styles in src/styles/validation.css
- [x] T032 [US3] Integrate CommandPreview into main UI and connect to validation state

**Checkpoint**: Complete feature - all user stories integrated with real-time validation, conflict detection, and command preview

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T033 [P] Documentation updates for validation features in README.md
- [x] T034 Code cleanup and TypeScript strict compliance in validation modules
- [x] T035 Performance optimization for validation feedback timing
- [x] T036 [P] Additional integration tests across user stories in src/test-setup.ts
- [x] T037 Accessibility improvements for validation UI elements
- [x] T038 Run quickstart.md validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 validation but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses validation from US1/US2 but independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Types before utilities
- Utilities before hooks
- Hooks before components
- Components before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Different components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit tests for option value validation in src/utils/validation.test.ts"
Task: "Component tests for OptionField validation display in src/components/OptionField.test.tsx"

# Launch implementation components in parallel:
Task: "Create useCommandValidation hook for real-time validation state in src/hooks/useCommandValidation.ts"
Task: "Implement OptionField component with validation feedback in src/components/OptionField.tsx"
Task: "Add validation error display styles in src/styles/validation.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently - users can enter options and see real-time validation feedback
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP: basic validation!)
3. Add User Story 2 → Test independently → Deploy/Demo (MVP + conflicts)
4. Add User Story 3 → Test independently → Deploy/Demo (full feature)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (basic validation UI)
   - Developer B: User Story 2 (conflict detection)
   - Developer C: User Story 3 (command preview)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence