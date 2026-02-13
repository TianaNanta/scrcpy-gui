/**
 * DeviceInfoPopover Component
 *
 * Displays detailed device health information in a popover:
 * - Battery: percentage, temperature, charging status, health
 * - Storage: used, total, free space
 * - Device: model, Android version, build number
 * - Connection: type, latency, signal strength, quality
 */

import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { DeviceHealth } from "../types/health";
import {
  getBatteryWarningLevel,
  getStorageWarningLevel,
  formatBytes,
  getBatteryDisplay,
  getStorageDisplay,
} from "../utils/health-warnings";
import { ConnectionQualityIndicator } from "./ConnectionQualityIndicator";
import "./DeviceInfoPopover.css";

interface DeviceInfoPopoverProps {
  deviceId: string;
  health?: DeviceHealth | null;
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement;
  placement?: "top" | "bottom" | "left" | "right";
}

export const DeviceInfoPopover: React.FC<DeviceInfoPopoverProps> = ({
  deviceId,
  health: initialHealth,
  isOpen,
  onClose,
  placement = "bottom",
}) => {
  const [health, setHealth] = useState<DeviceHealth | null>(
    initialHealth || null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch health on open if not provided
  useEffect(() => {
    if (isOpen && !initialHealth) {
      setLoading(true);
      invoke<{ health: DeviceHealth | null }>("get_device_health", { deviceId })
        .then((response) => {
          setHealth(response.health);
          setError(null);
        })
        .catch((err) => {
          const errMsg = err instanceof Error ? err.message : String(err);
          setError(errMsg);
          console.error("Failed to fetch device health:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (isOpen && initialHealth) {
      setHealth(initialHealth);
    }
  }, [isOpen, deviceId, initialHealth]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="popover-backdrop" onClick={onClose} />

      {/* Popover Container */}
      <div
        className={`device-info-popover ${placement}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popover-title"
      >
        {/* Header */}
        <div className="popover-header">
          <div className="popover-title" id="popover-title">
            Device Information
          </div>
          <button
            className="popover-close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="popover-content">
            <div className="loading-spinner">Loading device info...</div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="popover-content">
            <div className="error-message">⚠️ Failed to load: {error}</div>
          </div>
        )}

        {/* No data state */}
        {!loading && !health && !error && (
          <div className="popover-content">
            <div className="no-data-message">
              No device information available. Please ensure the device is connected and try again.
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && health && (
          <div className="popover-content">
            {/* Device Identity Section */}
            <div className="info-section">
              <h3 className="section-title">Device</h3>
              {health.device ? (
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Model:</span>
                    <span className="info-value">
                      {health.device.modelName}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Android:</span>
                    <span className="info-value">
                      {health.device.androidVersion}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Build:</span>
                    <span
                      className="info-value"
                      title={health.device.buildNumber}
                    >
                      {health.device.buildNumber}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="no-data">Device info not available</p>
              )}
            </div>

            {/* Battery Section */}
            {health.battery && (
              <div className="info-section">
                <h3 className="section-title">🔋 Battery</h3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Level:</span>
                    <span
                      className={`info-value battery-level ${getBatteryDisplay(health.battery.percentage).cssClass}`}
                    >
                      {health.battery.percentage}%
                    </span>
                  </div>

                  {health.battery.temperature !== undefined && (
                    <div className="info-row">
                      <span className="info-label">Temperature:</span>
                      <span className="info-value">
                        {health.battery.temperature}°C
                      </span>
                    </div>
                  )}

                  <div className="info-row">
                    <span className="info-label">Status:</span>
                    <span className="info-value">
                      {health.battery.isCharging
                        ? "⚡ Charging"
                        : "🔋 Discharging"}
                    </span>
                  </div>

                  {health.battery.health && (
                    <div className="info-row">
                      <span className="info-label">Health:</span>
                      <span className="info-value">
                        {health.battery.health}
                      </span>
                    </div>
                  )}
                </div>

                {/* Battery Warning */}
                {getBatteryWarningLevel(health.battery.percentage) !==
                  "none" && (
                  <div
                    className={`warning-box ${getBatteryDisplay(health.battery.percentage).cssClass}`}
                  >
                    {getBatteryWarningLevel(health.battery.percentage) ===
                    "critical"
                      ? "⚠️ Critical battery level! Charge soon."
                      : "⚠️ Low battery. Consider charging."}
                  </div>
                )}
              </div>
            )}

            {/* Storage Section */}
            {health.storage && (
              <div className="info-section">
                <h3 className="section-title">💾 Storage</h3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Free:</span>
                    <span className="info-value">
                      {formatBytes(health.storage.free)}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">Used:</span>
                    <span className="info-value">
                      {formatBytes(health.storage.used)}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">Total:</span>
                    <span className="info-value">
                      {formatBytes(health.storage.total)}
                    </span>
                  </div>
                </div>

                {/* Storage Warning */}
                {getStorageWarningLevel(health.storage.free) !== "none" && (
                  <div
                    className={`warning-box ${getStorageDisplay(health.storage.free).cssClass}`}
                  >
                    {getStorageWarningLevel(health.storage.free) === "critical"
                      ? "⚠️ Critical storage space! Free up space soon."
                      : "⚠️ Low storage. Consider clearing cache or files."}
                  </div>
                )}
              </div>
            )}

            {/* Connection Section */}
            {health.connection && (
              <div className="info-section">
                <h3 className="section-title">📶 Connection</h3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="info-label">Type:</span>
                    <span className="info-value capitalize">
                      {health.connection.type === "usb" ? "🔌" : "📡"}{" "}
                      {health.connection.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">Quality:</span>
                    <ConnectionQualityIndicator
                      qualityLevel={health.connection.qualityLevel as any}
                      latency={health.connection.latency}
                      showLatency={true}
                    />
                  </div>

                  {health.connection.signalStrength !== undefined && (
                    <div className="info-row">
                      <span className="info-label">Signal:</span>
                      <span className="info-value">
                        {health.connection.signalStrength} dBm
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Section */}
            <div className="info-section">
              <h3 className="section-title">Status</h3>
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">State:</span>
                  <span className={`info-value state-${health.state}`}>
                    {health.state.charAt(0).toUpperCase() +
                      health.state.slice(1)}
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">Freshness:</span>
                  <span className="info-value">{health.staleness}</span>
                </div>
              </div>

              {health.errorReason && (
                <div className="error-box">⚠️ {health.errorReason}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DeviceInfoPopover;
