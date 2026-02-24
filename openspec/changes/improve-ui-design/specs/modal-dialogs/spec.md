## ADDED Requirements

### Requirement: Modals SHALL have glass effect background

The system SHALL apply glassmorphism styling to modal dialogs.

#### Scenario: Modal glass styling

- **WHEN** a modal is opened
- **THEN** modal content SHALL have glass-effect background
- **AND** modal SHALL have elevated shadow (`--shadow-floating`)

### Requirement: Modal header SHALL be sticky

The system SHALL keep modal header visible when scrolling content.

#### Scenario: Sticky header

- **WHEN** modal content exceeds viewport height
- **THEN** header SHALL remain visible at top
- **AND** header SHALL have same background as modal content

### Requirement: Modal footer SHALL be sticky

The system SHALL keep modal footer visible when scrolling content.

#### Scenario: Sticky footer

- **WHEN** modal content exceeds viewport height
- **THEN** footer SHALL remain visible at bottom
- **AND** footer SHALL have same background as modal content

### Requirement: Modal overlay SHALL have semi-transparent backdrop

The system SHALL display a darkened backdrop behind modals.

#### Scenario: Modal backdrop

- **WHEN** a modal is opened
- **THEN** a semi-transparent overlay SHALL cover the main content
- **AND** clicking overlay SHALL close the modal

### Requirement: Modal SHALL support keyboard dismissal

The system SHALL allow closing modals with keyboard.

#### Scenario: Escape key close

- **WHEN** user presses Escape key while modal is open
- **THEN** modal SHALL close
