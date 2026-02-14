# Data Model: Real-time Command Validation & Flag Conflicts

**Date**: February 14, 2026
**Purpose**: Define data structures and relationships for scrcpy command validation system.

## Overview

The validation system uses a centralized configuration-driven approach with TypeScript interfaces for type safety. Data models include option definitions, validation rules, conflict matrices, and validation state management.

## Core Data Models

### ScrcpyOption

Represents a single scrcpy command-line flag/option with metadata for validation.

```typescript
interface ScrcpyOption {
  name: string;                    // e.g., "max-size", "video-codec"
  shortName?: string;              // e.g., "m", "b"
  type: OptionType;                // boolean | string | number | enum | array | special
  category: OptionCategory;        // connection | video | audio | camera | control | etc.
  description: string;             // Human-readable description
  defaultValue?: any;              // Default value if applicable
  validation: ValidationRule;      // Validation constraints
  dependencies?: DependencyRule[]; // Required/conditional options
  conflicts?: string[];            // Option names that conflict
  minApiLevel?: number;            // Minimum Android API level
  experimental?: boolean;          // If option is experimental/unstable
}
```

### ValidationRule

Defines validation logic for an option value.

```typescript
interface ValidationRule {
  required?: boolean;              // If option must be provided
  min?: number;                    // For numbers: minimum value
  max?: number;                    // For numbers: maximum value
  pattern?: RegExp;                // For strings: regex pattern
  allowedValues?: string[];        // For enums: allowed values
  customValidator?: (value: any) => ValidationError | null;
}
```

### DependencyRule

Defines conditional requirements between options.

```typescript
interface DependencyRule {
  option: string;                  // Required option name
  value?: any;                     // Required value (if not just presence)
  condition: 'required' | 'requires' | 'excludes';
}
```

### ConflictMatrix

Defines incompatible option combinations.

```typescript
interface ConflictRule {
  options: string[];               // Conflicting option names
  reason: string;                  // Human-readable explanation
  severity: 'error' | 'warning';   // Whether to block or just warn
}
```

### ValidationState

Represents the current validation status of a command configuration.

```typescript
interface ValidationState {
  isValid: boolean;                // Overall validity
  errors: ValidationError[];       // Blocking validation errors
  warnings: ValidationWarning[];   // Non-blocking issues
  optionStates: Record<string, OptionValidationState>;
}

interface OptionValidationState {
  isValid: boolean;
  error?: ValidationError;
  warning?: ValidationWarning;
}

interface ValidationError {
  option: string;
  message: string;
  code: string;                    // e.g., "INVALID_RANGE", "MISSING_DEPENDENCY"
}

interface ValidationWarning {
  option: string;
  message: string;
  code: string;                    // e.g., "CONFLICT_DETECTED", "API_LEVEL_WARNING"
}
```

### CommandConfiguration

Represents the user's current scrcpy option selections.

```typescript
interface CommandConfiguration {
  options: Record<string, any>;    // Key-value pairs of selected options
  deviceInfo?: DeviceInfo;         // For API-level aware validation
}

interface DeviceInfo {
  androidVersion: number;          // API level
  hasCameraSupport: boolean;
  supportedCodecs: string[];
  // Additional device capabilities
}
```

## Data Relationships

```
ScrcpyOption (1) --> (many) ValidationRule
ScrcpyOption (many) --> (many) DependencyRule
ScrcpyOption (many) --> (many) ConflictRule

CommandConfiguration --> ValidationState
ValidationState --> OptionValidationState (per option)
```

## Data Flow

1. **Configuration Input**: User selects options in GUI → `CommandConfiguration`
2. **Validation Processing**: Apply `ValidationRule`s, check `DependencyRule`s, detect `ConflictRule`s
3. **State Output**: Generate `ValidationState` with errors/warnings
4. **UI Feedback**: Display validation status in real-time

## Storage Strategy

- **Static Configuration**: `ScrcpyOption[]`, `ConflictRule[]` stored as JSON/TS constants
- **Runtime State**: `ValidationState` managed in React state/hooks
- **No Persistence**: Validation rules are static, user configs are session-only

## Validation Logic

### Option-Level Validation
- Type checking based on `OptionType`
- Range/pattern validation using `ValidationRule`
- Custom validators for complex logic (e.g., IP address format)

### Dependency Validation
- Check required options are present
- Validate conditional requirements (e.g., camera options require `video-source=camera`)

### Conflict Detection
- Matrix lookup for incompatible combinations
- API-level filtering for version-specific conflicts

### Performance Considerations
- Validation runs on every change (<100ms target)
- Memoization of expensive checks
- Incremental validation (only re-validate changed options and dependencies)