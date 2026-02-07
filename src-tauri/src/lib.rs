use std::process::Stdio;
use tokio::process::Command;

#[derive(serde::Serialize)]
struct Dependencies {
    adb: bool,
    scrcpy: bool,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn check_dependencies() -> Dependencies {
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

#[derive(serde::Serialize)]
struct Device {
    serial: String,
    status: String,
}

#[tauri::command]
async fn list_devices() -> Result<Vec<Device>, String> {
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
        // Skip "List of devices attached"
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
            devices.push(Device {
                serial: parts[0].to_string(),
                status: parts[1].to_string(),
            });
        }
    }

    Ok(devices)
}

#[tauri::command]
async fn start_scrcpy(
    serial: String,
    bitrate: Option<u32>,
    max_size: Option<u32>,
    no_control: bool,
    turn_screen_off: bool,
    stay_awake: bool,
    show_touches: bool,
    record: bool,
    record_file: Option<String>,
) -> Result<(), String> {
    let mut cmd = Command::new("scrcpy");
    cmd.arg("-s").arg(&serial);

    if let Some(bitrate) = bitrate {
        cmd.arg("-b").arg(bitrate.to_string());
    }

    if let Some(max_size) = max_size {
        cmd.arg("--max-size").arg(max_size.to_string());
    }

    if no_control {
        cmd.arg("--no-control");
    }

    if turn_screen_off {
        cmd.arg("--turn-screen-off");
    }

    if stay_awake {
        cmd.arg("--stay-awake");
    }

    if show_touches {
        cmd.arg("--show-touches");
    }

    if record {
        if let Some(file) = record_file {
            cmd.arg("--record").arg(file);
        } else {
            return Err("Recording enabled but no file path provided".to_string());
        }
    }

    cmd.stdout(Stdio::null()).stderr(Stdio::null());

    cmd.spawn()
        .map_err(|e| format!("Failed to start scrcpy: {}", e))?;

    // For now, we don't store the child, so we can't stop it later.
    // In a real app, you'd need to manage processes.

    Ok(())
}

#[tauri::command]
async fn select_save_file() -> Result<Option<String>, String> {
    let file_path = rfd::FileDialog::new()
        .set_title("Select Recording Save Location")
        .add_filter("MP4 Video", &["mp4"])
        .add_filter("MKV Video", &["mkv"])
        .add_filter("All Video Files", &["mp4", "mkv"])
        .set_file_name("scrcpy_recording.mp4")
        .save_file();

    match file_path {
        Some(path) => Ok(Some(path.to_string_lossy().to_string())),
        None => Ok(None),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            check_dependencies,
            list_devices,
            start_scrcpy,
            select_save_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
