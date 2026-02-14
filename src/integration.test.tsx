// Integration tests for validation system across user stories

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { validateCommandConfiguration, formatCommand } from './utils/validation';
import CommandPreview from './components/CommandPreview';
import { createTestDeviceSettings, createTestValidationConfig } from './test-setup';

describe('Validation System Integration', () => {
  describe('User Story 1 + 2 + 3 Integration', () => {
    it('should validate, detect conflicts, and show status in command preview', () => {
      // Test configuration with conflicts (US2)
      const config = createTestValidationConfig({
        'turn-screen-off': true,
        'show-touches': true, // This conflicts with turn-screen-off
        'max-size': -1 // This is invalid (US1)
      });

      const validation = validateCommandConfiguration(config);

      // Should detect both error and conflict
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.warnings.length).toBeGreaterThan(0);

      // Command should still be formatted (US3)
      const command = formatCommand(config, validation);
      expect(command).toContain('scrcpy');
      expect(command).toContain('--turn-screen-off');
      expect(command).toContain('--show-touches');
    });

    it('should show validation status in CommandPreview component', () => {
      const config = createTestValidationConfig({
        'max-size': 1920,
        'fullscreen': true
      });

      const validation = validateCommandConfiguration(config);

      render(<CommandPreview command={formatCommand(config)} validationState={validation} />);

      // Should show valid status
      expect(screen.getByText('Valid Command:')).toBeInTheDocument();
      const checkIcon = document.querySelector('.status-icon.valid');
      expect(checkIcon).toBeInTheDocument();
    });

    it('should highlight invalid options in command preview', () => {
      const config = createTestValidationConfig({
        'max-size': -1, // Invalid
        'fullscreen': true
      });

      const validation = validateCommandConfiguration(config);
      const command = formatCommand(config);

      render(<CommandPreview command={command} validationState={validation} />);

      // Should show error status and highlight invalid option
      expect(screen.getByText('Command Has Errors:')).toBeInTheDocument();
      const invalidSpan = document.querySelector('.command-invalid');
      expect(invalidSpan).toBeInTheDocument();
    });
  });

  describe('Device Settings Modal Integration', () => {
    it('should integrate validation with device settings', () => {
      const settings = createTestDeviceSettings();
      settings.bitrate = -1000; // Invalid bitrate
      settings.turnScreenOff = true;
      settings.showTouches = true; // Conflicting options

      // Create validation config as done in DeviceSettingsModal
      const validationConfig = {
        options: {
          'video-bit-rate': settings.bitrate,
          'turn-screen-off': settings.turnScreenOff,
          'show-touches': settings.showTouches,
          'no-control': settings.noControl,
        }
      };

      const validation = validateCommandConfiguration(validationConfig);

      // Should detect both validation error and conflict
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.code === 'VALUE_TOO_LOW')).toBe(true);
      expect(validation.warnings.some(w => w.code === 'OPTION_CONFLICT')).toBe(true);
    });
  });

  describe('Performance Validation', () => {
    it('should validate configurations quickly (< 50ms)', () => {
      const config = createTestValidationConfig({
        'max-size': 1920,
        'video-bit-rate': 8000000,
        'fullscreen': true,
        'turn-screen-off': true,
        'show-touches': true, // Creates conflict
      });

      const startTime = performance.now();
      const validation = validateCommandConfiguration(config);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Validation Flow', () => {
    it('should handle complete validation workflow', () => {
      // Start with invalid config
      let config = createTestValidationConfig({
        'max-size': -1,
        'turn-screen-off': true,
        'show-touches': true
      });

      let validation = validateCommandConfiguration(config);
      expect(validation.isValid).toBe(false);

      // Fix the invalid value
      config = createTestValidationConfig({
        'max-size': 1920,
        'turn-screen-off': true,
        'show-touches': true
      });

      validation = validateCommandConfiguration(config);
      expect(validation.isValid).toBe(true); // Valid but has warnings
      expect(validation.errors.length).toBe(0); // No errors, only warnings
      expect(validation.warnings.length).toBeGreaterThan(0);

      // Fix the conflict
      config = createTestValidationConfig({
        'max-size': 1920,
        'turn-screen-off': false,
        'show-touches': true
      });

      validation = validateCommandConfiguration(config);
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
      expect(validation.warnings.length).toBe(0);
    });
  });
});