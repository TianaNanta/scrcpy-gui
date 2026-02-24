## ADDED Requirements

### Requirement: App.tsx SHALL use extracted custom hooks for state management

The system SHALL refactor App.tsx to delegate state management to extracted custom hooks.

#### Scenario: App uses useDeviceManager hook

- **WHEN** App.tsx needs device state or operations
- **THEN** it SHALL use the useDeviceManager hook
- **AND** the hook SHALL provide devices, loading state, and CRUD operations

#### Scenario: App uses useDeviceSettingsManager hook

- **WHEN** App.tsx needs device settings or presets
- **THEN** it SHALL use the useDeviceSettingsManager hook
- **AND** the hook SHALL provide settings, presets, and management functions

#### Scenario: App uses usePairDevice hook

- **WHEN** App.tsx needs pair modal state or operations
- **THEN** it SHALL use the usePairDevice hook
- **AND** the hook SHALL provide modal state and pairing functions

#### Scenario: App uses useAppearance hook

- **WHEN** App.tsx needs theme or font settings
- **THEN** it SHALL use the useAppearance hook
- **AND** the hook SHALL provide theme, color scheme, and font size state

#### Scenario: App uses useLogger hook

- **WHEN** App.tsx needs logging functionality
- **THEN** it SHALL use the useLogger hook
- **AND** the hook SHALL provide logs array and addLog function

### Requirement: useDeviceManager hook SHALL manage device state

The system SHALL provide a useDeviceManager hook for device CRUD operations.

#### Scenario: Hook initializes with empty devices

- **WHEN** the hook is first called
- **THEN** it SHALL return empty devices array
- **AND** it SHALL return loading state as false

#### Scenario: Hook provides refreshDevices function

- **WHEN** refreshDevices is called
- **THEN** it SHALL fetch devices from Tauri backend
- **AND** it SHALL update devices state

#### Scenario: Hook provides active devices tracking

- **WHEN** a device starts or stops mirroring
- **THEN** the activeDevices array SHALL be updated

### Requirement: useDeviceSettingsManager hook SHALL manage device settings

The system SHALL provide a useDeviceSettingsManager hook for device settings and presets.

#### Scenario: Hook loads device settings from storage

- **WHEN** the hook initializes
- **THEN** it SHALL load settings from localStorage
- **AND** it SHALL apply migrations if needed

#### Scenario: Hook saves device settings

- **WHEN** saveDeviceSettings is called with serial and settings
- **THEN** the settings SHALL be persisted to localStorage
- **AND** the settings state SHALL be updated

#### Scenario: Hook manages presets

- **WHEN** preset operations are called
- **THEN** presets SHALL be loaded, saved, and deleted correctly
- **AND** preset favorites SHALL be toggled

### Requirement: usePairDevice hook SHALL manage pairing modal

The system SHALL provide a usePairDevice hook for device pairing operations.

#### Scenario: Hook provides modal state

- **WHEN** the hook is called
- **THEN** it SHALL return showPairModal boolean
- **AND** it SHALL return pairMode (usb/wireless/null)

#### Scenario: Hook provides pairing functions

- **WHEN** the hook is called
- **THEN** it SHALL return pairWireless function
- **AND** it SHALL return pairUsb function
- **AND** it SHALL return openPairModal function

#### Scenario: Hook handles wireless pairing

- **WHEN** pairWireless is called with IP and port
- **THEN** it SHALL invoke Tauri connect command
- **AND** it SHALL update connecting state

### Requirement: useAppearance hook SHALL manage theme settings

The system SHALL provide a useAppearance hook for theme and appearance settings.

#### Scenario: Hook provides theme state

- **WHEN** the hook is called
- **THEN** it SHALL return current theme (light/dark/system)

#### Scenario: Hook provides theme toggle

- **WHEN** setTheme is called
- **THEN** the theme SHALL be updated
- **AND** the theme SHALL be persisted

#### Scenario: Hook provides font size state

- **WHEN** the hook is called
- **THEN** it SHALL return current font size
- **AND** it SHALL return setFontSize function

### Requirement: useLogger hook SHALL manage logging

The system SHALL provide a useLogger hook for log management.

#### Scenario: Hook provides logs array

- **WHEN** the hook is called
- **THEN** it SHALL return logs array with all log entries

#### Scenario: Hook provides addLog function

- **WHEN** addLog is called with level and message
- **THEN** a new log entry SHALL be added to logs
- **AND** the log SHALL include timestamp

#### Scenario: Hook persists logs

- **WHEN** logs are added
- **THEN** logs SHALL be persisted to storage
- **AND** logs SHALL be limited to maximum count

### Requirement: Extracted hooks SHALL be independently testable

The system SHALL ensure all extracted hooks can be tested in isolation.

#### Scenario: Hook can be tested without App component

- **WHEN** writing tests for a custom hook
- **THEN** the hook SHALL be importable independently
- **AND** the hook SHALL work when rendered with renderHook

#### Scenario: Hook dependencies are mockable

- **WHEN** testing a hook that uses Tauri APIs
- **THEN** the Tauri APIs SHALL be mockable
- **AND** the hook SHALL work with mocked implementations

### Requirement: App.tsx SHALL be reduced to orchestration

The system SHALL reduce App.tsx to primarily orchestrate hooks and render components.

#### Scenario: App.tsx contains minimal state

- **WHEN** refactoring is complete
- **THEN** App.tsx SHALL contain fewer than 10 useState hooks
- **AND** App.tsx SHALL be fewer than 300 lines

#### Scenario: App.tsx delegates to hooks

- **WHEN** App.tsx needs state or operations
- **THEN** it SHALL use extracted hooks
- **AND** it SHALL NOT contain business logic directly
