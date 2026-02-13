use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::process::Stdio;
use tauri::Manager;
use tokio::process::Command;

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct DeviceInfo {
    pub serial: String,
    pub status: String,
    pub model: Option<String>,
    pub android_version: Option<String>,
    pub battery_level: Option<i32>,
    pub is_wireless: bool,
    #[serde(default)]
    pub last_seen: Option<String>,
    #[serde(default = "default_first_seen")]
    pub first_seen: String,
}

fn default_first_seen() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn now_iso8601() -> String {
    chrono::Utc::now().to_rfc3339()
}

/// Minimal struct for ADB device list parsing
struct AdbDevice {
    serial: String,
    status: String,
}

// ─── Registry I/O ──────────────────────────────────────────────────────────

pub fn load_registry(app_data_dir: &PathBuf) -> Vec<DeviceInfo> {
    let path = app_data_dir.join("devices.json");
    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_else(|e| {
            eprintln!("Warning: corrupt devices.json, starting fresh: {}", e);
            Vec::new()
        }),
        Err(_) => Vec::new(),
    }
}

pub fn save_registry(app_data_dir: &PathBuf, devices: &[DeviceInfo]) -> Result<(), String> {
    fs::create_dir_all(app_data_dir)
        .map_err(|e| format!("Failed to create data directory: {}", e))?;
    let path = app_data_dir.join("devices.json");
    let json = serde_json::to_string_pretty(devices)
        .map_err(|e| format!("Failed to serialize device registry: {}", e))?;
    fs::write(&path, json)
        .map_err(|e| format!("Failed to write device registry: {}", e))?;
    Ok(())
}

// ─── Three-way merge ──────────────────────────────────────────────────────

/// Merge persistent registry with current ADB output (ignore unregistered devices).
/// Returns (merged_devices, serials_needing_prop_fetch).
fn merge_devices(
    registry: Vec<DeviceInfo>,
    adb_devices: &[AdbDevice],
) -> (Vec<DeviceInfo>, Vec<String>) {
    let now = now_iso8601();
    let mut adb_map: HashMap<String, String> = adb_devices
        .iter()
        .map(|d| (d.serial.clone(), d.status.clone()))
        .collect();

    let mut result: Vec<DeviceInfo> = Vec::new();
    let mut needs_props: Vec<String> = Vec::new();

    // Process existing registry entries
    for mut device in registry {
        if let Some(adb_status) = adb_map.remove(&device.serial) {
            let was_disconnected = device.status == "disconnected"
                || device.status == "offline"
                || device.status == "unauthorized";
            device.status = adb_status.clone();
            device.last_seen = Some(now.clone());

            // Fetch props if device is connected and was previously disconnected or is new
            if adb_status == "device" && (was_disconnected || device.model.is_none()) {
                needs_props.push(device.serial.clone());
            }
            result.push(device);
        } else {
            // Device in registry but not in ADB → disconnected
            device.status = "disconnected".to_string();
            // Preserve cached metadata (model, android_version, battery_level)
            result.push(device);
        }
    }

    (result, needs_props)
}

// ─── ADB helpers ──────────────────────────────────────────────────────────

async fn get_prop(serial: &str, prop: &str) -> Result<String, String> {
    let output = Command::new("adb")
        .args(["-s", serial, "shell", "getprop", prop])
        .stdout(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to get prop {}: {}", prop, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err("Command failed".to_string())
    }
}

async fn get_battery_level(serial: &str) -> Result<i32, String> {
    let output = Command::new("adb")
        .args(["-s", serial, "shell", "dumpsys", "battery"])
        .stdout(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to get battery: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            if line.contains("level:") {
                let parts: Vec<&str> = line.split(':').collect();
                if parts.len() == 2 {
                    return parts[1]
                        .trim()
                        .parse()
                        .map_err(|_| "Parse error".to_string());
                }
            }
        }
        Err("Level not found".to_string())
    } else {
        Err("Command failed".to_string())
    }
}

/// Fetch expensive device properties. Called only for devices that need it.
async fn fetch_device_props(serial: &str) -> (Option<String>, Option<String>, Option<i32>) {
    let model = get_prop(serial, "ro.product.model").await.ok();
    let android_version = get_prop(serial, "ro.build.version.release").await.ok();
    let battery_level = get_battery_level(serial).await.ok();
    (model, android_version, battery_level)
}

/// Parse `adb devices` output into AdbDevice list
fn parse_adb_output(stdout: &str) -> Vec<AdbDevice> {
    let mut devices = Vec::new();
    for line in stdout.lines().skip(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
            devices.push(AdbDevice {
                serial: parts[0].to_string(),
                status: parts[1].to_string(),
            });
        }
    }
    devices
}

async fn list_adb_devices_internal() -> Result<Vec<DeviceInfo>, String> {
    let output = Command::new("adb")
        .arg("devices")
        .stdout(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to run adb devices: {}", e))?;

    if !output.status.success() {
        return Err("adb devices command failed".to_string());
    }

    let stdout =
        String::from_utf8(output.stdout).map_err(|e| format!("Invalid UTF-8 output: {}", e))?;
    let adb_devices = parse_adb_output(&stdout);
    let now = now_iso8601();

    let mut devices: Vec<DeviceInfo> = Vec::new();
    for adb_device in adb_devices {
        let mut info = DeviceInfo {
            is_wireless: adb_device.serial.contains(':'),
            serial: adb_device.serial,
            status: adb_device.status,
            model: None,
            android_version: None,
            battery_level: None,
            last_seen: Some(now.clone()),
            first_seen: now.clone(),
        };

        if info.status == "device" {
            let (model, android_version, battery_level) = fetch_device_props(&info.serial).await;
            info.model = model;
            info.android_version = android_version;
            info.battery_level = battery_level;
        }

        devices.push(info);
    }

    Ok(devices)
}

// ─── Tauri commands ──────────────────────────────────────────────────────

#[tauri::command]
pub async fn list_devices(app: tauri::AppHandle) -> Result<Vec<DeviceInfo>, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {}", e))?;

    // 1. Load persistent registry
    let registry = load_registry(&app_data_dir);

    // 2. Run adb devices
    let output = Command::new("adb")
        .arg("devices")
        .stdout(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to run adb devices: {}", e))?;

    if !output.status.success() {
        return Err("adb devices command failed".to_string());
    }

    let stdout =
        String::from_utf8(output.stdout).map_err(|e| format!("Invalid UTF-8 output: {}", e))?;

    let adb_devices = parse_adb_output(&stdout);

    // 3. Three-way merge
    let (mut devices, needs_props) = merge_devices(registry, &adb_devices);

    // 4. Fetch properties for devices that need them
    for serial in &needs_props {
        if let Some(device) = devices.iter_mut().find(|d| d.serial == *serial) {
            let (model, android_version, battery_level) = fetch_device_props(serial).await;
            device.model = model;
            device.android_version = android_version;
            device.battery_level = battery_level;
        }
    }

    // 5. Save updated registry
    if let Err(e) = save_registry(&app_data_dir, &devices) {
        eprintln!("Warning: failed to save device registry: {}", e);
    }

    Ok(devices)
}

#[tauri::command]
pub async fn list_adb_devices() -> Result<Vec<DeviceInfo>, String> {
    list_adb_devices_internal().await
}

#[tauri::command]
pub async fn register_device(serial: String, app: tauri::AppHandle) -> Result<DeviceInfo, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {}", e))?;

    let mut registry = load_registry(&app_data_dir);

    if let Some(index) = registry.iter().position(|d| d.serial == serial) {
        let mut existing = registry[index].clone();
        if let Ok(adb_devices) = list_adb_devices_internal().await {
            if let Some(adb_device) = adb_devices.into_iter().find(|d| d.serial == serial) {
                existing.status = adb_device.status;
                existing.last_seen = adb_device.last_seen;
                existing.is_wireless = adb_device.is_wireless;
                if existing.model.is_none() {
                    existing.model = adb_device.model;
                    existing.android_version = adb_device.android_version;
                    existing.battery_level = adb_device.battery_level;
                }
                registry[index] = existing.clone();
                save_registry(&app_data_dir, &registry)?;
            }
        }
        return Ok(existing);
    }

    let adb_devices = list_adb_devices_internal().await?;
    let mut device = adb_devices
        .into_iter()
        .find(|d| d.serial == serial)
        .ok_or_else(|| "Device not found in adb devices".to_string())?;

    let now = now_iso8601();
    device.first_seen = now.clone();
    device.last_seen = Some(now);

    registry.push(device.clone());
    save_registry(&app_data_dir, &registry)?;
    Ok(device)
}

#[tauri::command]
pub async fn forget_device(serial: String, app: tauri::AppHandle) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {}", e))?;

    let mut devices = load_registry(&app_data_dir);
    devices.retain(|d| d.serial != serial);
    save_registry(&app_data_dir, &devices)?;
    Ok(())
}

#[tauri::command]
pub async fn test_device(serial: String) -> Result<(), String> {
    let output = Command::new("adb")
        .args(["-s", &serial, "shell", "echo", "test"])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to run adb test: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Device test failed: {}", stderr))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn device_info_serializes_all_fields() {
        let info = DeviceInfo {
            serial: "abc123".to_string(),
            status: "device".to_string(),
            model: Some("Pixel 7".to_string()),
            android_version: Some("14".to_string()),
            battery_level: Some(85),
            is_wireless: false,
            last_seen: Some("2026-01-15T10:30:00+00:00".to_string()),
            first_seen: "2026-01-10T08:00:00+00:00".to_string(),
        };
        let json = serde_json::to_value(&info).unwrap();
        assert_eq!(json["serial"], "abc123");
        assert_eq!(json["status"], "device");
        assert_eq!(json["model"], "Pixel 7");
        assert_eq!(json["android_version"], "14");
        assert_eq!(json["battery_level"], 85);
        assert_eq!(json["is_wireless"], false);
        assert_eq!(json["last_seen"], "2026-01-15T10:30:00+00:00");
        assert_eq!(json["first_seen"], "2026-01-10T08:00:00+00:00");
    }

    #[test]
    fn device_info_serializes_null_optionals() {
        let info = DeviceInfo {
            serial: "192.168.1.100:5555".to_string(),
            status: "offline".to_string(),
            model: None,
            android_version: None,
            battery_level: None,
            is_wireless: true,
            last_seen: None,
            first_seen: "2026-01-10T08:00:00+00:00".to_string(),
        };
        let json = serde_json::to_value(&info).unwrap();
        assert_eq!(json["serial"], "192.168.1.100:5555");
        assert_eq!(json["status"], "offline");
        assert!(json["model"].is_null());
        assert!(json["android_version"].is_null());
        assert!(json["battery_level"].is_null());
        assert_eq!(json["is_wireless"], true);
        assert!(json["last_seen"].is_null());
    }

    #[test]
    fn wireless_detection_by_serial() {
        let usb_serial = "abc123";
        let wireless_serial = "192.168.1.100:5555";
        assert!(!usb_serial.contains(':'));
        assert!(wireless_serial.contains(':'));
    }

    // ─── parse_adb_output tests ────────────────────────────────────────

    #[test]
    fn parse_adb_output_parses_standard_output() {
        let output = "List of devices attached\nabc123\tdevice\n192.168.1.5:5555\tdevice\n\n";
        let devices = parse_adb_output(output);
        assert_eq!(devices.len(), 2);
        assert_eq!(devices[0].serial, "abc123");
        assert_eq!(devices[0].status, "device");
        assert_eq!(devices[1].serial, "192.168.1.5:5555");
    }

    #[test]
    fn parse_adb_output_handles_empty() {
        let output = "List of devices attached\n\n";
        let devices = parse_adb_output(output);
        assert_eq!(devices.len(), 0);
    }

    // ─── merge_devices tests ──────────────────────────────────────────

    #[test]
    fn merge_adds_new_device_from_adb() {
        let registry = Vec::new();
        let adb = vec![AdbDevice {
            serial: "abc123".to_string(),
            status: "device".to_string(),
        }];
        let (devices, needs_props) = merge_devices(registry, &adb);
        assert_eq!(devices.len(), 1);
        assert_eq!(devices[0].serial, "abc123");
        assert_eq!(devices[0].status, "device");
        assert!(devices[0].last_seen.is_some());
        assert!(!devices[0].first_seen.is_empty());
        assert!(needs_props.contains(&"abc123".to_string()));
    }

    #[test]
    fn merge_marks_missing_device_as_disconnected() {
        let registry = vec![DeviceInfo {
            serial: "abc123".to_string(),
            status: "device".to_string(),
            model: Some("Pixel 7".to_string()),
            android_version: Some("14".to_string()),
            battery_level: Some(80),
            is_wireless: false,
            last_seen: Some("2026-01-10T08:00:00+00:00".to_string()),
            first_seen: "2026-01-01T00:00:00+00:00".to_string(),
        }];
        let adb: Vec<AdbDevice> = Vec::new();
        let (devices, needs_props) = merge_devices(registry, &adb);
        assert_eq!(devices.len(), 1);
        assert_eq!(devices[0].status, "disconnected");
        // Cached metadata preserved
        assert_eq!(devices[0].model, Some("Pixel 7".to_string()));
        assert_eq!(devices[0].android_version, Some("14".to_string()));
        assert_eq!(devices[0].battery_level, Some(80));
        assert!(needs_props.is_empty());
    }

    #[test]
    fn merge_reconnects_disconnected_device() {
        let registry = vec![DeviceInfo {
            serial: "abc123".to_string(),
            status: "disconnected".to_string(),
            model: Some("Pixel 7".to_string()),
            android_version: Some("14".to_string()),
            battery_level: Some(80),
            is_wireless: false,
            last_seen: Some("2026-01-10T08:00:00+00:00".to_string()),
            first_seen: "2026-01-01T00:00:00+00:00".to_string(),
        }];
        let adb = vec![AdbDevice {
            serial: "abc123".to_string(),
            status: "device".to_string(),
        }];
        let (devices, needs_props) = merge_devices(registry, &adb);
        assert_eq!(devices.len(), 1);
        assert_eq!(devices[0].status, "device");
        // Props should be re-fetched for reconnected device
        assert!(needs_props.contains(&"abc123".to_string()));
        // first_seen preserved from original
        assert_eq!(devices[0].first_seen, "2026-01-01T00:00:00+00:00");
    }

    #[test]
    fn merge_preserves_metadata_for_disconnected() {
        let registry = vec![DeviceInfo {
            serial: "abc123".to_string(),
            status: "device".to_string(),
            model: Some("Pixel 7".to_string()),
            android_version: Some("14".to_string()),
            battery_level: Some(55),
            is_wireless: false,
            last_seen: Some("2026-01-10T08:00:00+00:00".to_string()),
            first_seen: "2026-01-01T00:00:00+00:00".to_string(),
        }];
        let adb: Vec<AdbDevice> = Vec::new();
        let (devices, _) = merge_devices(registry, &adb);
        // All cached fields preserved when disconnected
        assert_eq!(devices[0].model, Some("Pixel 7".to_string()));
        assert_eq!(devices[0].battery_level, Some(55));
        assert_eq!(devices[0].first_seen, "2026-01-01T00:00:00+00:00");
        // last_seen NOT updated when disconnected
        assert_eq!(
            devices[0].last_seen,
            Some("2026-01-10T08:00:00+00:00".to_string())
        );
    }

    #[test]
    fn merge_handles_unauthorized_device() {
        let registry = Vec::new();
        let adb = vec![AdbDevice {
            serial: "abc456".to_string(),
            status: "unauthorized".to_string(),
        }];
        let (devices, needs_props) = merge_devices(registry, &adb);
        assert_eq!(devices.len(), 1);
        assert_eq!(devices[0].status, "unauthorized");
        // unauthorized devices don't need prop fetch
        assert!(needs_props.is_empty());
    }

    // ─── load_registry / save_registry tests ──────────────────────────

    #[test]
    fn load_registry_returns_empty_for_missing_file() {
        let dir = std::env::temp_dir().join("scrcpy-test-missing");
        let _ = fs::remove_dir_all(&dir);
        let devices = load_registry(&dir);
        assert!(devices.is_empty());
    }

    #[test]
    fn load_registry_returns_empty_for_corrupt_file() {
        let dir = std::env::temp_dir().join("scrcpy-test-corrupt");
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("devices.json"), "not valid json!!!").unwrap();
        let devices = load_registry(&dir);
        assert!(devices.is_empty());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn registry_round_trip() {
        let dir = std::env::temp_dir().join("scrcpy-test-roundtrip");
        let _ = fs::remove_dir_all(&dir);

        let devices = vec![
            DeviceInfo {
                serial: "abc123".to_string(),
                status: "device".to_string(),
                model: Some("Pixel 7".to_string()),
                android_version: Some("14".to_string()),
                battery_level: Some(85),
                is_wireless: false,
                last_seen: Some("2026-01-15T10:30:00+00:00".to_string()),
                first_seen: "2026-01-10T08:00:00+00:00".to_string(),
            },
            DeviceInfo {
                serial: "192.168.1.5:5555".to_string(),
                status: "disconnected".to_string(),
                model: None,
                android_version: None,
                battery_level: None,
                is_wireless: true,
                last_seen: None,
                first_seen: "2026-01-12T09:00:00+00:00".to_string(),
            },
        ];

        save_registry(&dir, &devices).unwrap();
        let loaded = load_registry(&dir);
        assert_eq!(loaded.len(), 2);
        assert_eq!(loaded[0].serial, "abc123");
        assert_eq!(loaded[0].model, Some("Pixel 7".to_string()));
        assert_eq!(loaded[1].serial, "192.168.1.5:5555");
        assert_eq!(loaded[1].status, "disconnected");
        assert!(loaded[1].model.is_none());

        let _ = fs::remove_dir_all(&dir);
    }
}
