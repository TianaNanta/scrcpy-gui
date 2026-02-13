# Quick Start: Implementation Guide

**Feature**: Device Health Indicators & Status Polling  
**Date**: 2026-02-13  
**Stack**: Tauri + Rust + React + TypeScript

---

## 1. Setup & File Structure

### Create new files (backend):

```bash
# Rust services
touch src-tauri/src/services/health_poller.rs
touch src-tauri/src/services/adb_health_provider.rs

# Tauri commands
touch src-tauri/src/commands/device_health.rs

# Tests
mkdir -p src-tauri/tests/health
touch src-tauri/tests/health/polling_tests.rs
touch src-tauri/tests/health/adb_provider_tests.rs
```

### Create new files (frontend):

```bash
# Hooks
touch src/hooks/useDeviceHealth.ts
touch src/hooks/useHealthPolling.ts

# Components
touch src/components/DeviceStatusIndicator.tsx
touch src/components/DeviceInfoPopover.tsx

# Types
touch src/types/health.ts

# Tests
touch src/components/DeviceStatusIndicator.test.tsx
touch src/components/DeviceInfoPopover.test.tsx
touch src/hooks/useDeviceHealth.test.ts
touch src/hooks/useHealthPolling.test.ts
```

---

## 2. Rust Backend Implementation

### Step 1: Define Types (src-tauri/src/types.rs)

```rust
// Add to existing types or create new file
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceHealth {
    pub device_id: String,
    pub state: DeviceState,
    pub last_seen: i64,
    pub last_updated: i64,
    pub battery: Option<BatteryInfo>,
    pub storage: Option<StorageInfo>,
    pub connection: Option<ConnectionMetrics>,
    pub device_info: Option<DeviceInfo>,
    pub staleness: StalenessLevel,
    pub error_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DeviceState {
    Online,
    Offline,
    Connecting,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatteryInfo {
    pub percentage: u32,
    pub temperature: Option<i32>,
    pub is_charging: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageInfo {
    pub used: u64,
    pub total: u64,
    pub free: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionMetrics {
    pub connection_type: String, // "usb" | "wireless"
    pub latency: u32,
    pub signal_strength: Option<i32>,
    pub quality_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StalenessLevel {
    Fresh,
    Stale,
    Offline,
}
```

### Step 2: Implement ADB Health Provider

```rust
// src-tauri/src/services/adb_health_provider.rs

use std::process::Command;
use std::time::Duration;

pub struct AdbHealthProvider;

impl AdbHealthProvider {
    pub async fn get_battery_info(device_id: &str) -> Result<BatteryInfo, String> {
        let output = Self::run_adb_command(device_id, "shell dumpsys battery")
            .await?;
        
        // Parse dumpsys battery output
        let percentage = Self::parse_battery_percentage(&output)?;
        let temperature = Self::parse_battery_temp(&output);
        let is_charging = Self::parse_charging_status(&output);
        
        Ok(BatteryInfo {
            percentage,
            temperature,
            is_charging,
        })
    }

    pub async fn get_storage_info(device_id: &str) -> Result<StorageInfo, String> {
        let output = Self::run_adb_command(device_id, "shell df /data")
            .await?;
        
        // Parse df output: "Filesystem 1K-blocks Used Available Use% Mounted on"
        let total = Self::parse_df_total(&output)?;
        let used = Self::parse_df_used(&output)?;
        let free = total - used;
        
        Ok(StorageInfo { used, total, free })
    }

    pub async fn get_device_info(device_id: &str) -> Result<DeviceInfo, String> {
        let model = Self::run_adb_command(device_id, "shell getprop ro.product.model")
            .await?
            .trim()
            .to_string();
        
        let version = Self::run_adb_command(device_id, "shell getprop ro.build.version.release")
            .await?
            .trim()
            .to_string();
        
        let build = Self::run_adb_command(device_id, "shell getprop ro.build.id")
            .await?
            .trim()
            .to_string();
        
        Ok(DeviceInfo {
            model_name: model,
            android_version: version,
            build_number: build,
        })
    }

    pub async fn get_latency(device_id: &str) -> Result<u32, String> {
        let start = std::time::Instant::now();
        Self::run_adb_command(device_id, "shell echo ok").await?;
        let latency = start.elapsed().as_millis() as u32;
        Ok(latency)
    }

    // Private helper
    async fn run_adb_command(device_id: &str, cmd: &str) -> Result<String, String> {
        let output = Command::new("adb")
            .args(&["-s", device_id, "shell"])
            .arg(cmd)
            .output()
            .map_err(|e| format!("Failed to execute adb: {}", e))?;
        
        if !output.status.success() {
            return Err(format!(
                "adb command failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }
        
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }

    // Parser helper functions
    fn parse_battery_percentage(output: &str) -> Result<u32, String> {
        for line in output.lines() {
            if line.contains("level:") {
                let value = line.split_whitespace()
                    .last()
                    .ok_or("Could not parse battery level")?
                    .parse()
                    .map_err(|_| "Invalid battery percentage")?;
                return Ok(value);
            }
        }
        Err("Battery level not found in output".to_string())
    }

    fn parse_battery_temp(output: &str) -> Option<i32> {
        for line in output.lines() {
            if line.contains("temperature:") {
                return line.split_whitespace()
                    .last()
                    .and_then(|s| s.parse().ok());
            }
        }
        None
    }

    fn parse_charging_status(output: &str) -> Option<bool> {
        output.lines()
            .find(|line| line.contains("AC powered:"))
            .and_then(|line| line.split_whitespace().last())
            .map(|s| s == "true")
    }

    // Similar helpers for df parsing
    fn parse_df_total(output: &str) -> Result<u64, String> { /* ... */ }
    fn parse_df_used(output: &str) -> Result<u64, String> { /* ... */ }
}
```

### Step 3: Implement Health Polling Service

```rust
// src-tauri/src/services/health_poller.rs

use tokio::task::JoinHandle;
use tokio_util::sync::CancellationToken;
use std::sync::Arc;
use std::collections::HashMap;

pub struct HealthPollingService {
    polling_task: Option<JoinHandle<()>>,
    cancellation_token: CancellationToken,
    device_health: Arc<RwLock<HashMap<String, DeviceHealth>>>,
    app_handle: AppHandle,
}

impl HealthPollingService {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            polling_task: None,
            cancellation_token: CancellationToken::new(),
            device_health: Arc::new(RwLock::new(HashMap::new())),
            app_handle,
        }
    }

    pub async fn start_polling(
        &mut self,
        device_ids: Vec<String>,
        config: HealthPollingConfig,
    ) -> Result<(), String> {
        if self.polling_task.is_some() {
            return Err("Polling already running".to_string());
        }

        let app_handle = self.app_handle.clone();
        let health_map = self.device_health.clone();
        let token = self.cancellation_token.child_token();

        let task = tokio::spawn(async move {
            Self::polling_loop(
                device_ids,
                config,
                app_handle,
                health_map,
                token,
            ).await
        });

        self.polling_task = Some(task);
        Ok(())
    }

    async fn polling_loop(
        device_ids: Vec<String>,
        config: HealthPollingConfig,
        app_handle: AppHandle,
        health_map: Arc<RwLock<HashMap<String, DeviceHealth>>>,
        cancellation_token: CancellationToken,
    ) {
        loop {
            tokio::select! {
                _ = cancellation_token.cancelled() => {
                    break;
                }
                _ = tokio::time::sleep(Duration::from_millis(
                    config.polling_interval_usb
                )) => {
                    for device_id in &device_ids {
                        // Poll this device
                        match Self::poll_single_device(device_id, &config).await {
                            Ok(health) => {
                                let mut map = health_map.write().unwrap();
                                map.insert(device_id.clone(), health.clone());
                                
                                // Emit event
                                let _ = app_handle.emit_all(
                                    "device-health-update",
                                    serde_json::json!({
                                        "deviceId": device_id,
                                        "health": health,
                                        "reason": "poll",
                                        "timestamp": chrono::Utc::now().timestamp_millis(),
                                    }),
                                );
                            }
                            Err(e) => {
                                // Emit error event for retry logic
                                let _ = app_handle.emit_all(
                                    "polling-error",
                                    serde_json::json!({
                                        "deviceId": device_id,
                                        "error": { "code": "poll_failed", "message": e },
                                        "willRetry": true,
                                    }),
                                );
                            }
                        }
                    }
                }
            }
        }

        // Emit stopped event
        let _ = app_handle.emit_all(
            "polling-stopped",
            serde_json::json!({
                "timestamp": chrono::Utc::now().timestamp_millis(),
                "reason": "user",
            }),
        );
    }

    async fn poll_single_device(
        device_id: &str,
        config: &HealthPollingConfig,
    ) -> Result<DeviceHealth, String> {
        let latency = AdbHealthProvider::get_latency(device_id).await?;
        let battery = AdbHealthProvider::get_battery_info(device_id).await.ok();
        let storage = AdbHealthProvider::get_storage_info(device_id).await.ok();
        let device_info = AdbHealthProvider::get_device_info(device_id).await.ok();

        let quality_level = if latency < 50 {
            "excellent"
        } else if latency < 100 {
            "good"
        } else if latency < 200 {
            "fair"
        } else {
            "poor"
        };

        Ok(DeviceHealth {
            device_id: device_id.to_string(),
            state: DeviceState::Online,
            last_seen: chrono::Utc::now().timestamp_millis(),
            last_updated: chrono::Utc::now().timestamp_millis(),
            battery,
            storage,
            device_info,
            connection: Some(ConnectionMetrics {
                connection_type: "usb".to_string(), // Determine from device metadata
                latency,
                signal_strength: None,
                quality_level: quality_level.to_string(),
            }),
            staleness: StalenessLevel::Fresh,
            error_reason: None,
        })
    }

    pub async fn stop_polling(&mut self) -> Result<(), String> {
        self.cancellation_token.cancel();
        if let Some(task) = self.polling_task.take() {
            task.await.map_err(|e| format!("Failed to stop task: {}", e))?;
        }
        Ok(())
    }
}
```

### Step 4: Export Commands (src-tauri/src/commands/device_health.rs)

```rust
#[tauri::command]
async fn start_health_polling(
    config: HealthPollingConfig,
    device_ids: Vec<String>,
    state: tauri::State<'_, Arc<Mutex<HealthPollingService>>>,
) -> Result<(), String> {
    let mut service = state.lock().await;
    service.start_polling(device_ids, config).await
}

#[tauri::command]
async fn stop_health_polling(
    state: tauri::State<'_, Arc<Mutex<HealthPollingService>>>,
) -> Result<(), String> {
    let mut service = state.lock().await;
    service.stop_polling().await
}

#[tauri::command]
async fn get_device_health(
    device_id: String,
    state: tauri::State<'_, Arc<Mutex<HealthPollingService>>>,
) -> Result<DeviceHealth, String> {
    let service = state.lock().await;
    service.get_device_health(&device_id).cloned()
        .ok_or_else(|| "Device health not found".to_string())
}
```

### Step 5: Register in lib.rs

```rust
// src-tauri/src/lib.rs

mod services;
mod commands;
mod types;

pub fn run() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let mut app = tauri::Builder::default()
            .invoke_handler(tauri::generate_handler![
                commands::device_health::start_health_polling,
                commands::device_health::stop_health_polling,
                commands::device_health::get_device_health,
            ])
            .setup(|app| {
                // Initialize polling service
                let polling_service = HealthPollingService::new(app.handle());
                app.manage(Arc::new(Mutex::new(polling_service)));
                Ok(())
            })
            .build(tauri::generate_context!())
            .expect("error while building tauri application");

        app.run(|_app_handle, event| {
            match event {
                tauri::RunEvent::ExitRequested { api, .. } => {
                    api.prevent_exit();
                }
                _ => {}
            }
        });
    });
}
```

---

## 3. React Frontend Implementation

### Step 1: Define Types (src/types/health.ts)

```typescript
export interface DeviceHealth {
  deviceId: string;
  state: 'online' | 'offline' | 'connecting' | 'error';
  lastSeen: number;
  lastUpdated: number;
  battery?: {
    percentage: number;
    temperature?: number;
    isCharging?: boolean;
  };
  storage?: {
    used: number;
    total: number;
    free: number;
  };
  connection?: {
    type: 'usb' | 'wireless';
    latency: number;
    signalStrength?: number;
    qualityLevel: 'excellent' | 'good' | 'fair' | 'poor';
  };
  staleness: 'fresh' | 'stale' | 'offline';
  errorReason?: string;
}

export interface HealthPollingConfig {
  pollingIntervalUsb: number;
  pollingIntervalWireless: number;
  offlineThreshold: number;
  maxRetries: number;
  retryBackoffMs: number;
  enabled: boolean;
  collectBattery: boolean;
  collectStorage: boolean;
  collectConnectionMetrics: boolean;
  collectDeviceInfo: boolean;
}

export interface DeviceHealthUpdateEvent {
  deviceId: string;
  health: DeviceHealth;
  reason: 'poll' | 'retry' | 'manual_refresh';
  timestamp: number;
}

export interface PollingErrorEvent {
  deviceId: string;
  error: { code: string; message: string };
  attempt: number;
  maxAttempts: number;
  nextRetryAt?: number;
  willRetry: boolean;
}
```

### Step 2: Implement Hooks

```typescript
// src/hooks/useDeviceHealth.ts

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { DeviceHealth, DeviceHealthUpdateEvent } from '@/types/health';

export function useDeviceHealth(deviceId: string) {
  const [health, setHealth] = useState<DeviceHealth | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const unsubscribe = listen<DeviceHealthUpdateEvent>(
      'device-health-update',
      (event) => {
        if (event.payload.deviceId === deviceId) {
          setHealth(event.payload.health);
          setIsPolling(false);
        }
      }
    );

    return () => {
      unsubscribe.then(fn => fn());
    };
  }, [deviceId]);

  const refresh = async () => {
    setIsPolling(true);
    try {
      const response = await invoke<any>('get_device_health', { device_id: deviceId });
      setHealth(response.health);
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setIsPolling(false);
    }
  };

  return { health, isPolling, error, refresh };
}
```

```typescript
// src/hooks/useHealthPolling.ts

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { HealthPollingConfig, PollingErrorEvent } from '@/types/health';

export function useHealthPolling(
  enabled: boolean,
  config?: HealthPollingConfig,
  deviceIds?: string[]
) {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const start = async () => {
      try {
        await invoke('start_health_polling', {
          config: config || getDefaultConfig(),
          device_ids: deviceIds || [],
        });
        setIsActive(true);
        setError(undefined);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start polling');
      }
    };

    const stop = async () => {
      try {
        await invoke('stop_health_polling');
        setIsActive(false);
      } catch (err) {
        console.error('Failed to stop polling:', err);
      }
    };

    if (enabled && deviceIds?.length) {
      start();
    } else if (!enabled && isActive) {
      stop();
    }

    return () => {
      if (isActive) stop();
    };
  }, [enabled, config, deviceIds]);

  // Listen for errors
  useEffect(() => {
    const unsubscribe = listen<PollingErrorEvent>('polling-error', (event) => {
      console.warn(`Device ${event.payload.deviceId}: ${event.payload.error.message}`);
    });

    return () => {
      unsubscribe.then(fn => fn());
    };
  }, []);

  return { isActive, error };
}

function getDefaultConfig(): HealthPollingConfig {
  return {
    pollingIntervalUsb: 1000,
    pollingIntervalWireless: 3000,
    offlineThreshold: 5000,
    maxRetries: 5,
    retryBackoffMs: 500,
    enabled: true,
    collectBattery: true,
    collectStorage: true,
    collectConnectionMetrics: true,
    collectDeviceInfo: true,
  };
}
```

### Step 3: Implement Components

```typescript
// src/components/DeviceStatusIndicator.tsx

export interface DeviceStatusIndicatorProps {
  status: 'online' | 'offline' | 'connecting' | 'error';
  animate?: boolean;
  className?: string;
}

export function DeviceStatusIndicator({
  status,
  animate = true,
  className,
}: DeviceStatusIndicatorProps) {
  const statusClass = `status-${status}`;
  const animateClass = animate && status === 'online' ? 'animate' : '';

  return (
    <div
      className={`device-status ${statusClass} ${animateClass} ${className || ''}`}
      role="status"
      aria-label={`Device ${status}`}
    />
  );
}
```

### Step 4: Update Existing Components

Modify `src/components/DeviceCard.tsx` to accept and display health:

```typescript
interface DeviceCardProps {
  // ... existing props
  health?: DeviceHealth;
  onInfoClick?: () => void;
}

export function DeviceCard({ device, health, onInfoClick, ...props }: DeviceCardProps) {
  return (
    <Card {...props}>
      <div className="device-card-header">
        <DeviceStatusIndicator status={health?.state || 'offline'} />
        <span className="device-name">{device.name}</span>
        {onInfoClick && (
          <button onClick={onInfoClick} className="info-btn">
            ℹ️
          </button>
        )}
      </div>

      {health && (
        <div className="device-health-info">
          {health.battery && (
            <BatteryBadge
              percentage={health.battery.percentage}
              charging={health.battery.isCharging}
            />
          )}
          {health.storage && (
            <StorageBadge
              free={health.storage.free}
              total={health.storage.total}
            />
          )}
        </div>
      )}

      <div className="device-card-actions">
        <button onClick={() => props.onSettings?.(device.id)}>Settings</button>
        <button onClick={() => props.onStart?.(device.id)}>Start Scrcpy</button>
      </div>
    </Card>
  );
}
```

---

## 4. Testing

### Rust Tests

```rust
// src-tauri/tests/health/adb_provider_tests.rs

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_battery_percentage() {
        let output = r#"
Current Battery Service state:
  AC powered: false
  level: 85
  temperature: 32
"#;
        let percent = AdbHealthProvider::parse_battery_percentage(output).unwrap();
        assert_eq!(percent, 85);
    }
}
```

### React Tests

```typescript
// src/hooks/useDeviceHealth.test.ts

import { renderHook } from '@testing-library/react';
import { useDeviceHealth } from './useDeviceHealth';

describe('useDeviceHealth', () => {
  it('should initialize with null health', () => {
    const { result } = renderHook(() => useDeviceHealth('test-device'));
    expect(result.current.health).toBeNull();
  });
});
```

---

## 5. Integration Checklist

- [ ] Rust types compile with `cargo build`
- [ ] Tauri commands export in `lib.rs`
- [ ] React types match Rust serialization
- [ ] `useDeviceHealth` hook works with mock data
- [ ] `DeviceStatusIndicator` renders all states
- [ ] Device card displays health info
- [ ] Events flow from Rust → React
- [ ] No memory leaks (check DevTools)
- [ ] Tests pass: `cargo test && bun test`

---

## 6. Common Patterns

### Debouncing State Updates

```typescript
const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

const updateHealth = (health: DeviceHealth) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  setDebounceTimer(
    setTimeout(() => {
      setDeviceHealth(prev => ({ ...prev, [health.deviceId]: health }));
    }, 100)
  );
};
```

### Error Recovery with Exponential Backoff

```rust
async fn poll_with_retry(device_id: &str) -> Result<DeviceHealth, String> {
    let mut attempt = 0;
    loop {
        match poll_device(device_id).await {
            Ok(health) => return Ok(health),
            Err(e) if attempt < MAX_RETRIES => {
                let backoff = Duration::from_millis(500 * 2_u64.pow(attempt));
                tokio::time::sleep(backoff).await;
                attempt += 1;
            }
            Err(e) => return Err(e),
        }
    }
}
```

---

## Next Steps

1. Implement Rust backend (steps 1-5)
2. Create React hooks and components (steps 1-4)
3. Write and pass unit tests (step 4)
4. Integration testing with real devices
5. Create end-to-end test with mock ADB responses
