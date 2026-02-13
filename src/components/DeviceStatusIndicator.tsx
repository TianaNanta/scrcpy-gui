/**
 * DeviceStatusIndicator Component
 *
 * Displays the current device status with visual indicators.
 * Shows:
 * - Status dot (green/red/yellow/gray)
 * - Status text (online/offline/connecting/error)
 * - Battery percentage and warning level
 * - Storage usage and warning level
 * - Last update time
 *
 * Props:
 * - health: Device health data (optional, shows unknown if not provided)
 * - compact: Show as a simple dot only (default: false)
 * - showDetails: Show battery/storage details (default: true)
 * - showLastUpdate: Show "x seconds ago" text (default: true)
 * - onClick: Handler when clicked (optional)
 */

import React, { useMemo } from "react";
import { DeviceHealth, DeviceState, StalenessLevel } from "../types/health";
import {
  getBatteryWarningLevel,
  getStorageWarningLevel,
} from "../types/health";
import "./DeviceStatusIndicator.css";

interface DeviceStatusIndicatorProps {
  health?: DeviceHealth | null;
  compact?: boolean;
  showDetails?: boolean;
  showLastUpdate?: boolean;
  onClick?: () => void;
}

/**
 * Get the CSS class for the status indicator based on device state
 */
function getStatusClass(health?: DeviceHealth | null): string {
  if (!health) {
    return "status-unknown";
  }

  switch (health.state) {
    case "online":
      return "status-online";
    case "offline":
      return "status-offline";
    case "connecting":
      return "status-connecting";
    case "error":
      return "status-error";
    default:
      return "status-unknown";
  }
}

/**
 * Get human-readable status text
 */
function getStatusText(state: DeviceState | undefined): string {
  switch (state) {
    case "online":
      return "Online";
    case "offline":
      return "Offline";
    case "connecting":
      return "Connecting";
    case "error":
      return "Error";
    default:
      return "Unknown";
  }
}

/**
 * Get human-readable staleness text
 */
function getStalenessText(staleness: StalenessLevel): string {
  switch (staleness) {
    case "fresh":
      return "Fresh";
    case "stale":
      return "Stale (>2s)";
    case "offline":
      return "Offline (>5s)";
    default:
      return "Unknown";
  }
}

/**
 * Format time delta as human-readable string
 */
function formatTimeDelta(timestampMs: number): string {
  const nowMs = Date.now();
  const deltaMs = nowMs - timestampMs;
  const deltaSec = Math.round(deltaMs / 1000);

  if (deltaSec < 1) {
    return "just now";
  } else if (deltaSec < 60) {
    return `${deltaSec}s ago`;
  } else if (deltaSec < 3600) {
    const minutes = Math.round(deltaSec / 60);
    return `${minutes}m ago`;
  } else {
    const hours = Math.round(deltaSec / 3600);
    return `${hours}h ago`;
  }
}

export const DeviceStatusIndicator: React.FC<DeviceStatusIndicatorProps> = ({
  health,
  compact = false,
  showDetails = true,
  showLastUpdate = true,
  onClick,
}) => {
  const statusClass = useMemo(() => getStatusClass(health), [health]);
  const statusText = useMemo(
    () => getStatusText(health?.state),
    [health?.state],
  );

  // Calculate battery warning level
  const batteryWarning = useMemo(() => {
    if (!health?.battery) return null;
    return getBatteryWarningLevel(health.battery.percentage);
  }, [health?.battery]);

  // Calculate storage warning level
  const storageWarning = useMemo(() => {
    if (!health?.storage) return null;
    return getStorageWarningLevel(health.storage.free);
  }, [health?.storage]);

  // Calculate storage usage percentage
  const storageUsagePercent = useMemo(() => {
    if (!health?.storage?.total || health.storage.total === 0) return 0;
    return Math.round((health.storage.used / health.storage.total) * 100);
  }, [health?.storage]);

  // Compact mode - just the status dot
  if (compact) {
    return (
      <div
        className={`device-status-indicator compact ${statusClass}`}
        title={statusText}
        role="status"
        onClick={onClick}
        style={{ cursor: onClick ? "pointer" : "default" }}
      >
        <div className="status-dot" />
      </div>
    );
  }

  // Full mode with details
  return (
    <div
      className={`device-status-indicator ${statusClass}`}
      role="status"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Status dot with animation */}
      <div className="status-dot" />

      {/* Main status section */}
      <div className="status-main">
        <div className="status-text">{statusText}</div>
        {health && showLastUpdate && (
          <div className="status-updated">
            {formatTimeDelta(health.lastUpdated)} •{" "}
            {getStalenessText(health.staleness)}
          </div>
        )}
      </div>

      {/* Details section */}
      {showDetails && health && (
        <div className="status-details">
          {/* Battery info */}
          {health.battery && (
            <div
              className={`detail-item battery ${batteryWarning ? `warning-${batteryWarning}` : ""}`}
            >
              <span className="detail-label">🔋</span>
              <span className="detail-value">{health.battery.percentage}%</span>
              {health.battery.isCharging && (
                <span className="detail-status">charging</span>
              )}
            </div>
          )}

          {/* Storage info */}
          {health.storage && (
            <div
              className={`detail-item storage ${storageWarning ? `warning-${storageWarning}` : ""}`}
            >
              <span className="detail-label">💾</span>
              <div className="detail-storage">
                <div className="storage-bar">
                  <div
                    className="storage-used"
                    style={{ width: `${storageUsagePercent}%` }}
                  />
                </div>
                <span className="detail-value">{storageUsagePercent}%</span>
              </div>
            </div>
          )}

          {/* Connection metrics */}
          {health.connection && (
            <div className="detail-item connection">
              <span className="detail-label">📶</span>
              <span className="detail-value">
                {health.connection.latency}ms
              </span>
              <span className="detail-status">
                {health.connection.qualityLevel}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {health && health.state === "error" && health.errorReason && (
        <div className="status-error-message">{health.errorReason}</div>
      )}
    </div>
  );
};

export default DeviceStatusIndicator;
