//! Type definitions for Device Health Indicators & Status Polling
//!
//! This module defines all Rust types that correspond to the TypeScript health types.
//! All types are serializable via serde for Tauri IPC communication.
//!
//! Generated from: specs/004-device-health-polling/data-model.md

use serde::{Deserialize, Serialize};

// ============================================================================
// Core Enums
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DeviceState {
    Online,
    Offline,
    Connecting,
    Error,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StalenessLevel {
    Fresh,
    Stale,
    Offline,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ConnectionType {
    Usb,
    Wireless,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum QualityLevel {
    Excellent,
    Good,
    Fair,
    Poor,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HealthUpdateReason {
    Poll,
    Retry,
    ManualRefresh,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BatteryHealth {
    Good,
    Warm,
    Overheat,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ErrorCode {
    Offline,
    Timeout,
    PermissionDenied,
    AdbError,
    ParseError,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PollingStopReason {
    User,
    AppShutdown,
    Error,
}

// ============================================================================
// Device Health Core Entity
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatteryInfo {
    pub percentage: u32, // 0-100
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<i32>, // Celsius
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_charging: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub health: Option<BatteryHealth>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageInfo {
    pub used: u64,  // Bytes
    pub total: u64, // Bytes
    pub free: u64,  // Bytes
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionMetrics {
    #[serde(rename = "type")]
    pub connection_type: ConnectionType,
    pub latency: u32, // Milliseconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub signal_strength: Option<i32>,
    pub quality_level: QualityLevel,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub estimated_bandwidth: Option<u32>, // Mbps
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub model_name: String,
    pub android_version: String,
    pub build_number: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceHealth {
    pub device_id: String,
    pub state: DeviceState,
    pub last_seen: u64,    // Unix timestamp ms
    pub last_updated: u64, // Unix timestamp ms

    #[serde(skip_serializing_if = "Option::is_none")]
    pub battery: Option<BatteryInfo>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub storage: Option<StorageInfo>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub connection: Option<ConnectionMetrics>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub device: Option<DeviceInfo>,

    pub staleness: StalenessLevel,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_reason: Option<String>,
}

impl DeviceHealth {
    /// Create a new DeviceHealth entry for a device
    pub fn new(device_id: String) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64;

        Self {
            device_id,
            state: DeviceState::Connecting,
            last_seen: now,
            last_updated: 0,
            battery: None,
            storage: None,
            connection: None,
            device: None,
            staleness: StalenessLevel::Offline,
            error_reason: None,
        }
    }

    /// Mark device as online with updated health data
    pub fn mark_online(&mut self, now: u64) {
        self.state = DeviceState::Online;
        self.last_updated = now;
        self.staleness = StalenessLevel::Fresh;
        self.error_reason = None;
    }

    /// Mark device as offline
    pub fn mark_offline(&mut self, now: u64) {
        self.state = DeviceState::Offline;
        self.last_seen = now;
        self.staleness = StalenessLevel::Offline;
        self.error_reason = Some("Device not responding to ADB".to_string());
    }

    /// Mark as error state with reason
    pub fn mark_error(&mut self, now: u64, reason: String) {
        self.state = DeviceState::Error;
        self.last_seen = now;
        self.error_reason = Some(reason);
    }
}

// ============================================================================
// Polling Configuration
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthPollingConfig {
    pub polling_interval_usb: u32,      // Default: 1000 ms
    pub polling_interval_wireless: u32, // Default: 3000 ms

    pub offline_threshold: u32, // Default: 5000 ms
    pub stale_threshold: u32,   // Default: 30000 ms

    pub max_retries: u32,              // Default: 5
    pub retry_backoff_ms: u32,         // Default: 500 ms
    pub retry_backoff_multiplier: f64, // Default: 2.0

    pub enabled: bool,
    pub collect_battery: bool,            // Default: true
    pub collect_storage: bool,            // Default: true
    pub collect_connection_metrics: bool, // Default: true
    pub collect_device_info: bool,        // Default: true

    pub batch_size: u32,    // Default: 1
    pub query_timeout: u32, // Default: 500 ms
}

impl Default for HealthPollingConfig {
    fn default() -> Self {
        Self {
            polling_interval_usb: 1000,
            polling_interval_wireless: 3000,
            offline_threshold: 5000,
            stale_threshold: 30000,
            max_retries: 5,
            retry_backoff_ms: 500,
            retry_backoff_multiplier: 2.0,
            enabled: true,
            collect_battery: true,
            collect_storage: true,
            collect_connection_metrics: true,
            collect_device_info: true,
            batch_size: 1,
            query_timeout: 500,
        }
    }
}

impl HealthPollingConfig {
    pub fn get_polling_interval(&self, connection_type: ConnectionType) -> u32 {
        match connection_type {
            ConnectionType::Usb => self.polling_interval_usb,
            ConnectionType::Wireless => self.polling_interval_wireless,
        }
    }

    pub fn validate(&self) -> Result<(), String> {
        if self.polling_interval_usb < 100 {
            return Err("polling_interval_usb must be >= 100ms".to_string());
        }
        if self.polling_interval_wireless < 100 {
            return Err("polling_interval_wireless must be >= 100ms".to_string());
        }
        if self.max_retries < 1 || self.max_retries > 10 {
            return Err("max_retries must be between 1 and 10".to_string());
        }
        if self.retry_backoff_ms < 100 {
            return Err("retry_backoff_ms must be >= 100ms".to_string());
        }
        if self.query_timeout < 200 {
            return Err("query_timeout must be >= 200ms".to_string());
        }
        Ok(())
    }
}

// ============================================================================
// Reconnection State
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorInfo {
    pub code: ErrorCode,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReconnectionState {
    pub device_id: String,
    pub attempt: u32,
    pub max_attempts: u32,
    pub next_retry_at: u64, // Unix timestamp ms
    pub last_error: ErrorInfo,
    pub started_at: u64, // Unix timestamp ms
}

// ============================================================================
// Command Protocols (Tauri IPC)
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct StartHealthPollingRequest {
    pub config: HealthPollingConfig,
    pub devices: Vec<StartPollingDevice>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StartPollingDevice {
    pub device_id: String,
    #[serde(rename = "connectionType")]
    pub connection_type: ConnectionType,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthCommandResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<ErrorInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetDeviceHealthResponse {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub health: Option<DeviceHealth>,
    pub is_cached: bool,
    pub cache_age: u64, // Milliseconds
}

// ============================================================================
// Event Payloads (Tauri Events)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceHealthUpdateEvent {
    pub device_id: String,
    pub health: DeviceHealth,
    pub reason: HealthUpdateReason,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PollingErrorEvent {
    pub device_id: String,
    pub error: ErrorInfo,
    pub attempt: u32,
    pub max_attempts: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_retry_at: Option<u64>,
    pub will_retry: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PollingStartedEvent {
    pub timestamp: u64,
    pub config: HealthPollingConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PollingStoppedEvent {
    pub timestamp: u64,
    pub reason: PollingStopReason,
}

// ============================================================================
// Warning Thresholds
// ============================================================================

pub mod thresholds {
    pub const BATTERY_CRITICAL: u32 = 5;
    pub const BATTERY_WARNING: u32 = 10;
    pub const BATTERY_LOW: u32 = 20;

    pub const STORAGE_CRITICAL_BYTES: u64 = 200 * 1024 * 1024; // 200 MB
    pub const STORAGE_WARNING_BYTES: u64 = 500 * 1024 * 1024; // 500 MB

    pub fn battery_warning_level(percentage: u32) -> &'static str {
        if percentage <= BATTERY_CRITICAL {
            "critical"
        } else if percentage <= BATTERY_WARNING {
            "warning"
        } else if percentage <= BATTERY_LOW {
            "low"
        } else {
            "none"
        }
    }

    pub fn storage_warning_level(free: u64) -> &'static str {
        if free < STORAGE_CRITICAL_BYTES {
            "critical"
        } else if free < STORAGE_WARNING_BYTES {
            "warning"
        } else {
            "none"
        }
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Derive quality level from latency in milliseconds
pub fn derive_quality_level(latency: u32) -> QualityLevel {
    match latency {
        0..=49 => QualityLevel::Excellent,
        50..=99 => QualityLevel::Good,
        100..=199 => QualityLevel::Fair,
        _ => QualityLevel::Poor,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = HealthPollingConfig::default();
        assert!(config.enabled);
        assert_eq!(config.polling_interval_usb, 1000);
        assert_eq!(config.polling_interval_wireless, 3000);
    }

    #[test]
    fn test_config_validation() {
        let mut config = HealthPollingConfig::default();
        assert!(config.validate().is_ok());

        config.polling_interval_usb = 50;
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_quality_level_derivation() {
        assert_eq!(derive_quality_level(25), QualityLevel::Excellent);
        assert_eq!(derive_quality_level(75), QualityLevel::Good);
        assert_eq!(derive_quality_level(150), QualityLevel::Fair);
        assert_eq!(derive_quality_level(300), QualityLevel::Poor);
    }

    #[test]
    fn test_device_health_creation() {
        let health = DeviceHealth::new("ABC123".to_string());
        assert_eq!(health.device_id, "ABC123");
        assert_eq!(health.state, DeviceState::Connecting);
        assert_eq!(health.staleness, StalenessLevel::Offline);
    }
}
