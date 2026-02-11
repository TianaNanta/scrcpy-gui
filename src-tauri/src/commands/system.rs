use std::process::Stdio;
use tokio::process::Command;

#[derive(serde::Serialize)]
pub struct Dependencies {
    pub adb: bool,
    pub scrcpy: bool,
}

#[derive(serde::Serialize)]
pub struct ScrcpyVersionInfo {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
    pub raw: String,
}

#[tauri::command]
pub async fn check_dependencies() -> Dependencies {
    let adb_available = Command::new("adb")
        .arg("version")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await
        .map(|s| s.success())
        .unwrap_or(false);

    let scrcpy_available = Command::new("scrcpy")
        .arg("--version")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await
        .map(|s| s.success())
        .unwrap_or(false);

    Dependencies {
        adb: adb_available,
        scrcpy: scrcpy_available,
    }
}

#[tauri::command]
pub async fn get_scrcpy_version() -> Result<ScrcpyVersionInfo, String> {
    let output = Command::new("scrcpy")
        .arg("--version")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to run scrcpy --version: {}", e))?;

    // scrcpy prints version to stdout: "scrcpy 3.3.4 <url>"
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let text = if !stdout.trim().is_empty() {
        stdout
    } else {
        stderr
    };

    let first_line = text.lines().next().unwrap_or("");
    let version_token = first_line
        .split_whitespace()
        .nth(1)
        .ok_or_else(|| format!("Cannot parse version from: {}", first_line))?;

    let parts: Vec<&str> = version_token.split('.').collect();
    let major = parts
        .first()
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);
    let minor = parts
        .get(1)
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);
    let patch = parts
        .get(2)
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);

    Ok(ScrcpyVersionInfo {
        major,
        minor,
        patch,
        raw: version_token.to_string(),
    })
}

#[tauri::command]
pub fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

#[tauri::command]
pub async fn list_v4l2_devices() -> Vec<String> {
    list_v4l2_devices_impl()
}

#[cfg(target_os = "linux")]
fn list_v4l2_devices_impl() -> Vec<String> {
    let mut devices = Vec::new();
    if let Ok(entries) = std::fs::read_dir("/dev") {
        for entry in entries.flatten() {
            let name = entry.file_name();
            let name_str = name.to_string_lossy();
            if name_str.starts_with("video") {
                devices.push(format!("/dev/{}", name_str));
            }
        }
    }
    devices.sort();
    devices
}

#[cfg(not(target_os = "linux"))]
fn list_v4l2_devices_impl() -> Vec<String> {
    Vec::new()
}
