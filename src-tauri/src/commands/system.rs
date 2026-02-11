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

/// Parse a version string like "3.3.4" into (major, minor, patch).
/// Returns (0, 0, 0) for unparseable parts.
fn parse_version_parts(version_token: &str) -> (u32, u32, u32) {
    let parts: Vec<&str> = version_token.split('.').collect();
    let major = parts.first().and_then(|s| s.parse().ok()).unwrap_or(0);
    let minor = parts.get(1).and_then(|s| s.parse().ok()).unwrap_or(0);
    let patch = parts.get(2).and_then(|s| s.parse().ok()).unwrap_or(0);
    (major, minor, patch)
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

    let (major, minor, patch) = parse_version_parts(version_token);

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_standard_version() {
        assert_eq!(parse_version_parts("3.3.4"), (3, 3, 4));
    }

    #[test]
    fn parse_major_minor_only() {
        assert_eq!(parse_version_parts("2.1"), (2, 1, 0));
    }

    #[test]
    fn parse_major_only() {
        assert_eq!(parse_version_parts("4"), (4, 0, 0));
    }

    #[test]
    fn parse_empty_string() {
        assert_eq!(parse_version_parts(""), (0, 0, 0));
    }

    #[test]
    fn parse_non_numeric() {
        assert_eq!(parse_version_parts("abc.def.ghi"), (0, 0, 0));
    }

    #[test]
    fn parse_large_version() {
        assert_eq!(parse_version_parts("10.20.30"), (10, 20, 30));
    }

    #[test]
    fn dependencies_serializes_correctly() {
        let deps = Dependencies {
            adb: true,
            scrcpy: false,
        };
        let json = serde_json::to_value(&deps).unwrap();
        assert_eq!(json["adb"], true);
        assert_eq!(json["scrcpy"], false);
    }

    #[test]
    fn version_info_serializes_correctly() {
        let info = ScrcpyVersionInfo {
            major: 3,
            minor: 3,
            patch: 4,
            raw: "3.3.4".to_string(),
        };
        let json = serde_json::to_value(&info).unwrap();
        assert_eq!(json["major"], 3);
        assert_eq!(json["minor"], 3);
        assert_eq!(json["patch"], 4);
        assert_eq!(json["raw"], "3.3.4");
    }

    #[test]
    fn get_platform_returns_non_empty() {
        let platform = std::env::consts::OS.to_string();
        assert!(!platform.is_empty());
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn v4l2_impl_returns_sorted_list() {
        // On Linux, the function should at least not panic
        let devices = list_v4l2_devices_impl();
        // Verify sorted
        for w in devices.windows(2) {
            assert!(w[0] <= w[1], "devices should be sorted");
        }
    }

    #[cfg(not(target_os = "linux"))]
    #[test]
    fn v4l2_impl_returns_empty_on_non_linux() {
        let devices = list_v4l2_devices_impl();
        assert!(devices.is_empty());
    }
}
