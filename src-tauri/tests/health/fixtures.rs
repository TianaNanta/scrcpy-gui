//! Test fixtures for mocked ADB outputs
//!
//! Provides realistic dumpsys and df outputs for testing without actual devices

pub mod fixtures {
    /// Mock dumpsys battery output (high battery, charging)
    pub const BATTERY_OUTPUT_HIGH: &str = r#"Current Battery Service state:
  AC powered: false
  USB powered: true
  Wireless powered: false
  Max charging current: 500000
  Max charging voltage: 5000000
  Charge counter: 2816840000
  status: 2
  health: 2
  present: true
  level: 85
  scale: 100
  temperature: 280
  technology: Li-ion"#;

    /// Mock dumpsys battery output (low battery, discharging)
    pub const BATTERY_OUTPUT_LOW: &str = r#"Current Battery Service state:
  AC powered: false
  USB powered: false
  Wireless powered: false
  Max charging current: 500000
  Max charging voltage: 5000000
  Charge counter: 123456789
  status: 2
  health: 2
  present: true
  level: 5
  scale: 100
  temperature: 360
  technology: Li-ion"#;

    /// Mock dumpsys battery output (critical battery)
    pub const BATTERY_OUTPUT_CRITICAL: &str = r#"Current Battery Service state:
  AC powered: false
  USB powered: false
  Wireless powered: false
  status: 2
  health: 2
  present: true
  level: 3
  scale: 100
  temperature: 350
  technology: Li-ion"#;

    /// Mock df /data output (plenty of storage)
    pub const STORAGE_OUTPUT_GOOD: &str = r#"Filesystem             Size Used Avail Use% Mounted on
/dev/block/mmcblk0p30 107520 45256 62264  42% /data"#;

    /// Mock df /data output (low storage)
    pub const STORAGE_OUTPUT_LOW: &str = r#"Filesystem             Size Used Avail Use% Mounted on
/dev/block/mmcblk0p30 107520 105256 2264   98% /data"#;

    /// Mock df /data output (critical storage)
    pub const STORAGE_OUTPUT_CRITICAL: &str = r#"Filesystem             Size Used Avail Use% Mounted on
/dev/block/mmcblk0p30 107520 106256 1264   99% /data"#;

    /// Mock getprop outputs
    pub const DEVICE_MODEL_OUTPUT: &str = "Pixel 6";
    pub const ANDROID_VERSION_OUTPUT: &str = "14";
    pub const BUILD_ID_OUTPUT: &str = "TP1A.220624.014";

    /// Mock adb devices output with two devices
    pub const ADB_DEVICES_OUTPUT: &str = r#"List of devices attached
  emulator-5554	device
  ABC123	device
  "#;

    /// Mock latency command output
    pub const LATENCY_OUTPUT: &str = "ok";
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fixtures_exist() {
        // Ensure all fixtures are non-empty
        assert!(!fixtures::BATTERY_OUTPUT_HIGH.is_empty());
        assert!(!fixtures::STORAGE_OUTPUT_GOOD.is_empty());
    }
}
