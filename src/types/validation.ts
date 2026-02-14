// Validation-related type definitions for scrcpy command validation

export interface ScrcpyOption {
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

export type OptionType = 'boolean' | 'string' | 'number' | 'enum' | 'array' | 'special';

export type OptionCategory =
  | 'connection'
  | 'video'
  | 'audio'
  | 'camera'
  | 'control'
  | 'window'
  | 'recording'
  | 'device'
  | 'otg'
  | 'misc';

export interface ValidationRule {
  required?: boolean;              // If option must be provided
  min?: number;                    // For numbers: minimum value
  max?: number;                    // For numbers: maximum value
  pattern?: RegExp;                // For strings: regex pattern
  allowedValues?: string[];        // For enums: allowed values
  customValidator?: (value: any) => ValidationError | null;
}

export interface DependencyRule {
  option: string;                  // Required option name
  value?: any;                     // Required value (if not just presence)
  condition: 'required' | 'requires' | 'excludes';
}

export interface ConflictRule {
  options: string[];               // Conflicting option names
  reason: string;                  // Human-readable explanation
  severity: 'error' | 'warning';   // Whether to block or just warn
}

export interface ValidationState {
  isValid: boolean;                // Overall validity
  errors: ValidationError[];       // Blocking validation errors
  warnings: ValidationWarning[];   // Non-blocking issues
  optionStates: Record<string, OptionValidationState>;
}

export interface OptionValidationState {
  isValid: boolean;
  error?: ValidationError;
  warning?: ValidationWarning;
}

export interface ValidationError {
  option: string;
  message: string;
  code: string;                    // e.g., "INVALID_RANGE", "MISSING_DEPENDENCY"
}

export interface ValidationWarning {
  option: string;
  message: string;
  code: string;                    // e.g., "CONFLICT_DETECTED", "API_LEVEL_WARNING"
  severity?: 'error' | 'warning';  // Whether to block execution or just warn
}

export interface CommandConfiguration {
  options: Record<string, any>;    // Key-value pairs of selected options
  deviceInfo?: DeviceInfo;         // For API-level aware validation
}

export interface DeviceInfo {
  androidVersion: number;          // API level
  hasCameraSupport: boolean;
  supportedCodecs: string[];
  // Additional device capabilities
}