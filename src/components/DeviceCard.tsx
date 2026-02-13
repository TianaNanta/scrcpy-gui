/**
 * DeviceCard Component
 *
 * Individual device card in the device list with:
 * - Device information and status
 * - Battery and storage warning badges
 * - Info button to open detailed health popover
 */

import React, { useState, useEffect } from "react";
import {
  WifiIcon,
  ComputerDesktopIcon,
  TrashIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import type { Device } from "../types/device";
import type { DeviceHealth } from "../types/health";
import { useDeviceHealth } from "../hooks/useDeviceHealth";
import { BatteryBadge } from "./BatteryBadge";
import { StorageBadge } from "./StorageBadge";
import { DeviceInfoPopover } from "./DeviceInfoPopover";
import { DeviceErrorBanner, type DeviceError } from "./DeviceErrorBanner";

interface DeviceCardProps {
  device: Device;
  deviceName: string;
  isConnected: boolean;
  isDisconnected: boolean;
  statusLabel: string;
  dependencies: { adb: boolean; scrcpy: boolean } | null;
  isActive: boolean;
  loading: boolean;
  wirelessConnecting?: boolean;
  health?: DeviceHealth | null;
  pollingError?: DeviceError | null;
  isRetrying?: boolean;
  retryAttempt?: number;
  maxRetryAttempts?: number;
  onDoubleClick?: () => void;
  onStartScrcpy?: () => void;
  onStopScrcpy?: () => void;
  onDisconnectWireless?: () => void;
  onForgetDevice?: () => void;
  onErrorDismiss?: () => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  deviceName,
  isConnected,
  isDisconnected,
  statusLabel,
  dependencies,
  isActive,
  loading,
  wirelessConnecting = false,
  health: propHealth,
  pollingError,
  isRetrying = false,
  retryAttempt = 0,
  maxRetryAttempts = 5,
  onDoubleClick,
  onStartScrcpy,
  onStopScrcpy,
  onDisconnectWireless,
  onForgetDevice,
  onErrorDismiss,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverButtonRef = React.useRef<HTMLButtonElement>(null);
  
  // Fetch health data for this device
  const { health: hookHealth, refresh: refreshHealth } = useDeviceHealth(device.serial);
  
  // Use prop health if provided, otherwise use hook health
  const health = propHealth || hookHealth;
  
  // Refresh health when popover opens
  useEffect(() => {
    if (isPopoverOpen && !health) {
      refreshHealth();
    }
  }, [isPopoverOpen, health, refreshHealth]);

  return (
    <>
      {/* Error Banner - shown above card if error exists */}
      {pollingError && (
        <DeviceErrorBanner
          deviceId={device.serial}
          error={pollingError}
          isRetrying={isRetrying}
          attempt={retryAttempt}
          maxAttempts={maxRetryAttempts}
          onDismiss={onErrorDismiss}
        />
      )}

      <div
        className={`device-card ${isConnected ? "online" : "offline"}${isDisconnected ? " disconnected" : ""}`}
        onDoubleClick={onDoubleClick}
        tabIndex={0}
        role="button"
        aria-label={`Configure ${deviceName}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onDoubleClick?.();
          }
        }}
      >
        <div className="device-header">
          <div className="device-serial">{deviceName}</div>
          <div className="device-status">
            <span
              className={`status-dot ${isConnected ? "online" : "offline"}`}
            />
            {statusLabel}
            <span
              className={`connection-badge ${device.is_wireless ? "wireless" : "usb"}`}
            >
              {device.is_wireless ? <WifiIcon /> : <ComputerDesktopIcon />}
              {device.is_wireless ? "Wi-Fi" : "USB"}
            </span>
          </div>
        </div>

        <div className="device-info">
          {device.model && <div>Model: {device.model}</div>}
          {device.android_version && (
            <div>Android: {device.android_version}</div>
          )}

          {/* Health Badges */}
          <div className="device-health-badges">
            {health?.battery && (
              <BatteryBadge
                percentage={health.battery.percentage}
                isCharging={health.battery.isCharging}
                temperature={health.battery.temperature}
                health={health.battery.health}
              />
            )}
            {health?.storage && (
              <StorageBadge
                free={health.storage.free}
                total={health.storage.total}
              />
            )}
          </div>
        </div>

        <div className="device-actions">
          {isDisconnected ? (
            <button
              className="btn btn-delete-text"
              onClick={(e) => {
                e.stopPropagation();
                onForgetDevice?.();
              }}
              title="Remove device from list"
              aria-label={`Forget device ${deviceName}`}
            >
              <TrashIcon className="btn-icon" />
              Forget
            </button>
          ) : (
            <>
              {device.is_wireless && (
                <button
                  className="btn btn-icon-only btn-delete"
                  onClick={() => onDisconnectWireless?.()}
                  disabled={wirelessConnecting}
                  title="Delete wireless connection"
                  aria-label={`Delete wireless connection for ${deviceName}`}
                >
                  <TrashIcon className="btn-icon" />
                </button>
              )}

              {/* Info Button */}
              <button
                ref={popoverButtonRef}
                className="btn btn-icon-only btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPopoverOpen(true);
                }}
                title="View device details"
                aria-label={`Show device details for ${deviceName}`}
              >
                <InformationCircleIcon className="btn-icon" />
              </button>
            </>
          )}

          <div className="device-action-main">
            {isActive ? (
              <button
                className="btn btn-stop"
                onClick={() => onStopScrcpy?.()}
                disabled={
                  !dependencies?.adb || !dependencies?.scrcpy || !isConnected
                }
              >
                Stop
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => onStartScrcpy?.()}
                disabled={
                  loading ||
                  !dependencies?.adb ||
                  !dependencies?.scrcpy ||
                  !isConnected
                }
              >
                Mirror
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Device Info Popover */}
      <DeviceInfoPopover
        deviceId={device.serial}
        health={health}
        isOpen={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
        anchorEl={popoverButtonRef.current || undefined}
        placement="bottom"
      />
    </>
  );
};
