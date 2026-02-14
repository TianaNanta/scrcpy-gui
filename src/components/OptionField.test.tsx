// Component tests for OptionField validation display

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OptionField } from './OptionField';

describe('OptionField', () => {
  it('should render text input with validation error', () => {
    const mockOnChange = vi.fn();
    const error = { option: 'test', message: 'Invalid value', code: 'TEST_ERROR' };

    render(
      <OptionField
        type="text"
        label="Test Field"
        value=""
        onChange={mockOnChange}
        error={error}
      />
    );

    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    expect(screen.getByText('Invalid value')).toBeInTheDocument();
    expect(screen.getByText('Invalid value')).toHaveClass('error');
  });

  it('should render number input with min/max', () => {
    const mockOnChange = vi.fn();

    render(
      <OptionField
        type="number"
        label="Number Field"
        value={10}
        onChange={mockOnChange}
        min={0}
        max={100}
      />
    );

    const input = screen.getByLabelText('Number Field') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  it('should render select with options', () => {
    const mockOnChange = vi.fn();
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ];

    render(
      <OptionField
        type="select"
        label="Select Field"
        value="option1"
        onChange={mockOnChange}
        options={options}
      />
    );

    expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument();
  });

  it('should render checkbox with description', () => {
    const mockOnChange = vi.fn();

    render(
      <OptionField
        type="checkbox"
        label="Checkbox Field"
        value={true}
        onChange={mockOnChange}
        description="Enable this option"
      />
    );

    expect(screen.getByLabelText('Enable this option')).toBeInTheDocument();
    expect(screen.getByLabelText('Enable this option')).toBeChecked();
  });

  it('should call onChange when input changes', () => {
    const mockOnChange = vi.fn();

    render(
      <OptionField
        type="text"
        label="Test Field"
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Test Field');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(mockOnChange).toHaveBeenCalledWith('new value');
  });

  it('should show warning message', () => {
    const mockOnChange = vi.fn();

    render(
      <OptionField
        type="text"
        label="Test Field"
        value=""
        onChange={mockOnChange}
        warning={{ option: 'test', message: 'This might cause issues', code: 'TEST_WARNING' }}
      />
    );

    expect(screen.getByText('This might cause issues')).toHaveClass('warning');
  });

  it('should show required indicator', () => {
    const mockOnChange = vi.fn();

    render(
      <OptionField
        type="text"
        label="Required Field"
        value=""
        onChange={mockOnChange}
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });
});