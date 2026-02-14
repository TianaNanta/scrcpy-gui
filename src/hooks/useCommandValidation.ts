// Hook for real-time command validation state management

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  CommandConfiguration,
  ValidationState,
  ValidationError,
  ValidationWarning
} from '../types/validation';
import {
  validateCommandConfiguration
} from '../utils/validation';

export interface UseCommandValidationReturn {
  config: CommandConfiguration;
  validation: ValidationState;
  updateOption: (optionName: string, value: any) => void;
  validateConfig: () => ValidationState;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  isValid: boolean;
}

export function useCommandValidation(
  currentSettings: Partial<CommandConfiguration>
): UseCommandValidationReturn {
  const [config, setConfig] = useState<CommandConfiguration>({
    options: {},
    ...currentSettings
  });

  // Sync config with currentSettings changes
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      ...currentSettings
    }));
  }, [currentSettings]);

  // Memoize validation to avoid unnecessary recalculations
  const validation = useMemo(() => {
    return validateCommandConfiguration(config);
  }, [config]);

  const updateOption = useCallback((optionName: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [optionName]: value
      }
    }));
  }, []);

  const validateConfig = useCallback(() => {
    return validateCommandConfiguration(config);
  }, [config]);

  return {
    config,
    validation,
    updateOption,
    validateConfig,
    errors: validation.errors,
    warnings: validation.warnings,
    isValid: validation.isValid
  };
}