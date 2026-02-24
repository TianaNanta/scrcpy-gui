## ADDED Requirements

### Requirement: Device list SHALL have improved header layout

The system SHALL display a clear header section with title, subtitle, and actions.

#### Scenario: Devices header

- **WHEN** the devices tab is active
- **THEN** a title "Connected Devices" SHALL be displayed with subtitle
- **AND** refresh and quick start buttons SHALL be aligned to the right

### Requirement: Device filters SHALL provide clear filtering options

The system SHALL display filter buttons for All, USB, and Wireless devices.

#### Scenario: Filter buttons

- **WHEN** device filters are displayed
- **THEN** buttons SHALL show count of devices in each category
- **AND** active filter SHALL have distinct active styling
- **AND** filter buttons SHALL include relevant icons

### Requirement: Search input SHALL filter devices in real-time

The system SHALL provide search functionality for device list.

#### Scenario: Search filtering

- **WHEN** user types in search input
- **THEN** device list SHALL filter to show only matching devices
- **AND** search SHALL match serial number and model name

### Requirement: Device grid SHALL be responsive

The system SHALL display device cards in a responsive grid layout.

#### Scenario: Grid layout

- **WHEN** devices are displayed
- **THEN** cards SHALL use `auto-fill` with min 300px columns
- **AND** cards SHALL have consistent gap (1rem)

### Requirement: Pair new device card SHALL be always visible

The system SHALL display an "add device" card at the end of the device list.

#### Scenario: Pair device card

- **WHEN** device list is displayed
- **THEN** a dashed-border card SHALL be at the end
- **AND** clicking the card SHALL open pair modal
