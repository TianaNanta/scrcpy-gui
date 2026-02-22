# Tasks: Improved Preset Management

**Input**: Design documents from `/specs/001-preset-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included as required by constitution (testing standards principle)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `src/` for React components, hooks, types
- **Backend**: `src-tauri/src/` for Rust commands
- **Tests**: Component tests alongside components, Rust tests in same module

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature branch setup and basic enhancements

- [x] T001 Update Preset type definition with tags and favorites in src/types/settings.ts
- [x] T002 Add migration logic for existing presets in src/hooks/useDeviceSettings.ts
- [x] T003 [P] Install rfd crate for file dialogs in src-tauri/Cargo.toml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data model and storage enhancements that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement preset migration function in src/hooks/useDeviceSettings.ts
- [x] T005 Update loadPresets to handle new fields in src/hooks/useDeviceSettings.ts
- [x] T006 Update savePresetsToStorage with validation in src/hooks/useDeviceSettings.ts
- [x] T007 Add tag management utility functions in src/hooks/useDeviceSettings.ts
- [x] T008 Add favorite toggle utility functions in src/hooks/useDeviceSettings.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Tag Presets for Organization (Priority: P1) 🎯 MVP

**Goal**: Allow users to assign tags to presets for better organization and filtering

**Independent Test**: Create presets, add/remove tags, filter by tags - verify tags persist and filtering works

### Tests for User Story 1 ⚠️

- [x] T009 [P] [US1] Unit tests for tag utility functions in src/hooks/useDeviceSettings.test.ts
- [x] T010 [P] [US1] Component test for tag input in src/components/PresetManager.test.tsx

### Implementation for User Story 1

- [x] T011 [P] [US1] Create TagInput component in src/components/TagInput.tsx
- [x] T012 [P] [US1] Create TagBadge component in src/components/TagBadge.tsx
- [x] T013 [US1] Update PresetManager to include tag editing in src/components/PresetManager.tsx
- [x] T014 [US1] Add tag filtering to preset list in src/components/PresetManager.tsx
- [x] T015 [US1] Update PresetCard to display tags in src/components/PresetCard.tsx (new file)
- [x] T016 [US1] Integrate tag management in main App component in src/App.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Mark Presets as Favorites (Priority: P1)

**Goal**: Allow users to mark presets as favorites for quick access at the top of the list

**Independent Test**: Mark presets as favorites, verify they appear at top, unmark and verify order changes

### Tests for User Story 2 ⚠️

- [x] T017 [P] [US2] Unit tests for favorite utility functions in src/hooks/useDeviceSettings.test.ts
- [x] T018 [P] [US2] Component test for favorite toggle in src/components/PresetCard.test.tsx

### Implementation for User Story 2

- [x] T019 [P] [US2] Create FavoriteStar component in src/components/FavoriteStar.tsx
- [x] T020 [US2] Update PresetCard to include favorite star in src/components/PresetCard.tsx
- [x] T021 [US2] Update PresetManager to sort favorites first in src/components/PresetManager.tsx
- [x] T022 [US2] Add favorite filter option in src/components/PresetManager.tsx
- [x] T023 [US2] Integrate favorite management in main App component in src/App.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Export Presets (Priority: P2)

**Goal**: Allow users to export presets to JSON files for backup and sharing

**Independent Test**: Export presets to JSON, verify file contains correct data structure

### Tests for User Story 3 ⚠️

- [x] T024 [P] [US3] Unit tests for export validation in src-tauri/src/commands/file.rs
- [x] T025 [P] [US3] Component test for export button in src/components/PresetManager.test.tsx

### Implementation for User Story 3

- [x] T026 [P] [US3] Implement export_presets command in src-tauri/src/commands/file.rs
- [x] T027 [P] [US3] Register export commands in src-tauri/src/lib.rs
- [x] T028 [US3] Add export button to PresetManager in src/components/PresetManager.tsx
- [x] T029 [US3] Integrate export functionality in main App component in src/App.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - Import Presets (Priority: P2)

**Goal**: Allow users to import presets from JSON files

**Independent Test**: Import valid JSON file, verify presets are added and invalid files are rejected

### Tests for User Story 4 ⚠️

- [x] T032 [P] [US4] Unit tests for import validation in src-tauri/src/commands/file.rs
- [x] T033 [P] [US4] Component test for import button in src/components/PresetManager.test.tsx

### Implementation for User Story 4

- [x] T034 [P] [US4] Implement import_presets command in src-tauri/src/commands/file.rs
- [x] T035 [P] [US4] Register import commands in src-tauri/src/lib.rs
- [x] T036 [US4] Add import button to PresetManager in src/components/PresetManager.tsx
- [x] T037 [US4] Integrate import functionality in main App component in src/App.tsx

**Checkpoint**: Export and import should both work independently

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T040 [P] Update quickstart.md with final usage instructions
- [x] T041 Code cleanup and remove any unused imports
- [x] T042 [P] Performance optimization for preset list rendering
- [x] T043 [P] Additional component tests for edge cases
- [x] T044 Accessibility improvements (ARIA labels, keyboard navigation)
- [x] T045 Run constitution compliance check

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel
  - US3 and US4 can proceed in parallel after US1/US2 or independently
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational - Independent of US1/US2
- **User Story 4 (P2)**: Can start after Foundational - Independent of US1/US2

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Components before integration
- Backend commands before frontend integration
- Core implementation before polish

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks can run in parallel within Phase 2
- Once Foundational completes, US1 and US2 can start in parallel
- US3 and US4 can start in parallel
- All tests for a user story marked [P] can run in parallel
- Different components within a story marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit tests for tag utility functions in src/hooks/useDeviceSettings.test.ts"
Task: "Component test for tag input in src/components/PresetManager.test.tsx"

# Launch all components for User Story 1 together:
Task: "Create TagInput component in src/components/TagInput.tsx"
Task: "Create TagBadge component in src/components/TagBadge.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 + 4 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Tags)
   - Developer B: User Story 2 (Favorites)
   - Developer C: User Stories 3+4 (Export/Import)
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