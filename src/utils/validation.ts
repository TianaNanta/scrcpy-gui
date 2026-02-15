// Core validation logic and rules for scrcpy command validation

import {
  ScrcpyOption,
  ValidationState,
  ValidationWarning,
  ValidationError,
  CommandConfiguration,
  DeviceInfo,
  OptionValidationState,
  ConflictRule
} from '../types/validation';

// Placeholder for scrcpy options registry - will be populated from research
export const SCRCPY_OPTIONS: ScrcpyOption[] = [
  // Connection & Device Selection
  {
    name: 'select-usb',
    shortName: 'd',
    type: 'boolean',
    category: 'connection',
    description: 'Use USB device (if exactly one connected)',
    validation: {}
  },
  {
    name: 'select-tcpip',
    shortName: 'e',
    type: 'boolean',
    category: 'connection',
    description: 'Use TCP/IP device (if exactly one connected)',
    validation: {}
  },
  {
    name: 'serial',
    shortName: 's',
    type: 'string',
    category: 'connection',
    description: 'Device serial number (mandatory if multiple devices)',
    validation: { required: false }
  },
  {
    name: 'tcpip',
    type: 'string',
    category: 'connection',
    description: 'Configure TCP/IP connection',
    validation: { pattern: /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d{1,5})?(\+\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})?$/ }
  },
  // Video Options
  {
    name: 'max-size',
    shortName: 'm',
    type: 'number',
    category: 'video',
    description: 'Max width/height (0 = unlimited)',
    validation: { min: 0 },
    defaultValue: 0
  },
  {
    name: 'video-bit-rate',
    shortName: 'b',
    type: 'number',
    category: 'video',
    description: 'Bit rate (supports K/M suffixes)',
    validation: { min: 1 },
    defaultValue: 8000000
  },
  {
    name: 'max-fps',
    type: 'number',
    category: 'video',
    description: 'Frame rate limit',
    validation: { min: 1 },
    minApiLevel: 29
  },
  {
    name: 'video-codec',
    type: 'enum',
    category: 'video',
    description: 'Video codec',
    validation: { allowedValues: ['h264', 'h265', 'av1'] },
    defaultValue: 'h264'
  },
  {
    name: 'crop',
    type: 'string',
    category: 'video',
    description: 'Crop video (width:height:x:y)',
    validation: { pattern: /^\d+:\d+:\d+:\d+$/ }
  },
  {
    name: 'no-video',
    type: 'boolean',
    category: 'video',
    description: 'Disable video',
    validation: {}
  },
  {
    name: 'video-source',
    type: 'enum',
    category: 'video',
    description: 'Video source',
    validation: { allowedValues: ['display', 'camera'] },
    defaultValue: 'display'
  },
  {
    name: 'display-id',
    type: 'number',
    category: 'video',
    description: 'Display ID to mirror',
    validation: { min: 0 },
    defaultValue: 0
  },
  // Audio Options
  {
    name: 'audio-bit-rate',
    type: 'number',
    category: 'audio',
    description: 'Audio bit rate',
    validation: { min: 1 },
    defaultValue: 128000
  },
  {
    name: 'audio-codec',
    type: 'enum',
    category: 'audio',
    description: 'Audio codec',
    validation: { allowedValues: ['opus', 'aac', 'flac', 'raw'] },
    defaultValue: 'opus'
  },
  // Control Options
  {
    name: 'no-control',
    type: 'boolean',
    category: 'control',
    description: 'Disable device control',
    validation: {}
  },
  {
    name: 'show-touches',
    type: 'boolean',
    category: 'control',
    description: 'Show touches on device',
    validation: {}
  },
  {
    name: 'keyboard',
    type: 'enum',
    category: 'control',
    description: 'Keyboard input mode',
    validation: { allowedValues: ['disabled', 'sdk', 'uhid', 'aoa'] },
    defaultValue: 'sdk'
  },
  {
    name: 'mouse',
    type: 'enum',
    category: 'control',
    description: 'Mouse input mode',
    validation: { allowedValues: ['disabled', 'sdk', 'uhid', 'aoa'] },
    defaultValue: 'sdk'
  },
  // Camera Options
  {
    name: 'camera-id',
    type: 'string',
    category: 'camera',
    description: 'Camera ID to use',
    validation: {}
  },
  {
    name: 'camera-facing',
    type: 'enum',
    category: 'camera',
    description: 'Camera facing direction',
    validation: { allowedValues: ['front', 'back', 'external'] }
  },
  {
    name: 'camera-size',
    type: 'string',
    category: 'camera',
    description: 'Camera resolution (e.g., 1920x1080)',
    validation: { pattern: /^\d+x\d+$/ }
  },
  {
    name: 'camera-ar',
    type: 'string',
    category: 'camera',
    description: 'Camera aspect ratio (e.g., 16:9)',
    validation: { pattern: /^\d+:\d+$/ }
  },
  // Device Behavior
  {
    name: 'stay-awake',
    shortName: 'w',
    type: 'boolean',
    category: 'device',
    description: 'Keep device awake while plugged in',
    validation: {}
  },
  {
    name: 'turn-screen-off',
    shortName: 'S',
    type: 'boolean',
    category: 'device',
    description: 'Turn screen off immediately',
    validation: {}
  },
  // Window Options
  {
    name: 'fullscreen',
    shortName: 'f',
    type: 'boolean',
    category: 'window',
    description: 'Start in fullscreen',
    validation: {}
  },
  // Recording
  {
    name: 'record',
    shortName: 'r',
    type: 'string',
    category: 'recording',
    description: 'Record to file',
    validation: {}
  },
  // Additional Options (from conflict rules)
  {
    name: 'otg',
    type: 'boolean',
    category: 'connection',
    description: 'Enable OTG mode',
    validation: {}
  },
  {
    name: 'no-audio',
    type: 'boolean',
    category: 'audio',
    description: 'Disable audio',
    validation: {}
  },
  {
    name: 'new-display',
    type: 'boolean',
    category: 'window',
    description: 'Create new display',
    validation: {}
  },
  {
    name: 'require-audio',
    type: 'boolean',
    category: 'audio',
    description: 'Require audio',
    validation: {}
  },
  {
    name: 'force-adb-forward',
    type: 'boolean',
    category: 'connection',
    description: 'Force ADB forwarding',
    validation: {}
  },
  {
    name: 'raw-key-events',
    type: 'boolean',
    category: 'control',
    description: 'Send raw key events',
    validation: {}
  },
  {
    name: 'prefer-text',
    type: 'boolean',
    category: 'control',
    description: 'Prefer text input',
    validation: {}
  },
  // Add more options as needed...
];

// Placeholder for conflict rules
export const CONFLICT_RULES: ConflictRule[] = [
  {
    options: ['turn-screen-off', 'show-touches'],
    reason: 'Cannot show touches on a turned off screen',
    severity: 'warning'
  },
  {
    options: ['no-control', 'keyboard'],
    reason: 'Control is disabled, keyboard options are irrelevant',
    severity: 'warning'
  },
  {
    options: ['no-control', 'mouse'],
    reason: 'Control is disabled, mouse options are irrelevant',
    severity: 'warning'
  },
  {
    options: ['video-source', 'display-id'],
    reason: 'Camera source does not use display IDs',
    severity: 'error'
  },
  {
    options: ['camera-id', 'camera-facing'],
    reason: 'Cannot specify both camera ID and facing',
    severity: 'error'
  },
  {
    options: ['camera-size', 'max-size'],
    reason: 'Camera size conflicts with max size constraint',
    severity: 'warning'
  },
  {
    options: ['camera-size', 'camera-ar'],
    reason: 'Camera size conflicts with aspect ratio constraint',
    severity: 'warning'
  },
  {
    options: ['otg', 'tcpip'],
    reason: 'OTG is USB-only, TCP/IP is network',
    severity: 'error'
  },
  {
    options: ['no-video', 'video-codec'],
    reason: 'Video disabled, codec options are irrelevant',
    severity: 'warning'
  },
  {
    options: ['no-video', 'crop'],
    reason: 'Video disabled, crop options are irrelevant',
    severity: 'warning'
  },
  {
    options: ['no-control', 'show-touches'],
    reason: 'Control disabled, touch display is irrelevant',
    severity: 'warning'
  },
  {
    options: ['new-display', 'otg'],
    reason: 'Virtual displays may not work in OTG mode',
    severity: 'warning'
  },
  {
    options: ['require-audio', 'no-audio'],
    reason: 'Contradictory audio requirements',
    severity: 'error'
  },
  {
    options: ['force-adb-forward', 'tcpip'],
    reason: 'Forwarding not needed for TCP/IP connections',
    severity: 'warning'
  },
  {
    options: ['raw-key-events', 'prefer-text'],
    reason: 'Conflicting input modes',
    severity: 'error'
  },
  // Add more conflicts as identified
];

// Pre-computed conflict map for O(1) lookups - PERFORMANCE OPTIMIZATION
const CONFLICT_MAP = new Map<string, ConflictRule[]>();
CONFLICT_RULES.forEach(rule => {
  rule.options.forEach(option => {
    if (!CONFLICT_MAP.has(option)) {
      CONFLICT_MAP.set(option, []);
    }
    CONFLICT_MAP.get(option)!.push(rule);
  });
});

/**
 * Validates a complete scrcpy command configuration
 */
export function validateCommandConfiguration(
  config: CommandConfiguration,
  deviceInfo?: DeviceInfo
): ValidationState {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const optionStates: Record<string, OptionValidationState> = {};

  // Validate individual options
  for (const [optionName, value] of Object.entries(config.options)) {
    const optionValidation = validateOption(optionName, value, config, deviceInfo);
    optionStates[optionName] = optionValidation;

    if (!optionValidation.isValid && optionValidation.error) {
      errors.push(optionValidation.error);
    }
  }

  // Check for conflicts
  const conflicts = checkConflicts(config);
  const errorConflicts = conflicts.filter(c => c.severity === 'error');
  const warningConflicts = conflicts.filter(c => c.severity === 'warning');
  
  errors.push(...errorConflicts.map(c => ({ ...c, code: c.code } as ValidationError)));
  warnings.push(...warningConflicts);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    optionStates
  };
}

/**
 * Validates a single option value
 */
export function validateOption(
  optionName: string,
  value: any,
  _config: CommandConfiguration,
  deviceInfo?: DeviceInfo
): OptionValidationState {
  const option = getOptionMetadata(optionName);
  if (!option) {
    return {
      isValid: false,
      error: {
        option: optionName,
        message: `Unknown option: ${optionName}`,
        code: 'UNKNOWN_OPTION'
      }
    };
  }

  // Check API level compatibility
  if (option.minApiLevel && deviceInfo && deviceInfo.androidVersion < option.minApiLevel) {
    return {
      isValid: false,
      error: {
        option: optionName,
        message: `Requires Android API ${option.minApiLevel}+ (current: ${deviceInfo.androidVersion})`,
        code: 'API_LEVEL_TOO_LOW'
      }
    };
  }

  // Apply validation rules
  const validation = option.validation;
  if (!validation) {
    return { isValid: true };
  }

  // Required check
  if (validation.required && (value === undefined || value === null || value === '')) {
    return {
      isValid: false,
      error: {
        option: optionName,
        message: 'This option is required',
        code: 'REQUIRED_OPTION_MISSING'
      }
    };
  }

  // Type-specific validation
  if (value !== undefined && value !== null) {
    switch (option.type) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return {
            isValid: false,
            error: {
              option: optionName,
              message: 'Must be a valid number',
              code: 'INVALID_NUMBER'
            }
          };
        }
        if (validation.min !== undefined && value < validation.min) {
          return {
            isValid: false,
            error: {
              option: optionName,
              message: `Must be at least ${validation.min}`,
              code: 'VALUE_TOO_LOW'
            }
          };
        }
        if (validation.max !== undefined && value > validation.max) {
          return {
            isValid: false,
            error: {
              option: optionName,
              message: `Must be at most ${validation.max}`,
              code: 'VALUE_TOO_HIGH'
            }
          };
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          return {
            isValid: false,
            error: {
              option: optionName,
              message: 'Must be a string',
              code: 'INVALID_STRING'
            }
          };
        }
        if (validation.pattern && !validation.pattern.test(value)) {
          return {
            isValid: false,
            error: {
              option: optionName,
              message: 'Invalid format',
              code: 'INVALID_FORMAT'
            }
          };
        }
        break;

      case 'enum':
        if (validation.allowedValues && !validation.allowedValues.includes(value)) {
          return {
            isValid: false,
            error: {
              option: optionName,
              message: `Must be one of: ${validation.allowedValues.join(', ')}`,
              code: 'INVALID_ENUM_VALUE'
            }
          };
        }
        break;
    }

    // Custom validator
    if (validation.customValidator) {
      const customError = validation.customValidator(value);
      if (customError) {
        return {
          isValid: false,
          error: customError
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Retrieves metadata for an option
 */
export function getOptionMetadata(optionName: string): ScrcpyOption | null {
  // Handle short names
  const option = SCRCPY_OPTIONS.find(opt =>
    opt.name === optionName || opt.shortName === optionName
  );
  return option || null;
}

/**
 * Detects conflicts in current configuration - OPTIMIZED for performance
 */
export function checkConflicts(config: CommandConfiguration): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const selectedOptions = new Set(Object.keys(config.options));
  const processedRules = new Set<ConflictRule>();

  // Use conflict map for O(1) lookups - only check rules relevant to selected options
  for (const option of selectedOptions) {
    const relevantRules = CONFLICT_MAP.get(option) || [];
    for (const rule of relevantRules) {
      if (processedRules.has(rule)) continue; // Avoid duplicate processing
      processedRules.add(rule);

      const conflictingOptions = rule.options.filter(opt => {
        const value = config.options[opt];
        const optionMeta = getOptionMetadata(opt);
        
        // Skip if option not set or has default value
        if (value === undefined || value === null) return false;
        if (optionMeta?.defaultValue !== undefined && value === optionMeta.defaultValue) return false;
        
        // For boolean options, only conflict if truthy
        if (optionMeta?.type === 'boolean') {
          return value === true;
        }
        // For string options, only conflict if non-empty
        if (optionMeta?.type === 'string') {
          return value !== '';
        }
        // For other options, conflict if present
        return true;
      });
      if (conflictingOptions.length > 1) {
        warnings.push({
          option: conflictingOptions[0], // Attach to first conflicting option
          message: `Conflict: ${rule.reason}`,
          code: 'OPTION_CONFLICT',
          severity: rule.severity
        });
      }
    }
  }

  return warnings;
}

/**
 * Generates the scrcpy command string from configuration
 */
export function formatCommand(config: CommandConfiguration): string {
  const parts = ['scrcpy'];

  for (const [optionName, value] of Object.entries(config.options)) {
    const option = getOptionMetadata(optionName);
    if (!option) continue;

    // Skip options with default values or falsy values
    if (value === option.defaultValue || (!value && option.type === 'boolean')) continue;

    if (option.type === 'boolean') {
      if (value) {
        parts.push(`--${optionName}`);
      }
    } else {
      parts.push(`--${optionName}=${value}`);
    }
  }

  return parts.join(' ');
}