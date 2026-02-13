/**
 * ConnectionQualityIndicator Component
 *
 * Displays connection quality level with latency-based visual indicators:
 * - Excellent: <50ms (green)
 * - Good: 50-100ms (blue/yellow)
 * - Fair: 100-200ms (orange)
 * - Poor: >200ms (red)
 */

import React from "react";

export type QualityLevel = "excellent" | "good" | "fair" | "poor";

interface ConnectionQualityIndicatorProps {
  qualityLevel?: QualityLevel | null;
  latency?: number;
  showLatency?: boolean;
  className?: string;
}

/**
 * Determine quality level based on latency
 */
export function getQualityFromLatency(latency?: number): QualityLevel {
  if (latency === undefined || latency === null) return "poor";
  if (latency < 50) return "excellent";
  if (latency < 100) return "good";
  if (latency < 200) return "fair";
  return "poor";
}

/**
 * Get icon for quality level
 */
function getQualityIcon(level: QualityLevel): string {
  switch (level) {
    case "excellent":
      return "📡"; // Strong signal
    case "good":
      return "📶"; // Good signal
    case "fair":
      return "📳"; // Weak signal
    case "poor":
      return "❌"; // No signal
  }
}

/**
 * Get label for quality level
 */
function getQualityLabel(level: QualityLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export const ConnectionQualityIndicator: React.FC<
  ConnectionQualityIndicatorProps
> = ({ qualityLevel, latency, showLatency = true, className = "" }) => {
  // Use provided quality level or derive from latency
  const level = qualityLevel || getQualityFromLatency(latency);
  const icon = getQualityIcon(level);
  const label = getQualityLabel(level);

  return (
    <div
      className={`connection-quality-indicator quality-${level} ${className}`}
      title={`Connection quality: ${label}${latency !== undefined ? ` (${latency}ms)` : ""}`}
      role="status"
      aria-label={`Connection quality: ${label}${latency !== undefined ? ` (${latency}ms latency)` : ""}`}
    >
      <span className="quality-icon">{icon}</span>
      <span className="quality-label">{label}</span>
      {showLatency && latency !== undefined && (
        <span className="quality-latency">{latency}ms</span>
      )}
    </div>
  );
};
