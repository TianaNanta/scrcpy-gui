# Tasks: UI Refinement & Visual Polish

**Input**: Design documents from `/specs/002-ui-refinement/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not explicitly requested — test tasks omitted. Existing co-located tests should still pass after changes.

**Organization**: Tasks grouped by user story (5 stories from spec.md, P1–P5). Each story phase is independently testable.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks in same phase)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths included in descriptions

## Path Conventions

- Frontend: `src/` at repository root
- Styles: `src/App.css` (single stylesheet, design tokens + component styles)
- Components: `src/components/`, `src/components/settings-panels/`
- App shell: `src/App.tsx`

---

## Phase 1: Setup (Design Token Foundation)

**Purpose**: Establish the complete design token system that all subsequent phases depend on

- [x] T001 Add complete design token system (spacing, typography, shadow, animation, status color, border-radius tokens) to `:root` block in src/App.css
  - Spacing: `--space-xs` (4px) through `--space-2xl` (32px) per data-model.md §1
  - Typography: `--text-heading`, `--text-subheading`, `--text-body`, `--text-caption` derived from `var(--font-size)` per data-model.md §2
  - Shadow: `--shadow-subtle`, `--shadow-medium`, `--shadow-elevated`, `--shadow-floating` (light defaults) per data-model.md §3
  - Animation: `--duration-fast` (120ms), `--duration-normal` (200ms), `--duration-slow` (300ms), `--ease-default`, `--ease-decelerate` per data-model.md §4
  - Status colors: `--status-success-bg/text`, `--status-error-bg/text`, `--status-warning-bg/text`, `--status-info-bg/text` (light defaults) per data-model.md §5
  - Border radius: `--radius-sm` (6px), `--radius-md` (10px), `--radius-lg` (16px), `--radius-full` (9999px) per data-model.md §6
- [x] T002 Add `@keyframes` animations and `prefers-reduced-motion` media query override in src/App.css
  - `@keyframes pulse-dot`: scale 1→1.5, opacity fade for online status indicator (research.md §7)
  - `@keyframes shimmer`: background-position shift for loading skeleton (contracts §6)
  - `@keyframes spin`: 0→360deg rotation for refresh spinner (contracts §6)
  - `@media (prefers-reduced-motion: reduce)` block: set `--duration-fast`, `--duration-normal`, `--duration-slow` all to `0ms` (research.md §4)

**Checkpoint**: Design tokens defined — all subsequent phases can reference these tokens

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Theme-aware token integration and global style primitives that MUST be complete before user story work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Add shadow tokens and status color tokens for light/dark themes to `applySettings()` function in src/App.tsx
  - In the light theme branch: set `--shadow-subtle/medium/elevated/floating` to light values per data-model.md §3
  - In the dark theme branch: set same shadow tokens to dark values (higher opacity)
  - In light branch: set `--status-success-bg/text`, `--status-error-bg/text`, `--status-warning-bg/text`, `--status-info-bg/text` to light values per data-model.md §5
  - In dark branch: set same status tokens to dark values
- [x] T004 [P] Add global typography utility classes, button press feedback, and enhanced focus indicator styles in src/App.css
  - Typography classes: `.text-heading`, `.text-subheading`, `.text-body`, `.text-caption` per contracts §7
  - Button press: `.btn:active:not(:disabled) { transform: scale(0.97) }` with `var(--duration-fast)` per contracts §5 (FR-010)
  - Focus indicators: `:focus-visible` style with `2px solid var(--color-focus-ring)` and `outline-offset: 2px` per contracts §1 (FR-009)
- [x] T005 Migrate existing `--shadow`, `--transition`, `--border-radius` usages to new graduated token scale throughout src/App.css
  - Replace all `var(--shadow)` references with appropriate `var(--shadow-subtle)`, `var(--shadow-medium)`, etc. based on context
  - Replace all `var(--transition)` (currently `all 0.3s ease`) with explicit `transition` declarations using `var(--duration-*)` and `var(--ease-*)` tokens
  - Replace `var(--border-radius)` with `var(--radius-sm)`, `var(--radius-md)`, or `var(--radius-lg)` based on component type per data-model.md §6 migration notes

**Checkpoint**: Foundation ready — theme-aware tokens, global utilities, and migrated token scale in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — Consistent Visual Language Across All Screens (Priority: P1) 🎯 MVP

**Goal**: Every screen shares unified spacing, typography, color usage, and component styling so the app feels cohesive and professionally designed.

**Independent Test**: Navigate through all four tabs (Devices, Presets, Logs, Settings) and verify consistent card elevation, heading sizes, spacing rhythm, and color palette usage.

**Acceptance**: FR-001 (spacing scale), FR-002 (typography hierarchy), FR-009 (focus indicators), FR-016 (light/dark), FR-017 (responsive 600px)

### Implementation for User Story 1

- [x] T006 [US1] Apply spacing and typography tokens to all component styles (sidebar, device cards, modal, panels, logs) in src/App.css
  - Replace hardcoded `px` padding/margin/gap values with `var(--space-*)` tokens throughout
  - Apply `var(--text-heading)` to section/page headings, `var(--text-subheading)` to panel headers, `var(--text-body)` to content, `var(--text-caption)` to metadata/secondary text
  - Ensure consistent card elevation using `var(--shadow-subtle)` at rest across `.device-card`, `.preset-card`, `.log-container`
- [x] T007 [P] [US1] Apply consistent section styling and typography to SettingsPage in src/components/SettingsPage.tsx
  - Use `.text-heading` / `.text-subheading` for section titles
  - Ensure spacing between setting groups uses `var(--space-xl)` consistently
  - Remove any inline padding/margin overrides
- [x] T008 [P] [US1] Apply consistent card styling and typography to PresetManager in src/components/PresetManager.tsx
  - Apply same card elevation (`var(--shadow-subtle)`) and border-radius (`var(--radius-md)`) as device cards
  - Use typography tokens for preset names and descriptions
- [x] T009 [P] [US1] Apply consistent container styling and typography to LogViewer in src/components/LogViewer.tsx
  - Apply same container treatment (shadow, border-radius, padding) as other content areas
  - Use `var(--text-caption)` for log timestamps, `var(--text-body)` for log content
- [x] T010 [US1] Add responsive layout adjustments for 600px minimum width in src/App.css
  - Add `@media (max-width: 768px)` breakpoint for sidebar collapse or reduced width
  - Adjust card grid to single column below 600px
  - Ensure modal doesn't overflow at narrow widths (FR-017)

**Checkpoint**: US1 complete — all 4 tabs share a unified visual identity with consistent spacing, typography, and card styling. App feels cohesive when switching between views.

---

## Phase 4: User Story 2 — Polished Device Cards with Clear Status Indicators (Priority: P2)

**Goal**: Device cards feature clear visual hierarchy, animated status indicators, connection type badges, hover effects, and a friendly empty state.

**Independent Test**: Connect USB and wireless devices, verify card appearance, hover states, status indicators, and empty state when no devices are connected.

**Acceptance**: FR-003 (connection badges), FR-004 (animated status), FR-005 (card hover), FR-006 (empty state), FR-015 (text truncation)

### Implementation for User Story 2

- [x] T011 [US2] Add device card hover animation, status dot states, connection badge, empty state, and text truncation styles in src/App.css
  - Card hover: `.device-card:hover` with `var(--shadow-medium)`, `translateY(-2px)`, border accent per contracts §1
  - Status dot: `.status-dot.online` with `animation: pulse-dot` using `var(--duration-slow)`, `.status-dot.offline` static gray per contracts §1
  - Connection badge: `.connection-badge.usb`, `.connection-badge.wireless` styled with status colors per contracts §1
  - Empty state: `.device-list-empty` centered layout with icon, heading, subtext per contracts §1
  - Text truncation: `.device-serial` and `.device-info div` with `overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px` per contracts §1
- [x] T012 [US2] Add connection type icon badges (USB: `ComputerDesktopIcon`, wireless: `WifiIcon`) and enhanced status dot markup to device cards in src/components/DeviceList.tsx
  - Import `ComputerDesktopIcon` and `WifiIcon` from `@heroicons/react/24/outline`
  - Add `.connection-badge` span with appropriate icon based on device transport type
  - Ensure `.status-dot` has `.online`/`.offline` class applied correctly for animation
- [x] T013 [US2] Add empty state component with `DevicePhoneMobileIcon`, heading "No devices connected", and guidance text when `devices.length === 0` in src/components/DeviceList.tsx
  - Import `DevicePhoneMobileIcon` from `@heroicons/react/24/outline`
  - Render `.device-list-empty` container when no devices match filter/search
  - Include optional "Pair New Device" CTA button linking to pair modal
  - Apply `.text-heading` to heading, `.text-caption` to guidance text

**Checkpoint**: US2 complete — device cards show clear status (online pulse, offline static), connection badges distinguish USB/wireless at a glance, hover lifts cards, empty state guides users. Text truncation prevents layout breaks.

---

## Phase 5: User Story 3 — Enhanced Settings Modal Experience (Priority: P3)

**Goal**: Settings modal has smooth panel expand/collapse animations, consistently styled form controls, and a sticky header/footer with scrollable body.

**Independent Test**: Open device settings modal, expand/collapse panels, interact with all control types, verify animations and visual feedback. Scroll long content and confirm header/footer stay fixed.

**Acceptance**: FR-007 (panel expand/collapse), FR-008 (sticky header/footer), FR-009 (focus indicators on inputs)

### Implementation for User Story 3

- [x] T014 [US3] Add panel expand/collapse transition, modal sticky header/footer layout, chevron rotation, and form input styling classes in src/App.css
  - Panel collapse: `.panel-content { max-height: 0; overflow: hidden; opacity: 0 }` per contracts §4
  - Panel expand: `.panel-content.expanded { max-height: 1000px; opacity: 1 }` with `transition: max-height var(--duration-slow), opacity var(--duration-normal)` per contracts §4
  - Chevron: `.panel-header svg { transition: transform var(--duration-normal) }`, rotated 180deg when expanded per contracts §4
  - Modal layout: `.modal-content { display: flex; flex-direction: column; max-height: 85vh }`, `.modal-header { position: sticky; top: 0 }`, `.modal-footer { position: sticky; bottom: 0 }`, `.modal-body { flex: 1; overflow-y: auto }` per contracts §3
  - Form inputs: `.panel-content input, .panel-content select { background: var(--input-bg); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm) }` per contracts §4
- [x] T015 [US3] Remove all inline `style={{...}}` objects from DeviceSettingsModal and apply CSS classes with sticky header/footer layout in src/components/DeviceSettingsModal.tsx
  - Remove ~20 inline style objects with hardcoded colors (`#0f0f14`, `#333`, `#b0b0b0`, `#555`)
  - Apply `.modal-header`, `.modal-body`, `.modal-footer` classes for sticky layout
  - All colors must come from CSS custom properties (`var(--surface)`, `var(--text-primary)`, `var(--border-color)`, etc.)
  - Verify modal looks correct in both light and dark themes
- [x] T016 [US3] Remove hardcoded inline styles from all settings panel components and replace with CSS classes in src/components/settings-panels/*.tsx
  - Files: AudioPanel.tsx, BehaviorPanel.tsx, DisplayPanel.tsx, InputControlPanel.tsx, NetworkPanel.tsx, PerformancePanel.tsx, RecordingPanel.tsx, V4L2Panel.tsx, VideoSourcePanel.tsx, VirtualDisplayPanel.tsx, WindowPanel.tsx
  - Remove all `style={{...}}` with hardcoded colors (`#1e1e2e`, `#333`, `white`, etc.)
  - Replace with CSS classes that reference `var(--input-bg)`, `var(--text-primary)`, `var(--border-color)`, etc.
  - Apply `.panel-content` / `.panel-content.expanded` classes for expand/collapse animation (replacing instant conditional render if applicable)

**Checkpoint**: US3 complete — modal has sticky header/footer, panels expand/collapse with smooth animation, all form controls use theme-aware CSS classes. No inline styles remain.

---

## Phase 6: User Story 4 — Refined Sidebar & Navigation Polish (Priority: P4)

**Goal**: Sidebar feels premium with smooth tab transition animations, color-coded dependency badges, and visible depth separation.

**Independent Test**: Switch between tabs, observe transition animations, view dependency status badges.

**Acceptance**: FR-011 (animated tab indicator), FR-012 (dependency badges)

### Implementation for User Story 4

- [x] T017 [US4] Add sidebar depth shadow, animated tab indicator transition, and dependency badge styles in src/App.css
  - Sidebar depth: `.sidebar { box-shadow: var(--shadow-elevated) }` per contracts §2
  - Tab states: `.sidebar-tab:hover` with `background: rgba(var(--primary-color-rgb), 0.08)`, `.sidebar-tab.active` with `background: rgba(var(--primary-color-rgb), 0.15)` and `border-right: 3px solid var(--primary-color)` per contracts §2
  - Tab transition: `transition: background var(--duration-normal) var(--ease-default), color var(--duration-fast)` per contracts §2
  - Dependency badges: `.dep-badge` base, `.dep-badge.ready` with `var(--status-success-bg/text)`, `.dep-badge.not-ready` with `var(--status-error-bg/text)` per contracts §2
- [x] T018 [US4] Replace plain text dependency status (✓/✗) with color-coded icon badges (`CheckCircleIcon`/`XCircleIcon`) and ensure tab transition classes in src/components/Sidebar.tsx
  - Import `CheckCircleIcon`, `XCircleIcon` from `@heroicons/react/24/solid`
  - Replace text `✓`/`✗` with `<span class="dep-badge ready/not-ready"><Icon /> Label</span>`
  - Ensure `.sidebar-tab.active` class is applied for animated transitions

**Checkpoint**: US4 complete — sidebar tabs animate smoothly between states, dependency status uses professional color-coded badges, sidebar has visible depth from main content.

---

## Phase 7: User Story 5 — Improved Typography & Micro-Interactions (Priority: P5)

**Goal**: Loading states use skeleton placeholders, buttons have press feedback, and state transitions (loading → loaded, empty → populated) feel smooth.

**Independent Test**: Trigger loading states (refresh device list), interact with buttons, verify skeleton/spinner displays.

**Acceptance**: FR-010 (button press — already in Phase 2), FR-013 (loading states)

### Implementation for User Story 5

- [x] T019 [US5] Add loading skeleton card, button loading state, and state transition styles in src/App.css
  - Skeleton card: `.skeleton-card` matching `.device-card` dimensions with `background: linear-gradient(90deg, var(--surface) 25%, var(--border-color) 50%, var(--surface) 75%)` and `animation: shimmer 1.5s infinite` per contracts §6
  - Button loading: `.btn.loading` with spinner (CSS rotating border), `pointer-events: none`, hidden text per contracts §5
  - Refresh spinner: `.spin { animation: spin 1s linear infinite }` per contracts §6
  - Fade transition: `.fade-enter { opacity: 0 → 1 }` for state changes
- [x] T020 [US5] Add loading skeleton placeholder cards (3 skeleton cards) and refresh button spinner to DeviceList in src/components/DeviceList.tsx
  - When `loading === true` and `devices.length === 0`: render 3 `.skeleton-card` elements instead of empty state
  - When refresh is in progress: add `.spin` class to `ArrowPathIcon` on refresh button
  - Smooth transition from skeleton → populated state
- [x] T021 [US5] Integrate loading state prop management for device list refresh in src/App.tsx
  - Ensure `loading` boolean is passed to `DeviceList` component
  - Set `loading = true` when refresh starts, `loading = false` when devices are returned
  - Pass `refreshing` state for the refresh button spinner

**Checkpoint**: US5 complete — loading states show skeleton cards instead of blank space, refresh button spins during refresh, buttons have tactile press feedback. All state transitions feel smooth.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all themes, color schemes, and window sizes

- [x] T022 [P] Cross-theme validation: verify all visual enhancements render correctly in light/dark themes and all 5 color schemes
  - Toggle light ↔ dark: shadows, status colors, form inputs, modal, badges all adapt
  - Switch through all 5 color schemes: accent colors apply to tabs, buttons, card accents, badges
  - Verify WCAG AA contrast (4.5:1 text, 3:1 UI components) per SC-008
- [x] T023 Run quickstart.md validation checklist and verify all functional requirements
  - Execute all 7 validation steps from quickstart.md (theme toggle, color schemes, 600px resize, keyboard tab, reduced motion, `bun run test`, `bun run build`)
  - Verify each FR (FR-001 through FR-017) is satisfied
  - Fix any remaining style inconsistencies found during validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **User Stories (Phase 3–7)**: All depend on Phase 2 completion
  - Stories can proceed sequentially in priority order (P1 → P2 → P3 → P4 → P5)
  - Some stories can overlap if working on different files (see parallel opportunities)
- **Polish (Phase 8)**: Depends on all user story phases being complete

### User Story Dependencies

- **US1 (P1)**: Foundation for all other stories — must complete first. Defines the spacing/typography baseline.
- **US2 (P2)**: Depends on US1 for consistent card styling baseline. Can start CSS work (T011) during US1 TSX work (T007–T009).
- **US3 (P3)**: Depends on US1 for consistent styling. Independent of US2.
- **US4 (P4)**: Depends on US1 for consistent styling. Independent of US2, US3.
- **US5 (P5)**: Depends on US2 (adds skeleton to DeviceList which US2 modified). Should come after US2.

### Within Each User Story

1. CSS styles (App.css) before component changes (*.tsx)
2. Component implementation before integration
3. Core structure before refinement details

### Parallel Opportunities

- **Phase 2**: T003 (App.tsx) ‖ T004 (App.css) — different files
- **Phase 3**: T007 (SettingsPage.tsx) ‖ T008 (PresetManager.tsx) ‖ T009 (LogViewer.tsx) — all different files, after T006
- **Phase 5**: T015 (DeviceSettingsModal.tsx) ‖ T016 (settings-panels/*.tsx) — different files, after T014
- **Phase 8**: T022 ‖ T023 — independent validation activities

---

## Parallel Example: Phase 3 (User Story 1)

```text
# Sequential: CSS token application first
Task T006: Apply spacing and typography tokens to all component styles in src/App.css

# Then parallel: three component files simultaneously
Task T007: Apply consistent section styling to SettingsPage in src/components/SettingsPage.tsx
Task T008: Apply consistent card styling to PresetManager in src/components/PresetManager.tsx
Task T009: Apply consistent container styling to LogViewer in src/components/LogViewer.tsx

# Sequential: responsive adjustments last (same file as T006)
Task T010: Add responsive layout adjustments for 600px minimum width in src/App.css
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (design tokens)
2. Complete Phase 2: Foundational (theme integration, utilities, migration)
3. Complete Phase 3: User Story 1 (consistent visual language)
4. **STOP and VALIDATE**: All 4 tabs share unified visual identity
5. The app already looks significantly more polished at this point

### Incremental Delivery

1. Setup + Foundational → Token system and global styles ready
2. Add US1 → Consistent visual language → **MVP!** (app feels cohesive)
3. Add US2 → Polished device cards with status indicators and empty state
4. Add US3 → Refined settings modal experience (major inline style debt cleared)
5. Add US4 → Premium sidebar navigation
6. Add US5 → Loading skeletons and micro-interactions → **Complete polish**
7. Polish phase → Cross-cutting validation

### File Change Summary

| File | Phases | Story |
|------|--------|-------|
| src/App.css | 1, 2, 3, 4, 5, 6, 7 | Foundation + All stories |
| src/App.tsx | 2, 7 | Foundation + US5 |
| src/components/SettingsPage.tsx | 3 | US1 |
| src/components/PresetManager.tsx | 3 | US1 |
| src/components/LogViewer.tsx | 3 | US1 |
| src/components/DeviceList.tsx | 4, 7 | US2 + US5 |
| src/components/DeviceSettingsModal.tsx | 5 | US3 |
| src/components/settings-panels/*.tsx (11 files) | 5 | US3 |
| src/components/Sidebar.tsx | 6 | US4 |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story phase is independently testable at its checkpoint
- No Rust/backend changes — this is entirely frontend work
- No new npm dependencies — uses existing Heroicons + Jost font + CSS custom properties
- Commit after each phase or logical group of tasks
- All animations respect `prefers-reduced-motion` via token-level override (T002)
- Stop at any checkpoint to validate the story independently
