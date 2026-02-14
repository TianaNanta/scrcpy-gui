# API Contracts: Validation System

**Date**: February 14, 2026
**Purpose**: Define contracts for validation functions and data structures.

## Validation API

### validateCommandConfiguration

Validates a complete scrcpy command configuration.

**Signature:**
```typescript
function validateCommandConfiguration(
  config: CommandConfiguration,
  deviceInfo?: DeviceInfo
): ValidationState
```

**Parameters:**
- `config`: Current option selections
- `deviceInfo`: Optional device capabilities for version-aware validation

**Returns:** Complete validation state with errors, warnings, and per-option status

**Performance:** Must complete in <50ms for real-time feedback

### validateOption

Validates a single option value.

**Signature:**
```typescript
function validateOption(
  optionName: string,
  value: any,
  config: CommandConfiguration,
  deviceInfo?: DeviceInfo
): OptionValidationState
```

**Parameters:**
- `optionName`: The option being validated
- `value`: The value to validate
- `config`: Full configuration context (for dependencies/conflicts)
- `deviceInfo`: Optional device info

**Returns:** Validation state for this specific option

### getOptionMetadata

Retrieves metadata for an option.

**Signature:**
```typescript
function getOptionMetadata(optionName: string): ScrcpyOption | null
```

**Parameters:**
- `optionName`: Option name (with or without --)

**Returns:** Option definition or null if not found

### checkConflicts

Detects conflicts in current configuration.

**Signature:**
```typescript
function checkConflicts(config: CommandConfiguration): ValidationWarning[]
```

**Parameters:**
- `config`: Current configuration

**Returns:** Array of conflict warnings

### formatCommand

Generates the scrcpy command string from configuration.

**Signature:**
```typescript
function formatCommand(config: CommandConfiguration): string
```

**Parameters:**
- `config`: Valid configuration

**Returns:** Complete scrcpy command string

**Precondition:** Configuration must be valid (no errors)

## Data Contracts

### CommandConfiguration Schema
```json
{
  "type": "object",
  "properties": {
    "options": {
      "type": "object",
      "patternProperties": {
        "^[a-zA-Z][a-zA-Z0-9-]*$": {
          "description": "Option value - type depends on option"
        }
      }
    },
    "deviceInfo": { "$ref": "#/definitions/DeviceInfo" }
  },
  "required": ["options"]
}
```

### ValidationState Schema
```json
{
  "type": "object",
  "properties": {
    "isValid": { "type": "boolean" },
    "errors": {
      "type": "array",
      "items": { "$ref": "#/definitions/ValidationError" }
    },
    "warnings": {
      "type": "array",
      "items": { "$ref": "#/definitions/ValidationWarning" }
    },
    "optionStates": {
      "type": "object",
      "patternProperties": {
        ".*": { "$ref": "#/definitions/OptionValidationState" }
      }
    }
  },
  "required": ["isValid", "errors", "warnings", "optionStates"]
}
```

## Error Handling

All functions must handle invalid inputs gracefully:
- Unknown option names return appropriate error states
- Malformed values trigger validation errors
- Missing dependencies generate warnings/errors

## Version Compatibility

- API contracts are stable within major versions
- New options/validation rules are additive
- Breaking changes require major version bump