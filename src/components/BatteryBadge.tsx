/**
 * BatteryBadge Component
 *
 * Displays battery percentage with visual warning indicators
 */

import React from "react";
import { getBatteryDisplay } from "../utils/health-warnings";
import "./BatteryBadge.css";

interface BatteryBadgeProps {
  percentage: number;
  isCharging?: boolean;
  temperature?: number;
  health?: string;
  onClick?: () => void;
}

export const BatteryBadge: React.FC<BatteryBadgeProps> = ({
  percentage,
  isCharging = false,
  temperature,
  health,
  onClick,
}) => {
  const display = getBatteryDisplay(percentage);

  return (
    <div
      className={`battery-badge ${display.cssClass}`}
      onClick={onClick}
      role="status"
      aria-label={`Battery ${percentage}%`}
    >
      {/* Icon */}
      <span className="battery-icon">{isCharging ? "🔌" : "🔋"}</span>

      {/* Percentage */}
      <span className="battery-percentage">{percentage}%</span>

      {/* Status indicator */}
      {isCharging && <span className="battery-charging">⚡</span>}

      {/* Tooltip with details */}
      {(temperature !== undefined || health) && (
        <div className="battery-tooltip">
          {temperature !== undefined && (
            <div className="tooltip-line">Temperature: {temperature}°C</div>
          )}
          {health && <div className="tooltip-line">Health: {health}</div>}
          {isCharging && <div className="tooltip-line">Charging...</div>}
        </div>
      )}
    </div>
  );
};

export default BatteryBadge;
