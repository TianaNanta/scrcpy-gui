## ADDED Requirements

### Requirement: Sidebar SHALL be collapsible

The system SHALL allow users to collapse the sidebar to icon-only mode for more screen space.

#### Scenario: Collapse sidebar

- **WHEN** user clicks collapse toggle
- **THEN** sidebar SHALL animate to 64px width
- **AND** only icons SHALL be visible
- **AND** collapse state SHALL be saved to localStorage

#### Scenario: Expand sidebar

- **WHEN** user clicks expand toggle on collapsed sidebar
- **THEN** sidebar SHALL animate back to 250px width
- **AND** text labels SHALL be visible again

### Requirement: Sidebar SHALL have glass effect styling

The system SHALL apply glassmorphism to the sidebar background.

#### Scenario: Sidebar glass background

- **WHEN** sidebar is visible
- **THEN** background SHALL have semi-transparent glass styling
- **AND** border-right SHALL be subtle with transparency

### Requirement: Sidebar tabs SHALL have refined hover and active states

The system SHALL provide clear visual feedback for navigation items.

#### Scenario: Tab hover state

- **WHEN** user hovers over a sidebar tab
- **THEN** background SHALL change to primary color with low opacity
- **AND** text color SHALL change to primary color

#### Scenario: Tab active state

- **WHEN** a tab is selected
- **THEN** background SHALL have higher primary color opacity
- **AND** right border indicator SHALL be visible (3px solid)

### Requirement: Sidebar footer SHALL display dependency status

The system SHALL show ADB and Scrcpy status badges in the sidebar footer.

#### Scenario: Dependency badges

- **WHEN** sidebar is displayed
- **THEN** ADB and Scrcpy status badges SHALL be visible
- **AND** ready status SHALL use success colors
- **AND** not-ready status SHALL use error colors
