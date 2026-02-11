use std::process::Stdio;
use tokio::process::Command;

#[derive(serde::Serialize)]
pub struct DeviceInfo {
    pub serial: String,
    pub status: String,
    pub model: Option<String>,
    pub android_version: Option<String>,
    pub battery_level: Option<i32>,
    pub is_wireless: bool,
}

#[derive(serde::Serialize)]
pub struct DeviceHealth {
    pub battery_level: Option<i32>,
}

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

#[tauri::command]
pub async fn list_devices() -> Result<Vec<DeviceInfo>, String> {
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

    let mut devices = Vec::new();
    for line in stdout.lines().skip(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
            let serial = parts[0].to_string();
            let status = parts[1].to_string();
            let is_wireless = serial.contains(':');

            let (model, android_version, battery_level) = if status == "device" {
                let model = get_prop(&serial, "ro.product.model").await.ok();
                let android_version =
                    get_prop(&serial, "ro.build.version.release").await.ok();
                let battery_level = get_battery_level(&serial).await.ok();
                (model, android_version, battery_level)
            } else {
                (None, None, None)
            };

            devices.push(DeviceInfo {
                serial,
                status,
                model,
                android_version,
                battery_level,
                is_wireless,
            });
        }
    }

    Ok(devices)
}

#[tauri::command]
pub async fn get_device_health(serial: String) -> Result<DeviceHealth, String> {
    let battery_level = get_battery_level(&serial).await.ok();
    Ok(DeviceHealth { battery_level })
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
        };
        let json = serde_json::to_value(&info).unwrap();
        assert_eq!(json["serial"], "abc123");
        assert_eq!(json["status"], "device");
        assert_eq!(json["model"], "Pixel 7");
        assert_eq!(json["android_version"], "14");
        assert_eq!(json["battery_level"], 85);
        assert_eq!(json["is_wireless"], false);
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
        };
        let json = serde_json::to_value(&info).unwrap();
        assert_eq!(json["serial"], "192.168.1.100:5555");
        assert_eq!(json["status"], "offline");
        assert!(json["model"].is_null());
        assert!(json["android_version"].is_null());
        assert!(json["battery_level"].is_null());
        assert_eq!(json["is_wireless"], true);
    }

    #[test]
    fn device_health_serializes() {
        let health = DeviceHealth {
            battery_level: Some(42),
        };
        let json = serde_json::to_value(&health).unwrap();
        assert_eq!(json["battery_level"], 42);

        let health_none = DeviceHealth {
            battery_level: None,
        };
        let json_none = serde_json::to_value(&health_none).unwrap();
        assert!(json_none["battery_level"].is_null());
    }

    #[test]
    fn wireless_detection_by_serial() {
        // The list_devices function detects wireless by colon in serial
        let usb_serial = "abc123";
        let wireless_serial = "192.168.1.100:5555";
        assert!(!usb_serial.contains(':'));
        assert!(wireless_serial.contains(':'));
    }
}
