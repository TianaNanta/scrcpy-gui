import { useState } from "react";
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import type { ValidationState } from "../types/validation";

interface CommandPreviewProps {
  command: string;
  validationState?: ValidationState;
}

export default function CommandPreview({ command, validationState }: CommandPreviewProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = command;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Determine status based on validation state
  const getStatusInfo = () => {
    if (!validationState) {
      return { icon: null, status: 'neutral', label: 'Command Preview' };
    }

    if (validationState.isValid) {
      return {
        icon: <CheckCircleIcon className="status-icon valid" aria-hidden="true" />,
        status: 'valid',
        label: 'Valid Command'
      };
    }

    if (validationState.errors.length > 0) {
      return {
        icon: <XCircleIcon className="status-icon error" aria-hidden="true" />,
        status: 'error',
        label: 'Command Has Errors'
      };
    }

    if (validationState.warnings.length > 0) {
      return {
        icon: <ExclamationTriangleIcon className="status-icon warning" aria-hidden="true" />,
        status: 'warning',
        label: 'Command Has Warnings'
      };
    }

    return { icon: null, status: 'neutral', label: 'Command Preview' };
  };

  const { icon, status, label } = getStatusInfo();

  // Parse command and highlight invalid parts
  const renderCommandWithHighlights = () => {
    if (!validationState || validationState.isValid) {
      return <code className="command-preview-code">{command}</code>;
    }

    const parts = command.split(' ');
    const invalidOptions = new Set([
      ...validationState.errors.map(e => `--${e.option}`),
      ...validationState.warnings.map(w => `--${w.option}`)
    ]);

    return (
      <code className="command-preview-code">
        {parts.map((part, index) => {
          const isInvalid = invalidOptions.has(part) || invalidOptions.has(part.split('=')[0]);
          return (
            <span
              key={index}
              className={isInvalid ? 'command-invalid' : ''}
            >
              {part}
              {index < parts.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </code>
    );
  };

  return (
    <div
      className={`command-preview ${status}`}
      role="region"
      aria-labelledby="command-preview-title"
      aria-describedby="command-preview-content"
    >
      <div className="command-preview-header">
        <div
          id="command-preview-title"
          className="command-preview-title"
        >
          {icon}
          <strong>{label}:</strong>
        </div>
        <button
          onClick={copyToClipboard}
          aria-label="Copy command to clipboard"
          aria-describedby="copy-status"
          className="btn btn-secondary btn-sm"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div id="command-preview-content">
        {renderCommandWithHighlights()}
      </div>
      <div id="copy-status" className="sr-only" aria-live="polite" aria-atomic="true">
        {copied ? "Command copied to clipboard" : ""}
      </div>
      {validationState && !validationState.isValid && (
        <div className="sr-only" aria-live="assertive" aria-atomic="true">
          {validationState.errors.length > 0 && `Command has ${validationState.errors.length} error${validationState.errors.length > 1 ? 's' : ''}`}
          {validationState.warnings.length > 0 && ` and ${validationState.warnings.length} warning${validationState.warnings.length > 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  );
}
