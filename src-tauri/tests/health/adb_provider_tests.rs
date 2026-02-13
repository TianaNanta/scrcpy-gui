//! Integration tests for AdbHealthProvider
//!
//! These tests verify the quality level derivation and warning thresholds
//! work correctly with realistic health data.
//!
//! Note: ADB command integration tests require actual device/mocked ADB,
//! so we test the data model validation and quality level logic here.

use scrcpy_gui_lib::services::AdbHealthProvider;
use scrcpy_gui_lib::types::*;

/// Test quality level derivation from latency values
#[test]
fn test_quality_levels() {
    let provider = AdbHealthProvider::new(500);

    // Excellent: < 50ms
    assert_eq!(provider.derive_quality_level(25), QualityLevel::Excellent);
    assert_eq!(provider.derive_quality_level(49), QualityLevel::Excellent);

    // Good: 50-99ms
    assert_eq!(provider.derive_quality_level(50), QualityLevel::Good);
    assert_eq!(provider.derive_quality_level(75), QualityLevel::Good);
    assert_eq!(provider.derive_quality_level(99), QualityLevel::Good);

    // Fair: 100-199ms
    assert_eq!(provider.derive_quality_level(100), QualityLevel::Fair);
    assert_eq!(provider.derive_quality_level(150), QualityLevel::Fair);
    assert_eq!(provider.derive_quality_level(199), QualityLevel::Fair);

    // Poor: >= 200ms
    assert_eq!(provider.derive_quality_level(200), QualityLevel::Poor);
    assert_eq!(provider.derive_quality_level(250), QualityLevel::Poor);
    assert_eq!(provider.derive_quality_level(500), QualityLevel::Poor);
}

/// Test battery warning thresholds
#[test]
fn test_battery_warning_levels() {
    use scrcpy_gui_lib::types::thresholds;

    // Critical: <= 5%
    assert_eq!(thresholds::battery_warning_level(3), "critical");
    assert_eq!(thresholds::battery_warning_level(5), "critical");

    // Warning: 5-10%
    assert_eq!(thresholds::battery_warning_level(6), "warning");
    assert_eq!(thresholds::battery_warning_level(10), "warning");

    // Low: 10-20%
    assert_eq!(thresholds::battery_warning_level(11), "low");
    assert_eq!(thresholds::battery_warning_level(20), "low");

    // None: > 20%
    assert_eq!(thresholds::battery_warning_level(21), "none");
    assert_eq!(thresholds::battery_warning_level(50), "none");
    assert_eq!(thresholds::battery_warning_level(100), "none");
}

/// Test storage warning thresholds
#[test]
fn test_storage_warning_levels() {
    use scrcpy_gui_lib::types::thresholds;

    // Critical: < 200 MB
    let critical_100mb = 100 * 1024 * 1024;
    assert_eq!(
        thresholds::storage_warning_level(critical_100mb),
        "critical"
    );

    let critical_199mb = 199 * 1024 * 1024;
    assert_eq!(
        thresholds::storage_warning_level(critical_199mb),
        "critical"
    );

    // Warning: 200-500 MB
    let warning_just_under = thresholds::STORAGE_WARNING_BYTES - 1;
    assert_eq!(
        thresholds::storage_warning_level(warning_just_under),
        "warning"
    );

    let warning_mid = thresholds::STORAGE_WARNING_BYTES / 2;
    assert_eq!(thresholds::storage_warning_level(warning_mid), "warning");

    // None: > 500 MB
    let good_at_threshold = thresholds::STORAGE_WARNING_BYTES;
    assert_eq!(thresholds::storage_warning_level(good_at_threshold), "none");

    let good_1gb = 1024 * 1024 * 1024;
    assert_eq!(thresholds::storage_warning_level(good_1gb), "none");
}

/// Test DeviceHealth creation and state transitions
#[test]
fn test_device_health_lifecycle() {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    // Create new device health
    let mut health = DeviceHealth::new("ABC123".to_string());
    assert_eq!(health.device_id, "ABC123");
    assert_eq!(health.state, DeviceState::Connecting);
    assert_eq!(health.staleness, StalenessLevel::Offline);

    // Transition to online
    health.mark_online(now);
    assert_eq!(health.state, DeviceState::Online);
    assert_eq!(health.staleness, StalenessLevel::Fresh);
    assert_eq!(health.error_reason, None);

    // Transition to offline
    health.mark_offline(now);
    assert_eq!(health.state, DeviceState::Offline);
    assert_eq!(health.staleness, StalenessLevel::Offline);
    assert!(health.error_reason.is_some());

    // Transition to error
    health.mark_error(now, "Permission denied".to_string());
    assert_eq!(health.state, DeviceState::Error);
    assert_eq!(health.error_reason, Some("Permission denied".to_string()));
}

/// Test polling configuration validation
#[test]
fn test_polling_config_validation() {
    let mut config = HealthPollingConfig::default();

    // Default config should be valid
    assert!(config.validate().is_ok());

    // Invalid: interval too low
    config.polling_interval_usb = 50;
    assert!(config.validate().is_err());

    // Reset and test other fields
    let mut config = HealthPollingConfig::default();
    config.max_retries = 0;
    assert!(config.validate().is_err());

    config.max_retries = 15;
    assert!(config.validate().is_err());

    let mut config = HealthPollingConfig::default();
    config.query_timeout = 100;
    assert!(config.validate().is_err());
}

/// Test battery info construction
#[test]
fn test_battery_info_construction() {
    let battery = BatteryInfo {
        percentage: 75,
        temperature: Some(28),
        is_charging: Some(true),
        health: Some(BatteryHealth::Good),
    };

    assert_eq!(battery.percentage, 75);
    assert_eq!(battery.temperature, Some(28));
    assert_eq!(battery.is_charging, Some(true));
}

/// Test storage info consistency
#[test]
fn test_storage_info_consistency() {
    let storage = StorageInfo {
        used: 50_000_000,
        total: 100_000_000,
        free: 50_000_000,
    };

    // Storage validation
    assert!(storage.free <= storage.total);
    assert!(storage.used <= storage.total);
    assert_eq!(storage.used + storage.free, storage.total);
}
