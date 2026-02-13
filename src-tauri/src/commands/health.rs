use crate::services::HealthPollingService;
use crate::types::health::{DeviceHealth, HealthPollingConfig};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResultResponse {
    pub success: bool,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GetDeviceHealthResponse {
    pub health: Option<DeviceHealth>,
    pub is_cached: bool,
}

/// Start health polling for the given devices
#[tauri::command]
pub async fn start_health_polling(
    device_ids: Vec<String>,
    config: Option<HealthPollingConfig>,
    polling_service: State<'_, Mutex<HealthPollingService>>,
) -> Result<CommandResultResponse, String> {
    if device_ids.is_empty() {
        return Err("No device IDs provided".to_string());
    }

    let config = config.unwrap_or_default();

    // Validate config
    config.validate()?;

    // Start polling
    let mut service = polling_service
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    service.start_polling(device_ids.clone(), config)?;

    Ok(CommandResultResponse {
        success: true,
        message: Some(format!(
            "Started polling for {} device(s)",
            device_ids.len()
        )),
    })
}

/// Stop health polling
#[tauri::command]
pub async fn stop_health_polling(
    polling_service: State<'_, Mutex<HealthPollingService>>,
) -> Result<CommandResultResponse, String> {
    let mut service = polling_service
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    service.stop_polling()?;

    Ok(CommandResultResponse {
        success: true,
        message: Some("Polling stopped".to_string()),
    })
}

/// Get current cached health for a device
#[tauri::command]
pub async fn get_device_health(
    device_id: String,
    polling_service: State<'_, Mutex<HealthPollingService>>,
) -> Result<GetDeviceHealthResponse, String> {
    // Get health snapshot without holding lock across await
    let health = {
        let service = polling_service
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        service.get_device_health_blocking(&device_id)
    };

    Ok(GetDeviceHealthResponse {
        health,
        is_cached: true,
    })
}
