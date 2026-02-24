## ADDED Requirements

### Requirement: Input fields SHALL have refined focus states

The system SHALL provide clear visual feedback for focused inputs.

#### Scenario: Input focus

- **WHEN** an input field receives focus
- **THEN** border color SHALL change to primary color
- **AND** a subtle focus ring (3px rgba) SHALL appear around the input

#### Scenario: Input hover

- **WHEN** user hovers over an input field
- **THEN** border color SHALL indicate interactivity

### Requirement: Input fields SHALL show validation states

The system SHALL display visual indicators for validation errors.

#### Scenario: Error state

- **WHEN** an input has validation error
- **THEN** border SHALL use error color
- **AND** error message SHALL be displayed below input in error color

### Requirement: Select dropdowns SHALL have custom styling

The system SHALL style select elements consistently with other form controls.

#### Scenario: Select appearance

- **WHEN** a select element is displayed
- **THEN** native appearance SHALL be hidden
- **AND** custom dropdown arrow icon SHALL be shown
- **AND** padding and border SHALL match input styling

### Requirement: Checkboxes SHALL have accent color

The system SHALL apply primary color to checkbox accents.

#### Scenario: Checkbox styling

- **WHEN** a checkbox is displayed
- **THEN** accent-color SHALL be set to primary color

### Requirement: Labels SHALL have consistent typography

The system SHALL style form labels consistently.

#### Scenario: Label styling

- **WHEN** a form label is displayed
- **THEN** font-weight SHALL be 500
- **AND** color SHALL use secondary text color
- **AND** font-size SHALL be caption size (0.875x)
