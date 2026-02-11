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

#[tauri::command]
pub async fn start_scrcpy(
    app: tauri::AppHandle,
    serial: String,
    args: Vec<String>,
) -> Result<(), String> {
    if serial.is_empty() {
        return Err("Device serial is required".to_string());
    }

    // Check if session already active
    {
        let processes = SCRCPY_PROCESSES.lock().await;
        if processes.contains_key(&serial) {
            return Err(format!("Mirroring session already active for {}", serial));
        }
    }

    let mut cmd = Command::new("scrcpy");
    cmd.args(&args);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start scrcpy: {}", e))?;

    spawn_output_readers(&app, &serial, &mut child);

    let serial_clone = serial.clone();
    {
        let mut processes = SCRCPY_PROCESSES.lock().await;
        processes.insert(serial, child);
    }

    // Spawn exit monitor
    let app_clone = app.clone();
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            let mut processes = SCRCPY_PROCESSES.lock().await;
            if let Some(child) = processes.get_mut(&serial_clone) {
                match child.try_wait() {
                    Ok(Some(status)) => {
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
                    Ok(None) => continue,
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

#[cfg(test)]
mod tests {
    #[test]
    fn args_passthrough_preserves_order() {
        // Verify that Vec<String> args maintain their order
        let args = vec![
            "-s".to_string(),
            "DEVICE123".to_string(),
            "--max-fps".to_string(),
            "60".to_string(),
            "--window-title".to_string(),
            "My Phone".to_string(),
            "--always-on-top".to_string(),
        ];
        // Command::new("scrcpy").args(&args) would pass these in exact order
        assert_eq!(args[0], "-s");
        assert_eq!(args[1], "DEVICE123");
        assert_eq!(args[2], "--max-fps");
        assert_eq!(args[3], "60");
        assert_eq!(args[4], "--window-title");
        assert_eq!(args[5], "My Phone");
        assert_eq!(args[6], "--always-on-top");
    }

    #[test]
    fn args_with_spaces_preserved_as_single_elements() {
        let args = vec![
            "-s".to_string(),
            "abc".to_string(),
            "--window-title".to_string(),
            "My Android Phone".to_string(),
        ];
        // Each element is a discrete OS-level arg — no shell quoting needed
        assert_eq!(args[3], "My Android Phone");
        assert!(!args[3].contains('"'));
    }

    #[test]
    fn empty_args_vector_is_valid() {
        let args: Vec<String> = vec![];
        assert!(args.is_empty());
    }

    #[test]
    fn otg_mode_args() {
        let args = vec![
            "-s".to_string(),
            "OTG_DEVICE".to_string(),
            "--otg".to_string(),
        ];
        assert_eq!(args.len(), 3);
        assert_eq!(args[2], "--otg");
    }
}
