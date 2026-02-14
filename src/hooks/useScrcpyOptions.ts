// Hook for managing scrcpy options with validation integration

import { useState, useCallback, useMemo } from 'react';
import { CommandConfiguration, ValidationState } from '../types/validation';
import { validateCommandConfiguration } from '../utils/validation';

export interface UseScrcpyOptionsReturn {
  config: CommandConfiguration;
  validation: ValidationState;
  updateOption: (optionName: string, value: any) => void;
  removeOption: (optionName: string) => void;
  clearOptions: () => void;
  isValid: boolean;
}

export function useScrcpyOptions(initialConfig?: Partial<CommandConfiguration>): UseScrcpyOptionsReturn {
  const [config, setConfig] = useState<CommandConfiguration>({
    options: {},
    ...initialConfig
  });

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

  const removeOption = useCallback((optionName: string) => {
    setConfig(prev => {
      const newOptions = { ...prev.options };
      delete newOptions[optionName];
      return {
        ...prev,
        options: newOptions
      };
    });
  }, []);

  const clearOptions = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      options: {}
    }));
  }, []);

  return {
    config,
    validation,
    updateOption,
    removeOption,
    clearOptions,
    isValid: validation.isValid
  };
}