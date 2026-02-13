use std::process::Stdio;
use tokio::process::Command;

/// Check if ADB connect output indicates success.
fn is_connect_success(stdout: &str) -> bool {
    stdout.contains("connected") || stdout.contains("already connected")
}

/// Format the ADB address from ip and port.
fn format_adb_address(ip: &str, port: u16) -> String {
    format!("{}:{}", ip, port)
}

#[tauri::command]
pub async fn connect_wireless_device(ip: String, port: u16) -> Result<(), String> {
    let addr = format_adb_address(&ip, port);
    let output = Command::new("adb")
        .args(["connect", &addr])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to execute adb connect: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        if is_connect_success(&stdout) {
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
    let addr = format_adb_address(&ip, port);
    let output = Command::new("adb")
        .args(["disconnect", &addr])
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn format_address_standard() {
        assert_eq!(
            format_adb_address("192.168.1.100", 5555),
            "192.168.1.100:5555"
        );
    }

    #[test]
    fn format_address_custom_port() {
        assert_eq!(format_adb_address("10.0.0.1", 12345), "10.0.0.1:12345");
    }

    #[test]
    fn connect_success_with_connected() {
        assert!(is_connect_success("connected to 192.168.1.100:5555"));
    }

    #[test]
    fn connect_success_with_already_connected() {
        assert!(is_connect_success(
            "already connected to 192.168.1.100:5555"
        ));
    }

    #[test]
    fn connect_failure_with_refused() {
        assert!(!is_connect_success(
            "failed to connect to 192.168.1.100:5555"
        ));
    }

    #[test]
    fn connect_failure_with_timeout() {
        assert!(!is_connect_success("unable to connect: timeout"));
    }

    #[test]
    fn connect_failure_empty() {
        assert!(!is_connect_success(""));
    }
}
