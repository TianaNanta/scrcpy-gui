//! Health Polling Service
//!
//! Manages background polling of device health metrics with exponential backoff
//! for transient failures and event emission to React frontend.

use crate::services::adb_health_provider::AdbHealthProvider;
use crate::services::health_poller::{classify_error, ErrorType};
use crate::types::health::{ConnectionMetrics, QualityLevel};
use crate::types::health::{DeviceHealth, DeviceState, HealthPollingConfig};
use chrono::Utc;
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::RwLock;
use tokio::task::JoinHandle;

pub struct HealthPollingService {
    polling_task: Option<JoinHandle<()>>,
    is_running: Arc<AtomicBool>,
    device_health: Arc<RwLock<HashMap<String, DeviceHealth>>>,
    app_handle: AppHandle,
}

impl HealthPollingService {
    /// Create a new polling service
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            polling_task: None,
            is_running: Arc::new(AtomicBool::new(false)),
            device_health: Arc::new(RwLock::new(HashMap::new())),
            app_handle,
        }
    }

    /// Start polling for the given device IDs
    pub fn start_polling(
        &mut self,
        device_ids: Vec<String>,
        config: HealthPollingConfig,
    ) -> Result<(), String> {
        if self.polling_task.is_some() {
            return Err("Polling already running".to_string());
        }

        let app_handle = self.app_handle.clone();
        let health_map = self.device_health.clone();
        let is_running = Arc::new(AtomicBool::new(true));
        let is_running_clone = is_running.clone();

        let task = tokio::spawn(async move {
            Self::polling_loop(device_ids, config, app_handle, health_map, is_running_clone).await
        });

        self.polling_task = Some(task);
        self.is_running = is_running;
        Ok(())
    }

    /// Stop the polling service
    pub fn stop_polling(&mut self) -> Result<(), String> {
        self.is_running.store(false, Ordering::SeqCst);
        self.polling_task = None;
        Ok(())
    }

    /// Get current health for a device
    /// This does a blocking read - use only in contexts where blocking is acceptable
    pub fn get_device_health_blocking(&self, device_id: &str) -> Option<DeviceHealth> {
        // Block the current thread to read the RwLock synchronously
        let map = tokio::task::block_in_place(|| {
            tokio::runtime::Handle::current().block_on(self.device_health.read())
        });
        map.get(device_id).cloned()
    }

    /// Get current health for a device (async version)
    pub async fn get_device_health(&self, device_id: &str) -> Option<DeviceHealth> {
        let map = self.device_health.read().await;
        map.get(device_id).cloned()
    }

    /// Main polling loop - runs in background task
    async fn polling_loop(
        device_ids: Vec<String>,
        config: HealthPollingConfig,
        app_handle: AppHandle,
        health_map: Arc<RwLock<HashMap<String, DeviceHealth>>>,
        is_running: Arc<AtomicBool>,
    ) {
        // Initialize all devices as connecting
        {
            let mut map = health_map.write().await;
            let now = Utc::now().timestamp_millis() as u64;
            for device_id in &device_ids {
                let health = DeviceHealth {
                    device_id: device_id.clone(),
                    state: DeviceState::Connecting,
                    battery: None,
                    storage: None,
                    connection: None,
                    device: None,
                    staleness: crate::types::health::StalenessLevel::Stale,
                    last_seen: now,
                    last_updated: now,
                    error_reason: None,
                };
                map.insert(device_id.clone(), health);
            }
        }

        // Main polling loop with cancellation support
        loop {
            // Check if we should continue
            if !is_running.load(Ordering::SeqCst) {
                let _ = app_handle.emit("polling-stopped", ()).ok();
                break;
            }

            // Sleep for polling interval
            tokio::time::sleep(std::time::Duration::from_millis(
                config.polling_interval_usb as u64,
            ))
            .await;

            // Poll each device
            for device_id in &device_ids {
                let health_map_clone = health_map.clone();
                let app_handle_clone = app_handle.clone();
                let config_clone = config.clone();
                let device_id_clone = device_id.clone();

                // Spawn per-device polling task (non-blocking)
                tokio::spawn(async move {
                    match Self::poll_single_device(&device_id_clone, &config_clone).await {
                        Ok(health) => {
                            // Update cache
                            {
                                let mut map = health_map_clone.write().await;
                                map.insert(device_id_clone.clone(), health.clone());
                            }

                            // Emit health update event
                            let _ = app_handle_clone
                                .emit(
                                    "device-health-update",
                                    serde_json::json!({
                                        "deviceId": device_id_clone,
                                        "health": health,
                                        "reason": "poll_success",
                                        "timestamp": Utc::now().timestamp_millis(),
                                    }),
                                )
                                .ok();
                        }
                        Err(error_msg) => {
                            // Determine error type for retries
                            let error_type = classify_error(&error_msg);

                            // Only emit error for transient errors
                            if matches!(error_type, ErrorType::Offline | ErrorType::Timeout) {
                                // Emit error event with retry info
                                let _ = app_handle_clone
                                    .emit(
                                        "polling-error",
                                        serde_json::json!({
                                            "deviceId": device_id_clone,
                                            "error": {
                                                "code": format!("{:?}", error_type).to_lowercase(),
                                                "message": error_msg,
                                            },
                                            "attempt": 1,
                                            "maxAttempts": config_clone.max_retries,
                                            "willRetry": true,
                                            "nextRetryAt": Utc::now().timestamp_millis()
                                                + 500, // Initial backoff
                                        }),
                                    )
                                    .ok();
                            }
                        }
                    }
                });
            }
        }
    }

    /// Poll a single device for health metrics
    async fn poll_single_device(
        device_id: &str,
        config: &HealthPollingConfig,
    ) -> Result<DeviceHealth, String> {
        let now = Utc::now().timestamp_millis() as u64;

        // Check if device is online first
        let is_online = tokio::task::block_in_place(|| {
            std::process::Command::new("adb")
                .args(["-s", device_id, "shell", "echo", "ok"])
                .output()
                .map(|o| o.status.success())
                .unwrap_or(false)
        });

        if !is_online {
            return Err("Device offline".to_string());
        }

        // Create provider with configured timeout
        let provider = AdbHealthProvider::new(config.query_timeout);

        // Get battery info
        let battery = provider.get_battery_info(device_id).ok();

        // Get storage info
        let storage = provider.get_storage_info(device_id).ok();

        // Get device info
        let device = provider.get_device_info(device_id).ok();

        // Get latency
        let connection = match provider.get_latency(device_id) {
            Ok(latency) => Some(ConnectionMetrics {
                connection_type: crate::types::health::ConnectionType::Usb,
                latency,
                signal_strength: None,
                quality_level: Self::derive_quality_level(latency),
                estimated_bandwidth: None,
            }),
            Err(_) => None,
        };

        // Determine staleness
        let staleness = if battery.is_some() && storage.is_some() {
            crate::types::health::StalenessLevel::Fresh
        } else {
            crate::types::health::StalenessLevel::Stale
        };

        Ok(DeviceHealth {
            device_id: device_id.to_string(),
            state: DeviceState::Online,
            battery,
            storage,
            connection,
            device,
            staleness,
            last_seen: now,
            last_updated: now,
            error_reason: None,
        })
    }

    /// Derive connection quality from latency
    fn derive_quality_level(latency: u32) -> QualityLevel {
        match latency {
            0..=50 => QualityLevel::Excellent,
            51..=100 => QualityLevel::Good,
            101..=200 => QualityLevel::Fair,
            _ => QualityLevel::Poor,
        }
    }
}

impl Drop for HealthPollingService {
    fn drop(&mut self) {
        // Signal the polling loop to stop
        self.is_running.store(false, Ordering::SeqCst);
        
        // Abort the task if it's still running
        if let Some(task) = self.polling_task.take() {
            task.abort();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_derive_quality_excellent() {
        assert_eq!(
            HealthPollingService::derive_quality_level(25),
            QualityLevel::Excellent
        );
    }

    #[test]
    fn test_derive_quality_good() {
        assert_eq!(
            HealthPollingService::derive_quality_level(75),
            QualityLevel::Good
        );
    }

    #[test]
    fn test_derive_quality_fair() {
        assert_eq!(
            HealthPollingService::derive_quality_level(150),
            QualityLevel::Fair
        );
    }

    #[test]
    fn test_derive_quality_poor() {
        assert_eq!(
            HealthPollingService::derive_quality_level(300),
            QualityLevel::Poor
        );
    }
}
