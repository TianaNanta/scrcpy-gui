// Component tests for ValidationBanner conflict display

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ValidationBanner } from './ValidationBanner';
import type { ValidationWarning } from '../types/validation';

describe('ValidationBanner', () => {
  it('should not render when no conflicts', () => {
    const { container } = render(
      <ValidationBanner
        conflicts={[]}
        onDismiss={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render error conflicts with red styling', () => {
    const conflicts: ValidationWarning[] = [
      {
        option: 'turn-screen-off',
        message: 'Cannot show touches on a turned off screen',
        code: 'OPTION_CONFLICT'
      }
    ];

    render(
      <ValidationBanner
        conflicts={conflicts}
        onDismiss={() => {}}
      />
    );

    expect(screen.getByText('Cannot show touches on a turned off screen')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveClass('error');
  });

  it('should render warning conflicts with yellow styling', () => {
    const conflicts: ValidationWarning[] = [
      {
        option: 'no-control',
        message: 'Control is disabled, keyboard options are irrelevant',
        code: 'OPTION_CONFLICT'
      }
    ];

    render(
      <ValidationBanner
        conflicts={conflicts}
        onDismiss={() => {}}
      />
    );

    expect(screen.getByText('Control is disabled, keyboard options are irrelevant')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveClass('warning');
  });

  it('should show multiple conflicts', () => {
    const conflicts: ValidationWarning[] = [
      {
        option: 'turn-screen-off',
        message: 'Cannot show touches on a turned off screen',
        code: 'OPTION_CONFLICT'
      },
      {
        option: 'no-control',
        message: 'Control is disabled, keyboard options are irrelevant',
        code: 'OPTION_CONFLICT'
      }
    ];

    render(
      <ValidationBanner
        conflicts={conflicts}
        onDismiss={() => {}}
      />
    );

    expect(screen.getByText('Cannot show touches on a turned off screen')).toBeInTheDocument();
    expect(screen.getByText('Control is disabled, keyboard options are irrelevant')).toBeInTheDocument();
  });

  it('should call onDismiss when close button is clicked', () => {
    const mockOnDismiss = vi.fn();
    const conflicts: ValidationWarning[] = [
      {
        option: 'turn-screen-off',
        message: 'Cannot show touches on a turned off screen',
        code: 'OPTION_CONFLICT'
      }
    ];

    render(
      <ValidationBanner
        conflicts={conflicts}
        onDismiss={mockOnDismiss}
      />
    );

    const closeButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(closeButton);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should be dismissible with escape key', () => {
    const mockOnDismiss = vi.fn();
    const conflicts: ValidationWarning[] = [
      {
        option: 'turn-screen-off',
        message: 'Cannot show touches on a turned off screen',
        code: 'OPTION_CONFLICT'
      }
    ];

    render(
      <ValidationBanner
        conflicts={conflicts}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });
});