// Quickstart validation scenarios - ensures documented examples work correctly

import { describe, it, expect } from 'vitest';
import { validateCommandConfiguration, formatCommand } from './utils/validation';
import { createTestValidationConfig } from './test-setup';

describe('Quickstart Validation Scenarios', () => {
  describe('Basic Usage Examples', () => {
    it('should validate the documented valid configuration', () => {
      const validation = validateCommandConfiguration(createTestValidationConfig({
        'video-bit-rate': 8000000, // 8M
        'max-fps': 30,
        // Audio source defaults to output
      }));
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
      expect(validation.warnings.length).toBe(0);
    });

    it('should detect the documented invalid configuration', () => {
      const validation = validateCommandConfiguration(createTestValidationConfig({
        'video-bit-rate': -1, // Invalid negative value
        'max-fps': 30,
        // Audio source defaults to output
      }));
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0].code).toBe('VALUE_TOO_LOW');
    });

    it('should detect the documented conflicting configuration', () => {
      const validation = validateCommandConfiguration(createTestValidationConfig({
        'turn-screen-off': true,
        'show-touches': true,
      }));
      expect(validation.isValid).toBe(true); // Valid but with warnings
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0].code).toBe('OPTION_CONFLICT');
      expect(validation.warnings[0].message).toContain('Cannot show touches on a turned off screen');
    });
  });

  describe('Command Preview Examples', () => {
    it('should format valid command as documented', () => {
      const config = createTestValidationConfig({
        'video-bit-rate': 8000000,
        'max-fps': 30,
      });

      const command = formatCommand(config);
      expect(command).toContain('scrcpy');
      expect(command).toContain('--max-fps=30');
    });

    it('should handle invalid command formatting', () => {
      const config = createTestValidationConfig({
        'video-bit-rate': -1,
        'max-fps': 30,
      });

      const command = formatCommand(config);

      // Command should still be formatted even with errors
      expect(command).toContain('scrcpy');
      expect(command).toContain('--video-bit-rate=-1');
      expect(command).toContain('--max-fps=30');
    });
  });

  describe('Device-Aware Validation', () => {
    it('should validate API level compatibility', () => {
      const config = createTestValidationConfig({
        'max-fps': 60, // Requires API 29+
      });

      const deviceInfo = {
        androidVersion: 28, // API 28 doesn't support max-fps
        hasCameraSupport: false,
        supportedCodecs: []
      };

      const validation = validateCommandConfiguration(config, deviceInfo);
      expect(validation.isValid).toBe(false);
      expect(validation.errors[0].code).toBe('API_LEVEL_TOO_LOW');
    });

    it('should pass validation for compatible API levels', () => {
      const config = createTestValidationConfig({
        'max-fps': 60,
      });

      const deviceInfo = {
        androidVersion: 29, // API 29+ supports max-fps
        hasCameraSupport: false,
        supportedCodecs: []
      };

      const validation = validateCommandConfiguration(config, deviceInfo);
      // Should be valid (no API level errors for max-fps)
      const apiErrors = validation.errors.filter(e => e.code === 'API_LEVEL_TOO_LOW');
      expect(apiErrors.length).toBe(0);
    });
  });

  describe('Advanced Usage Scenarios', () => {
    it('should handle camera option dependencies', () => {
      // Camera options should work when video source is camera
      const config = createTestValidationConfig({
        'video-source': 'camera',
        'camera-facing': 'front',
      });

      const validation = validateCommandConfiguration(config);
      // Should be valid - camera options are allowed when video source is camera
      expect(validation.isValid).toBe(true);
    });

    it('should detect camera conflicts', () => {
      const config = createTestValidationConfig({
        'camera-id': '0',
        'camera-facing': 'front', // Cannot specify both
      });

      const validation = validateCommandConfiguration(config);
      expect(validation.isValid).toBe(false);
      expect(validation.errors[0].code).toBe('OPTION_CONFLICT');
    });
  });

  describe('Performance Requirements', () => {
    it('should validate within 100ms as documented', () => {
      const config = createTestValidationConfig({
        'video-bit-rate': 8000000,
        'max-fps': 60,
        'max-size': 1920,
        'fullscreen': true,
        'turn-screen-off': true,
        'show-touches': true, // Creates conflict
      });

      const startTime = performance.now();
      validateCommandConfiguration(config);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});