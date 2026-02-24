## ADDED Requirements

### Requirement: Device cards SHALL have refined visual hierarchy

The system SHALL display device cards with clear information hierarchy and enhanced styling.

#### Scenario: Card header layout

- **WHEN** a device card is displayed
- **THEN** the device name SHALL be prominent at the top
- **AND** connection type badge SHALL be clearly visible
- **AND** status indicator SHALL be adjacent to the name

#### Scenario: Card content organization

- **WHEN** a device card displays device info
- **THEN** model and Android version SHALL be in a secondary text style
- **AND** health badges (battery, storage) SHALL be grouped together
- **AND** action buttons SHALL be at the bottom with clear primary action

### Requirement: Empty states SHALL provide helpful guidance

The system SHALL display informative empty states when no devices are connected.

#### Scenario: No devices empty state

- **WHEN** no devices are connected
- **THEN** an icon SHALL be displayed with helpful message
- **AND** a "Pair New Device" button SHALL be prominently displayed

### Requirement: Loading skeleton SHALL show during data fetch

The system SHALL display skeleton placeholders while loading device data.

#### Scenario: Device list loading

- **WHEN** device list is being fetched
- **THEN** skeleton cards SHALL be displayed with shimmer animation
- **AND** skeleton cards SHALL match the approximate size of real cards

### Requirement: Buttons SHALL have consistent styling variants

The system SHALL provide consistent button variants across the application.

#### Scenario: Primary button

- **WHEN** a primary action is needed
- **THEN** button SHALL have gradient background with elevated shadow
- **AND** hover SHALL lift the button slightly

#### Scenario: Secondary button

- **WHEN** a secondary action is needed
- **THEN** button SHALL have outlined style with transparent background
- **AND** hover SHALL show border color change

#### Scenario: Icon-only button

- **WHEN** a compact action is needed
- **THEN** button SHALL be square with icon centered
- **AND** padding SHALL be minimal (0.5rem)

### Requirement: Badges SHALL use consistent styling

The system SHALL display badges (connection type, dependency status) with consistent styling.

#### Scenario: Status badge

- **WHEN** a status badge is displayed
- **THEN** it SHALL have pill-shaped border radius
- **AND** it SHALL use semantic colors for status indication
