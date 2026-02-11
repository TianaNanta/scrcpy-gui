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
