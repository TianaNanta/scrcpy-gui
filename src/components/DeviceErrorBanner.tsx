/**
 * DeviceErrorBanner Component
 *
 * Displays device connection errors with troubleshooting suggestions.
 * Shows different styles for transient errors (retrying) vs permanent errors.
 *
 * @component
 * @example
 * <DeviceErrorBanner
 *   deviceId="device-1"
 *   error={{ code: 'offline', message: 'Device offline' }}
 *   isRetrying={true}
 *   attempt={2}
 *   maxAttempts={5}
 * />
 */

import React, { useState } from "react";
import {
  ExclamationCircleIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { getFriendlyErrorMessage } from "../utils/error-messages";
import "../styles/error-banner.css";

export interface DeviceError {
  code: string;
  message: string;
}

interface DeviceErrorBannerProps {
  deviceId: string;
  error: DeviceError;
  isRetrying?: boolean;
  attempt?: number;
  maxAttempts?: number;
  onDismiss?: () => void;
}

/**
 * DeviceErrorBanner component
 * Displays error information with optional troubleshooting suggestions
 */
export function DeviceErrorBanner({
  deviceId,
  error,
  isRetrying = false,
  attempt = 0,
  maxAttempts = 5,
  onDismiss,
}: DeviceErrorBannerProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const suggestion = getFriendlyErrorMessage(error.code);

  const isTransient = isRetrying;
  const bannerClass = isTransient
    ? "error-banner--transient"
    : "error-banner--permanent";

  return (
    <div className={`error-banner ${bannerClass}`} role="alert">
      {/* Header */}
      <div className="error-banner__header">
        <div className="error-banner__icon">
          <ExclamationCircleIcon
            width={20}
            height={20}
            className={isTransient ? "icon-warning" : "icon-error"}
          />
        </div>

        <div className="error-banner__content">
          <div className="error-banner__title">
            {suggestion.title}
            {isTransient && (
              <span className="error-banner__retry-badge">
                Retrying: {attempt}/{maxAttempts}
              </span>
            )}
          </div>
          <div className="error-banner__message">{error.message}</div>
        </div>

        <div className="error-banner__actions">
          {!isTransient && suggestion.steps.length > 0 && (
            <button
              className="error-banner__expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Hide suggestions" : "Show suggestions"}
              aria-expanded={isExpanded}
              aria-label="Toggle troubleshooting suggestions"
            >
              <ChevronDownIcon
                width={20}
                height={20}
                className={
                  isExpanded ? "expand-icon--open" : "expand-icon--closed"
                }
              />
            </button>
          )}

          {!isTransient && onDismiss && (
            <button
              className="error-banner__close-btn"
              onClick={onDismiss}
              title="Dismiss error"
              aria-label="Dismiss error message"
            >
              <XMarkIcon width={18} height={18} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content - Troubleshooting Suggestions */}
      {isExpanded && !isTransient && (
        <div className="error-banner__details">
          <div className="error-banner__suggestions">
            <h4 className="suggestions__title">Troubleshooting Steps:</h4>
            <ol className="suggestions__list">
              {suggestion.steps.map((step, index) => (
                <li
                  key={`${deviceId}-suggestion-${index}`}
                  className="suggestions__item"
                >
                  {step}
                </li>
              ))}
            </ol>

            {suggestion.docLink && (
              <a
                href={suggestion.docLink}
                target="_blank"
                rel="noopener noreferrer"
                className="suggestions__link"
              >
                <span>Learn more about ADB debugging</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceErrorBanner;
