/**
 * ValidationBanner Component
 *
 * Displays conflict warnings and errors in a dismissible banner
 */

import { useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import type { ValidationWarning } from '../types/validation';
import '../styles/validation.css';

interface ValidationBannerProps {
  conflicts: ValidationWarning[];
  onDismiss: () => void;
}

export function ValidationBanner({ conflicts, onDismiss }: ValidationBannerProps) {
  // Handle escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  if (conflicts.length === 0) {
    return null;
  }

  // Determine banner type based on most severe conflict
  const hasErrors = conflicts.some(c => c.code === 'OPTION_CONFLICT' && c.message.toLowerCase().includes('cannot'));
  const bannerType = hasErrors ? 'error' : 'warning';

  return (
    <div
      role="banner"
      className={`validation-banner ${bannerType}`}
      aria-live="polite"
      aria-atomic="true"
      aria-labelledby="validation-banner-title"
    >
      <div className="banner-content">
        <div className="banner-icon" aria-hidden="true">
          {bannerType === 'error' ? (
            <XCircleIcon />
          ) : (
            <ExclamationTriangleIcon />
          )}
        </div>
        <div id="validation-banner-title" className="sr-only">
          {bannerType === 'error' ? 'Validation Errors' : 'Validation Warnings'}
        </div>
        <div className="banner-messages" role="list" aria-label="Validation messages">
          {conflicts.map((conflict, index) => (
            <div
              key={`${conflict.option}-${index}`}
              className="conflict-message"
              role="listitem"
              aria-level={2}
            >
              <strong>{conflict.option}:</strong> {conflict.message}
            </div>
          ))}
        </div>
        <button
          className="banner-close"
          onClick={onDismiss}
          aria-label={`Dismiss ${bannerType === 'error' ? 'error' : 'warning'} messages`}
          type="button"
        >
          <XMarkIcon aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}