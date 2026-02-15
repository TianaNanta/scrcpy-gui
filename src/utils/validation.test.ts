// Unit tests for validation functions

import { describe, it, expect } from 'vitest';
import {
  validateOption,
  checkConflicts,
  formatCommand,
  getOptionMetadata
} from './validation';

describe('validateOption', () => {
  it('should validate a valid number option', () => {
    const result = validateOption('max-size', 1920, { options: {} });
    expect(result.isValid).toBe(true);
  });

  it('should reject negative max-size', () => {
    const result = validateOption('max-size', -1, { options: {} });
    expect(result.isValid).toBe(false);
    expect(result.error?.code).toBe('VALUE_TOO_LOW');
  });

  it('should validate enum values', () => {
    const result = validateOption('video-codec', 'h264', { options: {} });
    expect(result.isValid).toBe(true);
  });

  it('should reject invalid enum values', () => {
    const result = validateOption('video-codec', 'invalid', { options: {} });
    expect(result.isValid).toBe(false);
    expect(result.error?.code).toBe('INVALID_ENUM_VALUE');
  });

  it('should check API level compatibility', () => {
    const result = validateOption('max-fps', 30, { options: {} }, { androidVersion: 28, hasCameraSupport: false, supportedCodecs: [] });
    expect(result.isValid).toBe(false);
    expect(result.error?.code).toBe('API_LEVEL_TOO_LOW');
  });
});

describe('checkConflicts', () => {
  it('should detect turn-screen-off and show-touches conflict', () => {
    const config = {
      options: {
        'turn-screen-off': true,
        'show-touches': true
      }
    };
    const conflicts = checkConflicts(config);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].code).toBe('OPTION_CONFLICT');
  });

  it('should not report conflicts when options are not selected', () => {
    const config = {
      options: {
        'turn-screen-off': true
      }
    };
    const conflicts = checkConflicts(config);
    expect(conflicts.length).toBe(0);
  });

  it('should detect camera-id and camera-facing conflict', () => {
    const config = {
      options: {
        'camera-id': '0',
        'camera-facing': 'front'
      }
    };
    const conflicts = checkConflicts(config);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].message).toContain('Cannot specify both camera ID and facing');
  });

  it('should detect no-control and show-touches conflict', () => {
    const config = {
      options: {
        'no-control': true,
        'show-touches': true
      }
    };
    const conflicts = checkConflicts(config);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].message).toContain('Control disabled');
  });

  it('should detect otg and tcpip conflict', () => {
    const config = {
      options: {
        'otg': true,
        'tcpip': '192.168.1.1:5555'
      }
    };
    const conflicts = checkConflicts(config);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].message).toContain('OTG is USB-only');
  });

  it('should detect require-audio and no-audio conflict', () => {
    const config = {
      options: {
        'require-audio': true,
        'no-audio': true
      }
    };
    const conflicts = checkConflicts(config);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].message).toContain('Contradictory audio requirements');
  });
});

describe('formatCommand', () => {
  it('should format basic command', () => {
    const config = {
      options: {
        'max-size': 1920,
        'fullscreen': true
      }
    };
    const command = formatCommand(config);
    expect(command).toContain('scrcpy');
    expect(command).toContain('--max-size=1920');
    expect(command).toContain('--fullscreen');
  });

  it('should skip default values', () => {
    const config = {
      options: {
        'video-codec': 'h264' // default value
      }
    };
    const command = formatCommand(config);
    expect(command).toBe('scrcpy');
  });

  it('should format command with validation status indicators', () => {
    const config = {
      options: {
        'max-size': 1920,
        'invalid-option': 'bad-value'
      }
    };
    const command = formatCommand(config);
    expect(command).toContain('scrcpy');
    expect(command).toContain('--max-size=1920');
    // Should still include the invalid option in the command, but validation status would be shown in UI
  });

  it('should handle validation state with conflicts', () => {
    const config = {
      options: {
        'turn-screen-off': true,
        'show-touches': true
      }
    };
    const command = formatCommand(config);
    expect(command).toContain('scrcpy');
    expect(command).toContain('--turn-screen-off');
    // Note: show-touches is not in the options registry yet, so it won't appear
  });
});

describe('getOptionMetadata', () => {
  it('should return option metadata', () => {
    const option = getOptionMetadata('max-size');
    expect(option).toBeTruthy();
    expect(option?.name).toBe('max-size');
  });

  it('should return null for unknown options', () => {
    const option = getOptionMetadata('unknown-option');
    expect(option).toBeNull();
  });
});