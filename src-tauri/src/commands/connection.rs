use std::process::Stdio;
use tokio::process::Command;

#[tauri::command]
pub async fn connect_wireless_device(ip: String, port: u16) -> Result<(), String> {
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
pub async fn disconnect_wireless_device(ip: String, port: u16) -> Result<(), String> {
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
