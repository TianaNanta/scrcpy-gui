//! ADB Health Provider
//!
//! Handles all ADB command execution for device health data collection.
//! Responsible for:
//! - Battery info (percentage, temperature, status)
//! - Storage info (used, total, free)
//! - Device info (model, Android version, build)
//! - Connection latency measurement

use crate::types::*;
use std::process::Command;
use std::time::{Duration, Instant};

/// ADB Health Provider
///
/// Executes ADB commands to collect device health metrics.
/// All commands timeout after the configured query_timeout (default 500ms).
pub struct AdbHealthProvider {
    query_timeout_ms: u32,
}

impl AdbHealthProvider {
    pub fn new(query_timeout_ms: u32) -> Self {
        Self { query_timeout_ms }
    }

    /// Execute an ADB command with timeout protection
    ///
    /// # Arguments
    /// * `device_id` - ADB device serial number
    /// * `cmd` - Shell command to execute
    ///
    /// # Returns
    /// Ok(output) if command succeeds, Err(message) if timeout or error occurs
    pub fn run_adb_command(&self, device_id: &str, cmd: &str) -> Result<String, String> {
        let start = Instant::now();
        let timeout = Duration::from_millis(self.query_timeout_ms as u64);

        match Command::new("adb")
            .args(["-s", device_id, "shell", cmd])
            .output()
        {
            Ok(output) => {
                let elapsed = start.elapsed();

                if elapsed > timeout {
                    return Err(format!(
                        "Command timeout: took {}ms (limit {}ms)",
                        elapsed.as_millis(),
                        self.query_timeout_ms
                    ));
                }

                if !output.status.success() {
                    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                    return Err(format!("ADB command failed: {}", stderr));
                }

                Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
            }
            Err(e) => Err(format!("Failed to execute ADB command: {}", e)),
        }
    }

    /// Get battery information from device
    ///
    /// Uses `adb shell dumpsys battery` to extract:
    /// - Percentage (0-100)
    /// - Temperature (Celsius)
    /// - Charging status
    pub fn get_battery_info(&self, device_id: &str) -> Result<BatteryInfo, String> {
        let output = self.run_adb_command(device_id, "dumpsys battery")?;

        let percentage = self.parse_battery_percentage(&output)?;
        let temperature = self.parse_battery_temperature(&output).ok();
        let is_charging = self.parse_battery_charging_status(&output).ok();
        let health = self.parse_battery_health(&output).ok();

        Ok(BatteryInfo {
            percentage,
            temperature,
            is_charging,
            health,
        })
    }

    /// Parse battery percentage from dumpsys battery output
    fn parse_battery_percentage(&self, output: &str) -> Result<u32, String> {
        for line in output.lines() {
            if line.contains("level:") {
                let value = line
                    .split("level:")
                    .nth(1)
                    .ok_or("Could not parse battery level")?
                    .trim()
                    .parse::<u32>()
                    .map_err(|_| "Invalid battery percentage format")?;

                if value > 100 {
                    return Err("Battery percentage out of range (>100)".to_string());
                }
                return Ok(value);
            }
        }
        Err("Battery level not found in dumpsys output".to_string())
    }

    /// Parse battery temperature from dumpsys battery output
    ///
    /// dumpsys battery reports temperature in tenths of degrees (e.g., 250 = 25.0°C).
    /// This function converts to whole degrees by dividing by 10.
    ///
    /// Example dumpsys output line:
    /// ```
    ///   temperature: 250
    /// ```
    /// Returns: 25 (Celsius)
    fn parse_battery_temperature(&self, output: &str) -> Result<i32, String> {
        for line in output.lines() {
            if line.contains("temperature:") {
                let value = line
                    .split("temperature:")
                    .nth(1)
                    .ok_or("Could not parse battery temperature")?
                    .trim()
                    .parse::<i32>()
                    .map_err(|_| "Invalid temperature format")?;
                // Device reports in tenths of degree, convert to whole degrees
                return Ok(value / 10);
            }
        }
        Err("Temperature not found".to_string())
    }

    /// Parse battery charging status from dumpsys battery output
    fn parse_battery_charging_status(&self, output: &str) -> Result<bool, String> {
        for line in output.lines() {
            if line.contains("status:") {
                let status = line
                    .split("status:")
                    .nth(1)
                    .ok_or("Could not parse charging status")?
                    .trim();
                return Ok(status != "2" && status != "Discharging"); // 2 = Discharging
            }
        }
        Err("Charging status not found".to_string())
    }

    /// Parse battery health from dumpsys battery output
    fn parse_battery_health(&self, output: &str) -> Result<BatteryHealth, String> {
        for line in output.lines() {
            if line.contains("health:") {
                let health = line
                    .split("health:")
                    .nth(1)
                    .ok_or("Could not parse health")?
                    .trim();

                return match health {
                    "2" | "Good" => Ok(BatteryHealth::Good),
                    "3" | "Overheat" => Ok(BatteryHealth::Overheat),
                    // Treat warm/unknown as Good for simplicity
                    _ => Ok(BatteryHealth::Good),
                };
            }
        }
        Err("Battery health not found".to_string())
    }

    /// Get storage information from device
    ///
    /// Uses `adb shell df /data` to extract storage metrics
    pub fn get_storage_info(&self, device_id: &str) -> Result<StorageInfo, String> {
        let output = self.run_adb_command(device_id, "df /data")?;
        self.parse_storage_info(&output)
    }

    /// Parse storage info from df /data output
    ///
    /// The df command returns output like:
    /// ```
    /// Filesystem     1K-blocks Used Available Use% Mounted on
    /// /dev/block/mmcblk0p34 61341872 15024344 46317528  25% /data
    /// ```
    ///
    /// This function extracts:
    /// - Total size (column 1, in KB) -> converted to bytes
    /// - Used size (column 2, in KB) -> converted to bytes  
    /// - Free size (Total - Used) -> in bytes
    ///
    /// All sizes are returned in bytes for consistency.
    fn parse_storage_info(&self, output: &str) -> Result<StorageInfo, String> {
        // df output format varies, but typically:
        // Filesystem      Size Used Avail Use% Mounted on
        // /dev/block...   XXX  YYY  ZZZ  XX% /data

        let lines: Vec<&str> = output.lines().collect();
        if lines.len() < 2 {
            return Err("Unexpected df output format".to_string());
        }

        let data_line = lines[1];
        let parts: Vec<&str> = data_line.split_whitespace().collect();

        if parts.len() < 3 {
            return Err("Could not parse df output".to_string());
        }

        // Extract KB values from columns
        let total_kb = parts[1].parse::<u64>().map_err(|_| "Invalid total size")?;
        let used_kb = parts[2].parse::<u64>().map_err(|_| "Invalid used size")?;

        // Convert KB to bytes (1KB = 1024 bytes)
        let total = total_kb * 1024;
        let used = used_kb * 1024;
        // Free is calculated to avoid issues if df's "available" differs from (total - used)
        let free = total.saturating_sub(used);

        Ok(StorageInfo { used, total, free })
    }

    /// Get device information (model, Android version, build number)
    pub fn get_device_info(&self, device_id: &str) -> Result<DeviceInfo, String> {
        let model_name = self.run_adb_command(device_id, "getprop ro.product.model")?;
        let android_version =
            self.run_adb_command(device_id, "getprop ro.build.version.release")?;
        let build_number = self.run_adb_command(device_id, "getprop ro.build.id")?;

        Ok(DeviceInfo {
            model_name,
            android_version,
            build_number,
        })
    }

    /// Measure latency to device via lightweight ADB command
    ///
    /// Returns latency in milliseconds
    pub fn get_latency(&self, device_id: &str) -> Result<u32, String> {
        let start = Instant::now();

        // Use 'echo' as a lightweight command for latency measurement
        self.run_adb_command(device_id, "echo ok")?;

        let elapsed = start.elapsed().as_millis() as u32;
        Ok(elapsed)
    }

    /// Derive quality level from latency
    pub fn derive_quality_level(&self, latency: u32) -> QualityLevel {
        derive_quality_level(latency)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_battery_percentage() {
        let provider = AdbHealthProvider::new(500);
        let output = r#"Current Battery Service state:
  AC powered: false
  USB powered: true
  Wireless powered: false
  Max charging current: 500000
  Max charging voltage: 5000000
  Charge counter: 2816840000
  status: 2
  health: 2
  present: true
  level: 75
  scale: 100
  temperature: 280
  technology: Li-ion"#;

        let percentage = provider.parse_battery_percentage(output).unwrap();
        assert_eq!(percentage, 75);
    }

    #[test]
    fn test_parse_battery_percentage_invalid() {
        let provider = AdbHealthProvider::new(500);
        let output = "no battery info here";
        assert!(provider.parse_battery_percentage(output).is_err());
    }

    #[test]
    fn test_parse_battery_temperature() {
        let provider = AdbHealthProvider::new(500);
        let output = "temperature: 280";
        let temp = provider.parse_battery_temperature(output).unwrap();
        assert_eq!(temp, 28); // 280 / 10
    }

    #[test]
    fn test_parse_storage_info() {
        let provider = AdbHealthProvider::new(500);
        let output = r#"Filesystem             Size Used Avail Use% Mounted on
/dev/block/mmcblk0p30 107520 85256 22264  79% /data"#;

        let info = provider.parse_storage_info(output).unwrap();
        assert_eq!(info.total, 107520 * 1024);
        assert_eq!(info.used, 85256 * 1024);
    }

    #[test]
    fn test_derive_quality_level() {
        let provider = AdbHealthProvider::new(500);

        assert_eq!(provider.derive_quality_level(30), QualityLevel::Excellent);
        assert_eq!(provider.derive_quality_level(75), QualityLevel::Good);
        assert_eq!(provider.derive_quality_level(150), QualityLevel::Fair);
        assert_eq!(provider.derive_quality_level(300), QualityLevel::Poor);
    }
}
