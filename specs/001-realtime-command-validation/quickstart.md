# Quickstart: Real-time Command Validation

**Date**: February 14, 2026
**Purpose**: Guide for using the real-time validation feature in the scrcpy GUI.

## Overview

The real-time command validation feature provides immediate feedback when configuring scrcpy options, preventing invalid commands and highlighting potential issues before execution.

## Key Features

- **Instant Feedback**: Validation occurs as you type or select options
- **Error Prevention**: Blocks execution of invalid commands
- **Conflict Detection**: Warns about incompatible option combinations
- **Clear Messages**: Actionable error and warning messages

## Using the Validation

### 1. Configure Options Normally

Open the scrcpy GUI and select your desired options as usual. The validation works automatically in the background.

### 2. Monitor Validation Status

- **Green Checkmark**: Configuration is valid and ready to execute
- **Red Error Icon**: One or more blocking errors prevent execution
- **Yellow Warning Icon**: Potential issues that may cause problems

### 3. Address Validation Issues

#### Common Error Types

**Invalid Values:**
- Numeric fields show "Value must be between X and Y"
- String fields highlight format requirements
- Enum fields list allowed values

**Missing Dependencies:**
- Camera options require "Video Source: Camera"
- Audio duplication requires "Audio Source: Playback"

**Conflicts:**
- "Cannot use both Camera ID and Camera Facing"
- "Turn Screen Off conflicts with Show Touches"

#### Resolution Steps

1. Click on error/warning indicators for detailed messages
2. Adjust conflicting options
3. Ensure all required dependencies are met
4. Verify device compatibility (API level warnings)

### 4. Execute Valid Commands

Once all errors are resolved (warnings are optional), the execute button becomes available.

## Advanced Usage

### Command Preview

The command preview area shows:
- Generated scrcpy command with all options
- Visual indicators for validated sections
- Highlighted invalid parts if present

### Device-Aware Validation

When a device is connected, validation considers:
- Android API level compatibility
- Available camera/audio features
- Supported codecs and encoders

### Custom Validation Rules

For advanced users, validation rules can be extended for:
- Organization-specific constraints
- Custom scrcpy builds with additional options

## Troubleshooting

### Validation Not Working

- Ensure device is connected for device-specific checks
- Check browser console for JavaScript errors
- Verify scrcpy version compatibility

### Unexpected Errors

- Some options may be experimental or device-specific
- Check scrcpy documentation for option details
- Report issues with specific option combinations

### Performance Issues

- Validation is optimized for <100ms response
- Large configurations may have slight delays
- Consider simplifying complex option sets

## Examples

### Valid Configuration
```
Video Bit Rate: 8M ✓
Max FPS: 30 ✓
Audio Source: Output ✓
```

### Invalid Configuration
```
Video Bit Rate: -1 ✗ (Must be positive)
Max FPS: 30 ✓
Audio Source: Playback ✓
Audio Dup: Enabled ✓
```

### Conflicting Configuration
```
Turn Screen Off: Enabled ⚠️
Show Touches: Enabled ⚠️ (Conflicts: cannot show touches on off screen)
```

The validation system ensures reliable scrcpy command generation while providing clear guidance for optimal configurations.