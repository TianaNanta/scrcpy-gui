/**
 * OptionField Component
 *
 * Reusable input field with real-time validation feedback
 */

import React, { useState, useEffect } from 'react';
import { ValidationError, ValidationWarning } from '../types/validation';
import '../styles/validation.css';

interface BaseOptionFieldProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  error?: ValidationError;
  warning?: ValidationWarning;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

interface TextFieldProps extends BaseOptionFieldProps {
  type: 'text' | 'number' | 'password';
  min?: number;
  max?: number;
  step?: number;
}

interface SelectFieldProps extends BaseOptionFieldProps {
  type: 'select';
  options: { value: string; label: string }[];
}

interface CheckboxFieldProps extends BaseOptionFieldProps {
  type: 'checkbox';
  description?: string;
}

type OptionFieldProps = TextFieldProps | SelectFieldProps | CheckboxFieldProps;

export const OptionField: React.FC<OptionFieldProps> = (props) => {
  const { label, value, onChange, error, warning, required, disabled, placeholder } = props;

  const [localValue, setLocalValue] = useState(value);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const fieldId = `option-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const hasError = !!error;
  const hasWarning = !!warning;

  const fieldClasses = [
    'option-field',
    hasError && 'validation-error',
    hasWarning && 'validation-warning',
    disabled && 'disabled'
  ].filter(Boolean).join(' ');

  const renderField = () => {
    switch (props.type) {
      case 'text':
      case 'number':
      case 'password':
        return (
          <input
            id={fieldId}
            type={props.type}
            value={localValue || ''}
            onChange={(e) => handleChange(
              props.type === 'number' ? Number(e.target.value) : e.target.value
            )}
            min={props.min}
            max={props.max}
            step={props.step}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className="option-input"
          />
        );

      case 'select':
        return (
          <select
            id={fieldId}
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            required={required}
            className="option-select"
          >
            {placeholder && <option value="">{placeholder}</option>}
            {props.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="checkbox-wrapper">
            <input
              id={fieldId}
              type="checkbox"
              checked={!!localValue}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled}
              className="option-checkbox"
            />
            {props.description && (
              <label htmlFor={fieldId} className="checkbox-label">
                {props.description}
              </label>
            )}
          </div>
        );
    }
  };

  return (
    <div className={fieldClasses}>
      <label htmlFor={fieldId} className="option-label">
        {label}
        {required && <span className="required-indicator">*</span>}
      </label>

      {renderField()}

      {hasError && (
        <div className="validation-message error">
          {error.message}
        </div>
      )}

      {hasWarning && !hasError && (
        <div className="validation-message warning">
          {warning.message}
        </div>
      )}
    </div>
  );
};