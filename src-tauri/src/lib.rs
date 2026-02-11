use std::collections::HashMap;
use std::process::Stdio;
use std::sync::Arc;
use tokio::process::{Child, Command};
use tokio::sync::Mutex;

lazy_static::lazy_static! {
    static ref SCRCPY_PROCESSES: Arc<Mutex<HashMap<String, Child>>> = Arc::new(Mutex::new(HashMap::new()));
}

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
    model: Option<String>,
    android_version: Option<String>,
    battery_level: Option<i32>,
    is_wireless: bool,
}

#[derive(serde::Serialize)]
struct DeviceHealth {
    battery_level: Option<i32>,
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
            let serial = parts[0].to_string();
            let status = parts[1].to_string();
            let is_wireless = serial.contains(':');

            let (model, android_version, battery_level) = if status == "device" {
                let model = get_prop(&serial, "ro.product.model").await.ok();
                let android_version = get_prop(&serial, "ro.build.version.release").await.ok();
                let battery_level = get_battery_level(&serial).await.ok();
                (model, android_version, battery_level)
            } else {
                (None, None, None)
            };

            devices.push(Device {
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
    audio_forwarding: bool,
    audio_bitrate: Option<u32>,
    microphone_forwarding: bool,
    display_id: Option<u32>,
    rotation: Option<u32>,
    crop: Option<String>,
    lock_video_orientation: Option<i32>,
    display_buffer: Option<u32>,
    window_x: Option<u32>,
    window_y: Option<u32>,
    window_width: Option<u32>,
    window_height: Option<u32>,
    always_on_top: bool,
    window_borderless: bool,
    fullscreen: bool,
    max_fps: Option<u32>,
    video_codec: Option<String>,
    video_encoder: Option<String>,
    video_buffer: Option<u32>,
    power_off_on_close: bool,
    no_power_on: bool,
    audio_codec: Option<String>,
    no_cleanup: bool,
    force_adb_forward: bool,
    time_limit: Option<u32>,
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

    if audio_forwarding {
        if let Some(audio_bitrate_val) = audio_bitrate {
            cmd.arg("--audio-bit-rate")
                .arg(audio_bitrate_val.to_string());
        }
    }

    if microphone_forwarding {
        cmd.arg("--microphone");
    }

    if let Some(display_id) = display_id {
        cmd.arg("--display-id").arg(display_id.to_string());
    }

    if let Some(rotation) = rotation {
        cmd.arg("--orientation").arg(rotation.to_string());
    }

    if let Some(crop) = crop {
        cmd.arg("--crop").arg(crop);
    }

    if let Some(orientation) = lock_video_orientation {
        cmd.arg("--lock-video-orientation")
            .arg(orientation.to_string());
    }

    if let Some(display_buffer) = display_buffer {
        cmd.arg("--display-buffer").arg(display_buffer.to_string());
    }

    if let Some(window_x) = window_x {
        cmd.arg("--window-x").arg(window_x.to_string());
    }

    if let Some(window_y) = window_y {
        cmd.arg("--window-y").arg(window_y.to_string());
    }

    if let Some(window_width) = window_width {
        cmd.arg("--window-width").arg(window_width.to_string());
    }

    if let Some(window_height) = window_height {
        cmd.arg("--window-height").arg(window_height.to_string());
    }

    if always_on_top {
        cmd.arg("--always-on-top");
    }

    if window_borderless {
        cmd.arg("--window-borderless");
    }

    if fullscreen {
        cmd.arg("--fullscreen");
    }

    if let Some(max_fps) = max_fps {
        cmd.arg("--max-fps").arg(max_fps.to_string());
    }

    if let Some(video_codec) = video_codec {
        if !video_codec.is_empty() && video_codec != "h264" {
            cmd.arg("--video-codec").arg(video_codec);
        }
    }

    if let Some(video_encoder) = video_encoder {
        if !video_encoder.is_empty() {
            cmd.arg("--video-encoder").arg(video_encoder);
        }
    }

    if let Some(video_buffer) = video_buffer {
        cmd.arg("--video-buffer").arg(video_buffer.to_string());
    }

    if power_off_on_close {
        cmd.arg("--power-off-on-close");
    }

    if no_power_on {
        cmd.arg("--no-power-on");
    }

    if let Some(audio_codec) = audio_codec {
        if !audio_codec.is_empty() && audio_codec != "opus" {
            cmd.arg("--audio-codec").arg(audio_codec);
        }
    }

    if no_cleanup {
        cmd.arg("--no-cleanup");
    }

    if force_adb_forward {
        cmd.arg("--force-adb-forward");
    }

    if let Some(time_limit) = time_limit {
        cmd.arg("--time-limit").arg(time_limit.to_string());
    }

    cmd.stderr(Stdio::inherit());

    let child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start scrcpy: {}", e))?;

    // Store the child process
    {
        let mut processes = SCRCPY_PROCESSES.lock().await;
        processes.insert(serial, child);
    }

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

#[tauri::command]
async fn connect_wireless_device(ip: String, port: u16) -> Result<(), String> {
    let output = Command::new("adb")
        .args(["connect", &format!("{}:{}", ip, port)])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to execute adb connect: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        if stdout.contains("connected") || stdout.contains("already connected") {
            Ok(())
        } else {
            Err(format!("Connection failed: {}", stdout))
        }
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("ADB connect failed: {}", stderr))
    }
}

#[tauri::command]
async fn disconnect_wireless_device(ip: String, port: u16) -> Result<(), String> {
    let output = Command::new("adb")
        .args(["disconnect", &format!("{}:{}", ip, port)])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to execute adb disconnect: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("ADB disconnect failed: {}", stderr))
    }
}

#[tauri::command]
async fn get_device_health(serial: String) -> Result<DeviceHealth, String> {
    let battery_level = get_battery_level(&serial).await.ok();
    Ok(DeviceHealth { battery_level })
}

#[tauri::command]
async fn test_device(serial: String) -> Result<(), String> {
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

#[tauri::command]
async fn stop_scrcpy(serial: String) -> Result<(), String> {
    let mut processes = SCRCPY_PROCESSES.lock().await;
    if let Some(mut child) = processes.remove(&serial) {
        child
            .kill()
            .await
            .map_err(|e| format!("Failed to kill scrcpy process: {}", e))?;
        Ok(())
    } else {
        Err("No scrcpy process found for this device".to_string())
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
            stop_scrcpy,
            select_save_file,
            connect_wireless_device,
            disconnect_wireless_device,
            get_device_health,
            test_device
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
