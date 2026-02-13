/**
 * StorageBadge Component
 *
 * Displays storage usage with visual warning indicators
 */

import React from "react";
import { getStorageDisplay, formatBytes } from "../utils/health-warnings";
import "./StorageBadge.css";

interface StorageBadgeProps {
  free: number; // bytes
  total: number; // bytes
  onClick?: () => void;
}

export const StorageBadge: React.FC<StorageBadgeProps> = ({
  free,
  total,
  onClick,
}) => {
  const display = getStorageDisplay(free);
  const used = total - free;
  const usagePercent = total > 0 ? Math.round((used / total) * 100) : 0;

  return (
    <div
      className={`storage-badge ${display.cssClass}`}
      onClick={onClick}
      role="status"
      aria-label={`Storage ${usagePercent}% used`}
    >
      {/* Icon */}
      <span className="storage-icon">💾</span>

      {/* Usage percentage */}
      <span className="storage-percentage">{usagePercent}%</span>

      {/* Tooltip with details */}
      <div className="storage-tooltip">
        <div className="tooltip-line">Free: {formatBytes(free)}</div>
        <div className="tooltip-line">Used: {formatBytes(used)}</div>
        <div className="tooltip-line">Total: {formatBytes(total)}</div>
      </div>
    </div>
  );
};

export default StorageBadge;
