## ADDED Requirements

### Requirement: All components SHALL have corresponding test files

The system SHALL require test files for all React components to ensure reliability and prevent regressions.

#### Scenario: Component without test file

- **WHEN** a component exists without a corresponding test file
- **THEN** the test coverage report SHALL flag the component as uncovered
- **AND** CI/CD pipeline SHALL warn about missing coverage

#### Scenario: Component test file structure

- **WHEN** creating a new test file for a component
- **THEN** the test file SHALL be named `<ComponentName>.test.tsx`
- **AND** the test file SHALL be located in the same directory as the component
- **AND** the test file SHALL include rendering, interaction, and edge case test suites

### Requirement: DeviceSettingsModal component SHALL be fully tested

The system SHALL provide comprehensive test coverage for the DeviceSettingsModal component.

#### Scenario: Modal renders with device settings

- **WHEN** the DeviceSettingsModal is rendered with a device
- **THEN** it SHALL display the device name input
- **AND** it SHALL display all settings panels
- **AND** it SHALL display the command preview

#### Scenario: Modal saves settings on confirm

- **WHEN** user modifies settings and clicks Save
- **THEN** the modal SHALL call onSave with updated settings
- **AND** the modal SHALL close

#### Scenario: Modal closes on cancel

- **WHEN** user clicks Cancel
- **THEN** the modal SHALL close without saving changes
- **AND** the modal SHALL NOT call onSave

### Requirement: PairDeviceModal component SHALL be fully tested

The system SHALL provide comprehensive test coverage for the PairDeviceModal component.

#### Scenario: Modal renders pair mode options

- **WHEN** the PairDeviceModal is opened
- **THEN** it SHALL display USB pairing option
- **AND** it SHALL display wireless pairing option

#### Scenario: USB device pairing flow

- **WHEN** user selects USB pairing mode
- **THEN** the modal SHALL display available USB devices
- **AND** user SHALL be able to select a device to pair

#### Scenario: Wireless pairing flow

- **WHEN** user selects wireless pairing mode
- **THEN** the modal SHALL display IP address input
- **AND** the modal SHALL display port input
- **AND** the modal SHALL validate IP address format

### Requirement: FavoriteStar component SHALL be tested

The system SHALL provide test coverage for the FavoriteStar component.

#### Scenario: Star renders as filled when favorited

- **WHEN** the FavoriteStar is rendered with isFavorite=true
- **THEN** the star icon SHALL be filled/solid

#### Scenario: Star renders as outline when not favorited

- **WHEN** the FavoriteStar is rendered with isFavorite=false
- **THEN** the star icon SHALL be outline/hollow

#### Scenario: Star toggles on click

- **WHEN** user clicks the FavoriteStar
- **THEN** the onToggle callback SHALL be called

### Requirement: TagBadge component SHALL be tested

The system SHALL provide test coverage for the TagBadge component.

#### Scenario: Badge renders with label

- **WHEN** the TagBadge is rendered with a label
- **THEN** it SHALL display the label text

#### Scenario: Badge calls onRemove when remove clicked

- **WHEN** user clicks the remove button
- **THEN** the onRemove callback SHALL be called

### Requirement: TagInput component SHALL be tested

The system SHALL provide test coverage for the TagInput component.

#### Scenario: Input renders tags

- **WHEN** the TagInput is rendered with initial tags
- **THEN** it SHALL display each tag as a TagBadge

#### Scenario: Input adds tag on Enter

- **WHEN** user types text and presses Enter
- **THEN** the onTagsChange callback SHALL be called with updated tags
- **AND** the input field SHALL be cleared

#### Scenario: Input removes tag on badge remove

- **WHEN** user clicks remove on a tag badge
- **THEN** the onTagsChange callback SHALL be called without that tag

### Requirement: useCommandValidation hook SHALL be tested

The system SHALL provide test coverage for the useCommandValidation hook.

#### Scenario: Hook returns validation state

- **WHEN** the hook is called with settings
- **THEN** it SHALL return validation errors array
- **AND** it SHALL return isValid boolean

#### Scenario: Hook detects invalid settings

- **WHEN** settings contain conflicting options
- **THEN** the errors array SHALL include validation error messages

### Requirement: useScrcpyOptions hook SHALL be tested

The system SHALL provide test coverage for the useScrcpyOptions hook.

#### Scenario: Hook returns options object

- **WHEN** the hook is called
- **THEN** it SHALL return scrcpy options with current values

#### Scenario: Hook updates options on settings change

- **WHEN** settings are updated
- **THEN** the returned options SHALL reflect the changes

### Requirement: error-messages utility SHALL be tested

The system SHALL provide test coverage for the error-messages utility module.

#### Scenario: getErrorMessage extracts message from Error

- **WHEN** getErrorMessage is called with Error object
- **THEN** it SHALL return the error message string

#### Scenario: getErrorMessage handles string error

- **WHEN** getErrorMessage is called with string
- **THEN** it SHALL return the string as-is

#### Scenario: getErrorMessage handles unknown error

- **WHEN** getErrorMessage is called with unknown type
- **THEN** it SHALL return a fallback error message
