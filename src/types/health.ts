/**
 * Type definitions for Device Health Indicators & Status Polling
 *
 * This module defines all TypeScript types for the health polling system,
 * including device health state, configuration, events, and command protocols.
 *
 * Generated from: specs/004-device-health-polling/data-model.md
 */

// ============================================================================
// Core Enums
// ============================================================================

export type DeviceState = "online" | "offline" | "connecting" | "error";
export type StalenessLevel = "fresh" | "stale" | "offline";
export type ConnectionType = "usb" | "wireless";
export type QualityLevel = "excellent" | "good" | "fair" | "poor";
export type HealthUpdateReason = "poll" | "retry" | "manual_refresh";
export type BatteryHealth = "good" | "warm" | "overheat";
export type ErrorCode =
  | "offline"
  | "timeout"
  | "permission_denied"
  | "adb_error"
  | "parse_error";
export type PollingStopReason = "user" | "app_shutdown" | "error";

// ============================================================================
// Device Health Core Entity
// ============================================================================

export interface BatteryInfo {
  percentage: number; // 0-100
  temperature?: number; // Celsius
  isCharging?: boolean;
  health?: BatteryHealth;
}

export interface StorageInfo {
  used: number; // Bytes
  total: number; // Bytes
  free: number; // Bytes (total - used)
}

export interface ConnectionMetrics {
  type: ConnectionType;
  latency: number; // Milliseconds
  signalStrength?: number; // dBm or Mbps
  qualityLevel: QualityLevel;
  estimatedBandwidth?: number; // Mbps (future)
}

export interface DeviceInfo {
  modelName: string; // e.g., "Pixel 6"
  androidVersion: string; // e.g., "14"
  buildNumber: string; // e.g., "TP1A.220624.014"
}

export interface DeviceHealth {
  // Identity & State
  deviceId: string;
  state: DeviceState;
  lastSeen: number; // Unix timestamp
  lastUpdated: number; // Unix timestamp

  // Battery
  battery?: BatteryInfo;

  // Storage
  storage?: StorageInfo;

  // Connection
  connection?: ConnectionMetrics;

  // Device
  device?: DeviceInfo;

  // Cache tracking
  staleness: StalenessLevel;
  errorReason?: string;
}

// ============================================================================
// Polling Configuration
// ============================================================================

export interface HealthPollingConfig {
  // Intervals (milliseconds)
  pollingIntervalUsb: number; // Default: 1000
  pollingIntervalWireless: number; // Default: 3000

  // Thresholds (milliseconds)
  offlineThreshold: number; // Default: 5000
  staleThreshold: number; // Default: 30000

  // Retry logic
  maxRetries: number; // Default: 5
  retryBackoffMs: number; // Default: 500
  retryBackoffMultiplier: number; // Default: 2.0

  // Feature flags
  enabled: boolean;
  collectBattery: boolean; // Default: true
  collectStorage: boolean; // Default: true
  collectConnectionMetrics: boolean; // Default: true
  collectDeviceInfo: boolean; // Default: true

  // Performance
  batchSize: number; // Default: 1
  queryTimeout: number; // Default: 500
}

export const DEFAULT_POLLING_CONFIG: HealthPollingConfig = {
  pollingIntervalUsb: 1000,
  pollingIntervalWireless: 3000,
  offlineThreshold: 5000,
  staleThreshold: 30000,
  maxRetries: 5,
  retryBackoffMs: 500,
  retryBackoffMultiplier: 2.0,
  enabled: true,
  collectBattery: true,
  collectStorage: true,
  collectConnectionMetrics: true,
  collectDeviceInfo: true,
  batchSize: 1,
  queryTimeout: 500,
};

// ============================================================================
// Reconnection State
// ============================================================================

export interface ErrorInfo {
  code: ErrorCode;
  message: string;
}

export interface ReconnectionState {
  deviceId: string;
  attempt: number; // 1-N
  maxAttempts: number;
  nextRetryAt: number; // Unix timestamp
  lastError: ErrorInfo;
  startedAt: number; // Unix timestamp
}

// ============================================================================
// Command Protocols (Tauri IPC)
// ============================================================================

export interface StartHealthPollingRequest {
  config: HealthPollingConfig;
  devices: Array<{
    deviceId: string;
    connectionType: ConnectionType;
  }>;
}

export interface HealthCommandResult {
  success: boolean;
  error?: ErrorInfo;
}

export interface GetDeviceHealthResponse {
  health: DeviceHealth | null;
  isCached: boolean;
  cacheAge: number; // Milliseconds since last update
}

// ============================================================================
// Event Types (Tauri Events)
// ============================================================================

export interface DeviceHealthUpdateEvent {
  deviceId: string;
  health: DeviceHealth;
  reason: HealthUpdateReason;
  timestamp: number;
}

export interface PollingErrorEvent {
  deviceId: string;
  error: ErrorInfo;
  attempt: number;
  maxAttempts: number;
  nextRetryAt: number | null; // null if giving up
  willRetry: boolean;
}

export interface PollingStartedEvent {
  timestamp: number;
  config: HealthPollingConfig;
}

export interface PollingStoppedEvent {
  timestamp: number;
  reason: PollingStopReason;
}

// ============================================================================
// React Component State
// ============================================================================

export interface AppHealthState {
  // Device health map
  deviceHealthMap: Record<string, DeviceHealth>;

  // Retry tracking
  retryingDevices: Map<string, ReconnectionState>;

  // Polling status
  pollingEnabled: boolean;
  pollingConfig: HealthPollingConfig;

  // Errors
  pollingErrors: Map<string, PollingErrorEvent>;
}

// ============================================================================
// Warning Thresholds
// ============================================================================

export const WARNING_THRESHOLDS = {
  battery: {
    critical: 5, // <=5% → red
    warning: 10, // 5-10% → orange
    low: 20, // 10-20% → yellow
  },
  storage: {
    critical: 200 * 1024 * 1024, // <200 MB → red
    warning: 500 * 1024 * 1024, // 200-500 MB → orange
  },
  connection: {
    poor: "poor", // qualityLevel === 'poor' → warning
  },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine battery warning level
 */
export function getBatteryWarningLevel(
  percentage: number,
): "critical" | "warning" | "low" | "none" {
  if (percentage <= WARNING_THRESHOLDS.battery.critical) return "critical";
  if (percentage <= WARNING_THRESHOLDS.battery.warning) return "warning";
  if (percentage <= WARNING_THRESHOLDS.battery.low) return "low";
  return "none";
}

/**
 * Determine storage warning level
 */
export function getStorageWarningLevel(
  free: number,
): "critical" | "warning" | "none" {
  if (free < WARNING_THRESHOLDS.storage.critical) return "critical";
  if (free < WARNING_THRESHOLDS.storage.warning) return "warning";
  return "none";
}

/**
 * Check if battery should show warning badge
 */
export function shouldShowBatteryWarning(percentage?: number): boolean {
  if (!percentage) return false;
  return getBatteryWarningLevel(percentage) !== "none";
}

/**
 * Check if storage should show warning badge
 */
export function shouldShowStorageWarning(free?: number): boolean {
  if (!free) return false;
  return getStorageWarningLevel(free) !== "none";
}

/**
 * Derive quality level from latency
 */
export function deriveQualityLevel(latency: number): QualityLevel {
  if (latency < 50) return "excellent";
  if (latency < 100) return "good";
  if (latency < 200) return "fair";
  return "poor";
}
