use std::collections::HashMap;
use std::process::Stdio;
use std::sync::Arc;
use tauri::Emitter;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::Mutex;

lazy_static::lazy_static! {
    pub static ref SCRCPY_PROCESSES: Arc<Mutex<HashMap<String, Child>>> =
        Arc::new(Mutex::new(HashMap::new()));
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScrcpyConfig {
    pub serial: String,

    // Video
    pub bitrate: Option<u32>,
    pub max_size: Option<u32>,
    pub max_fps: Option<u32>,
    pub video_codec: Option<String>,
    pub video_encoder: Option<String>,
    pub video_buffer: Option<u32>,

    // Video Source
    pub video_source: Option<String>,
    pub camera_facing: Option<String>,
    pub camera_size: Option<String>,
    pub camera_id: Option<String>,

    // Audio
    pub no_audio: bool,
    pub audio_forwarding: bool,
    pub audio_bitrate: Option<u32>,
    pub audio_codec: Option<String>,
    pub microphone_forwarding: bool,

    // Video toggles
    pub no_video: bool,
    pub no_playback: bool,

    // Display
    pub display_id: Option<u32>,
    pub rotation: Option<u32>,
    pub crop: Option<String>,
    pub lock_video_orientation: Option<i32>,
    pub display_buffer: Option<u32>,

    // Window
    pub window_x: Option<u32>,
    pub window_y: Option<u32>,
    pub window_width: Option<u32>,
    pub window_height: Option<u32>,
    pub always_on_top: bool,
    pub window_borderless: bool,
    pub fullscreen: bool,
    pub window_title: Option<String>,

    // Behavior
    pub no_control: bool,
    pub turn_screen_off: bool,
    pub stay_awake: bool,
    pub show_touches: bool,
    pub power_off_on_close: bool,
    pub no_power_on: bool,

    // Recording
    pub record: bool,
    pub record_file: Option<String>,

    // Input Modes
    pub keyboard_mode: Option<String>,
    pub mouse_mode: Option<String>,
    pub gamepad_mode: Option<String>,

    // V4L2
    pub v4l2_sink: Option<String>,
    pub v4l2_buffer: Option<u32>,

    // Virtual Display
    pub virtual_display: Option<String>,
    pub start_app: Option<String>,

    // OTG
    pub otg_mode: bool,

    // Network
    pub no_cleanup: bool,
    pub force_adb_forward: bool,
    pub time_limit: Option<u32>,
}

fn push_optional_str(cmd: &mut Command, flag: &str, val: &Option<String>) {
    if let Some(v) = val {
        if !v.is_empty() {
            cmd.arg(flag).arg(v);
        }
    }
}

fn push_optional_u32(cmd: &mut Command, flag: &str, val: &Option<u32>) {
    if let Some(v) = val {
        if *v > 0 {
            cmd.arg(flag).arg(v.to_string());
        }
    }
}

fn push_bool(cmd: &mut Command, flag: &str, val: bool) {
    if val {
        cmd.arg(flag);
    }
}

#[tauri::command]
pub async fn start_scrcpy(
    app: tauri::AppHandle,
    config: ScrcpyConfig,
) -> Result<(), String> {
    let mut cmd = Command::new("scrcpy");
    cmd.arg("-s").arg(&config.serial);

    // OTG mode — standalone
    if config.otg_mode {
        cmd.arg("--otg");
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());
        let mut child = cmd
            .spawn()
            .map_err(|e| format!("Failed to start scrcpy: {}", e))?;
        spawn_output_readers(&app, &config.serial, &mut child);
        let serial_clone = config.serial.clone();
        {
            let mut processes = SCRCPY_PROCESSES.lock().await;
            processes.insert(config.serial, child);
        }
        let app_clone = app.clone();
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                let mut processes = SCRCPY_PROCESSES.lock().await;
                if let Some(child) = processes.get_mut(&serial_clone) {
                    match child.try_wait() {
                        Ok(Some(status)) => {
                            processes.remove(&serial_clone);
                            let _ = app_clone.emit("scrcpy-exit", serde_json::json!({
                                "serial": serial_clone, "exitCode": status.code(),
                            }));
                            break;
                        }
                        Ok(None) => continue,
                        Err(_) => { processes.remove(&serial_clone); break; }
                    }
                } else { break; }
            }
        });
        return Ok(());
    }

    // ── Video ───────────────────────────────────────────────────────────
    if config.no_video {
        cmd.arg("--no-video");
    } else {
        push_optional_u32(&mut cmd, "-b", &config.bitrate);
        push_optional_u32(&mut cmd, "--max-size", &config.max_size);
        push_optional_u32(&mut cmd, "--max-fps", &config.max_fps);
        if let Some(ref vc) = config.video_codec {
            if !vc.is_empty() && vc != "h264" {
                cmd.arg("--video-codec").arg(vc);
            }
        }
        push_optional_str(&mut cmd, "--video-encoder", &config.video_encoder);
        push_optional_u32(&mut cmd, "--video-buffer", &config.video_buffer);
    }

    // ── Video Source ────────────────────────────────────────────────────
    if let Some(ref vs) = config.video_source {
        if vs == "camera" {
            cmd.arg("--video-source=camera");
            push_optional_str(&mut cmd, "--camera-facing", &config.camera_facing);
            push_optional_str(&mut cmd, "--camera-size", &config.camera_size);
            push_optional_str(&mut cmd, "--camera-id", &config.camera_id);
        }
    }

    // ── Audio ───────────────────────────────────────────────────────────
    if config.no_audio {
        cmd.arg("--no-audio");
    } else if config.audio_forwarding {
        push_optional_u32(&mut cmd, "--audio-bit-rate", &config.audio_bitrate);
        if let Some(ref ac) = config.audio_codec {
            if !ac.is_empty() && ac != "opus" {
                cmd.arg("--audio-codec").arg(ac);
            }
        }
        if config.microphone_forwarding {
            cmd.arg("--audio-source=mic");
        }
    } else {
        cmd.arg("--no-audio");
    }

    // ── Display ─────────────────────────────────────────────────────────
    push_optional_u32(&mut cmd, "--display-id", &config.display_id);
    push_optional_u32(&mut cmd, "--orientation", &config.rotation);
    push_optional_str(&mut cmd, "--crop", &config.crop);
    if let Some(lvo) = config.lock_video_orientation {
        if lvo >= 0 {
            cmd.arg("--lock-video-orientation").arg(lvo.to_string());
        }
    }
    push_optional_u32(&mut cmd, "--display-buffer", &config.display_buffer);

    // ── Window ──────────────────────────────────────────────────────────
    push_optional_u32(&mut cmd, "--window-x", &config.window_x);
    push_optional_u32(&mut cmd, "--window-y", &config.window_y);
    push_optional_u32(&mut cmd, "--window-width", &config.window_width);
    push_optional_u32(&mut cmd, "--window-height", &config.window_height);
    push_bool(&mut cmd, "--always-on-top", config.always_on_top);
    push_bool(&mut cmd, "--window-borderless", config.window_borderless);
    push_bool(&mut cmd, "--fullscreen", config.fullscreen);
    push_optional_str(&mut cmd, "--window-title", &config.window_title);

    // ── Behavior ────────────────────────────────────────────────────────
    push_bool(&mut cmd, "--no-control", config.no_control);
    push_bool(&mut cmd, "--turn-screen-off", config.turn_screen_off);
    push_bool(&mut cmd, "--stay-awake", config.stay_awake);
    push_bool(&mut cmd, "--show-touches", config.show_touches);
    push_bool(&mut cmd, "--power-off-on-close", config.power_off_on_close);
    push_bool(&mut cmd, "--no-power-on", config.no_power_on);

    // ── Recording ───────────────────────────────────────────────────────
    if config.record {
        if let Some(ref file) = config.record_file {
            if !file.is_empty() {
                cmd.arg("--record").arg(file);
            } else {
                return Err("Recording enabled but no file path provided".to_string());
            }
        } else {
            return Err("Recording enabled but no file path provided".to_string());
        }
    }

    // ── Input Modes ─────────────────────────────────────────────────────
    if let Some(ref km) = config.keyboard_mode {
        if !km.is_empty() && km != "default" {
            cmd.arg(format!("--keyboard={}", km));
        }
    }
    if let Some(ref mm) = config.mouse_mode {
        if !mm.is_empty() && mm != "default" {
            cmd.arg(format!("--mouse={}", mm));
        }
    }
    if let Some(ref gm) = config.gamepad_mode {
        if !gm.is_empty() && gm != "disabled" {
            cmd.arg(format!("--gamepad={}", gm));
        }
    }

    // ── V4L2 ────────────────────────────────────────────────────────────
    if let Some(ref sink) = config.v4l2_sink {
        if !sink.is_empty() {
            cmd.arg(format!("--v4l2-sink={}", sink));
            push_optional_u32(&mut cmd, "--v4l2-buffer", &config.v4l2_buffer);
        }
    }

    // ── No Playback ─────────────────────────────────────────────────────
    push_bool(&mut cmd, "--no-playback", config.no_playback);

    // ── Virtual Display ─────────────────────────────────────────────────
    if let Some(ref vd) = config.virtual_display {
        if !vd.is_empty() {
            cmd.arg(format!("--new-display={}", vd));
        } else {
            cmd.arg("--new-display");
        }
        push_optional_str(&mut cmd, "--start-app", &config.start_app);
    }

    // ── Network ─────────────────────────────────────────────────────────
    push_bool(&mut cmd, "--no-cleanup", config.no_cleanup);
    push_bool(&mut cmd, "--force-adb-forward", config.force_adb_forward);
    push_optional_u32(&mut cmd, "--time-limit", &config.time_limit);

    // ── Launch ──────────────────────────────────────────────────────────
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start scrcpy: {}", e))?;

    spawn_output_readers(&app, &config.serial, &mut child);

    let serial_clone = config.serial.clone();
    {
        let mut processes = SCRCPY_PROCESSES.lock().await;
        processes.insert(config.serial, child);
    }

    // Spawn exit monitor — polls until the process exits, then cleans up
    // and notifies the frontend.
    let app_clone = app.clone();
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            let mut processes = SCRCPY_PROCESSES.lock().await;
            if let Some(child) = processes.get_mut(&serial_clone) {
                match child.try_wait() {
                    Ok(Some(status)) => {
                        // Process exited on its own
                        let code = status.code();
                        processes.remove(&serial_clone);
                        let _ = app_clone.emit(
                            "scrcpy-exit",
                            serde_json::json!({
                                "serial": serial_clone,
                                "exitCode": code,
                            }),
                        );
                        break;
                    }
                    Ok(None) => {
                        // Still running
                        continue;
                    }
                    Err(_) => {
                        processes.remove(&serial_clone);
                        let _ = app_clone.emit(
                            "scrcpy-exit",
                            serde_json::json!({
                                "serial": serial_clone,
                                "exitCode": null,
                            }),
                        );
                        break;
                    }
                }
            } else {
                // Removed by stop_scrcpy
                break;
            }
        }
    });

    Ok(())
}

/// Take stdout and stderr from the child process, spawn tasks that read
/// lines and emit "scrcpy-log" events to the frontend.
fn spawn_output_readers(app: &tauri::AppHandle, serial: &str, child: &mut Child) {
    // stderr reader (scrcpy writes most output here)
    if let Some(stderr) = child.stderr.take() {
        let app_handle = app.clone();
        let serial_owned = serial.to_string();
        tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_handle.emit("scrcpy-log", serde_json::json!({
                    "serial": serial_owned,
                    "line": line,
                }));
            }
        });
    }

    // stdout reader (some scrcpy output may go here)
    if let Some(stdout) = child.stdout.take() {
        let app_handle = app.clone();
        let serial_owned = serial.to_string();
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_handle.emit("scrcpy-log", serde_json::json!({
                    "serial": serial_owned,
                    "line": line,
                }));
            }
        });
    }
}

#[tauri::command]
pub async fn stop_scrcpy(serial: String) -> Result<(), String> {
    let mut processes = SCRCPY_PROCESSES.lock().await;
    if let Some(mut child) = processes.remove(&serial) {
        let _ = child.kill().await;
        // Reap the zombie to prevent "free(): corrupted unsorted chunks"
        let _ = child.wait().await;
        Ok(())
    } else {
        Err("No scrcpy process found for this device".to_string())
    }
}

/// Kill and reap all running scrcpy processes. Called on app shutdown.
pub async fn kill_all_scrcpy() {
    let mut processes = SCRCPY_PROCESSES.lock().await;
    for (_serial, mut child) in processes.drain() {
        let _ = child.kill().await;
        let _ = child.wait().await;
    }
}
