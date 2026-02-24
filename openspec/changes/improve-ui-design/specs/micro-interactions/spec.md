## ADDED Requirements

### Requirement: Hover states SHALL have smooth transitions

The system SHALL provide animated hover feedback on interactive elements.

#### Scenario: Button hover animation

- **WHEN** user hovers over a button
- **THEN** the button SHALL transition background and transform over 200ms
- **AND** the button SHALL lift slightly (translateY -2px) for primary buttons

#### Scenario: Card hover animation

- **WHEN** user hovers over a device card
- **THEN** the card SHALL transition shadow and border-color over 200ms
- **AND** the card SHALL lift slightly (translateY -2px)

### Requirement: Click states SHALL provide visual feedback

The system SHALL provide animated feedback on click/tap interactions.

#### Scenario: Button press animation

- **WHEN** user clicks a button
- **THEN** the button SHALL scale down briefly (0.97 scale) over 120ms

### Requirement: Loading states SHALL show animated indicators

The system SHALL display animated loading indicators for async operations.

#### Scenario: Refresh button loading

- **WHEN** a refresh operation is in progress
- **THEN** the refresh icon SHALL rotate continuously (spin animation)

#### Scenario: Button loading state

- **WHEN** a button triggers an async operation
- **THEN** the button SHALL show a spinning loader and disable interaction

### Requirement: Transitions SHALL respect reduced motion preference

The system SHALL disable or minimize animations when user prefers reduced motion.

#### Scenario: Reduced motion enabled

- **WHEN** user has `prefers-reduced-motion: reduce` set
- **THEN** all animation durations SHALL be set to 0ms
- **AND** iteration counts SHALL be limited to 1

### Requirement: Focus states SHALL have visible indicators

The system SHALL provide animated focus indicators for keyboard navigation.

#### Scenario: Focus ring animation

- **WHEN** an element receives focus via keyboard
- **THEN** a focus ring SHALL appear with smooth transition
- **AND** the focus ring SHALL use `--color-focus-ring` token

### Requirement: Status dot SHALL pulse for online devices

The system SHALL animate the status indicator for connected devices.

#### Scenario: Online status pulse

- **WHEN** a device is online
- **THEN** the status dot SHALL pulse (scale 1 to 1.5, opacity 1 to 0.6) every 2 seconds
