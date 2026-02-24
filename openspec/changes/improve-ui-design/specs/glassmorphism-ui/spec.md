## ADDED Requirements

### Requirement: Glass effect SHALL be applied to card surfaces

The system SHALL apply glassmorphism styling to device cards with semi-transparent backgrounds and backdrop blur.

#### Scenario: Device card glass effect

- **WHEN** a device card is rendered
- **THEN** the card SHALL have `background: rgba(255, 255, 255, 0.7)` (light) or `rgba(30, 41, 59, 0.7)` (dark)
- **AND** the card SHALL have `backdrop-filter: blur(12px)` with webkit prefix
- **AND** the card SHALL have a subtle border with transparency

#### Scenario: Glass effect fallback

- **WHEN** backdrop-filter is not supported
- **THEN** a solid semi-transparent background SHALL be used as fallback

### Requirement: Glass effect SHALL be applied to modal overlays

The system SHALL apply glassmorphism styling to modal dialogs.

#### Scenario: Modal glass effect

- **WHEN** a modal is displayed
- **THEN** the modal content SHALL have glass-effect styling
- **AND** the modal background SHALL be semi-transparent with blur

### Requirement: Glass effect SHALL be applied to sidebar

The system SHALL apply glassmorphism styling to the sidebar navigation.

#### Scenario: Sidebar glass effect

- **WHEN** the sidebar is visible
- **THEN** the sidebar SHALL have glass-effect styling matching the theme
- **AND** the sidebar SHALL maintain readability with sufficient contrast

### Requirement: Glass effects SHALL respect theme mode

The system SHALL adjust glass effect colors for light and dark themes.

#### Scenario: Light theme glass

- **WHEN** light theme is active
- **THEN** glass surfaces SHALL use light semi-transparent backgrounds

#### Scenario: Dark theme glass

- **WHEN** dark theme is active
- **THEN** glass surfaces SHALL use dark semi-transparent backgrounds
