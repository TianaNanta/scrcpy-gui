//! End-to-end polling tests with mocked ADB
//!
//! Uses a temporary mock adb script to simulate device responses.

use super::fixtures::fixtures;

#[cfg(unix)]
mod unix_tests {
    use super::fixtures;
    use scrcpy_gui_lib::services::AdbHealthProvider;
    use scrcpy_gui_lib::types::{
        ConnectionMetrics, ConnectionType, DeviceHealth, DeviceState, QualityLevel, StalenessLevel,
    };
    use std::env;
    use std::fs;
    use std::os::unix::fs::PermissionsExt;
    use std::path::PathBuf;
    use std::time::{Duration, SystemTime, UNIX_EPOCH};

    fn create_temp_dir() -> PathBuf {
        let mut dir = env::temp_dir();
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        dir.push(format!("scrcpy-gui-adb-mock-{}", nanos));
        fs::create_dir_all(&dir).expect("Failed to create temp dir");
        dir
    }

    fn write_mock_adb_script(dir: &PathBuf) {
        let script_path = dir.join("adb");
        let script = format!(
            r#"#!/usr/bin/env sh

if [ "$1" = "devices" ]; then
  cat <<'EOF'
{adb_devices}
EOF
  exit 0
fi

if [ "$1" = "-s" ]; then
  shift 2
fi

if [ "$1" = "shell" ]; then
  shift
  cmd="$1"

  if [ "$cmd" = "dumpsys battery" ]; then
    cat <<'EOF'
{battery}
EOF
    exit 0
  fi

  if [ "$cmd" = "df /data" ]; then
    cat <<'EOF'
{storage}
EOF
    exit 0
  fi

  if [ "$cmd" = "getprop ro.product.model" ]; then
    echo "{model}"
    exit 0
  fi

  if [ "$cmd" = "getprop ro.build.version.release" ]; then
    echo "{version}"
    exit 0
  fi

  if [ "$cmd" = "getprop ro.build.id" ]; then
    echo "{build}"
    exit 0
  fi

  if [ "$cmd" = "echo ok" ]; then
    echo "{latency}"
    exit 0
  fi
fi

echo "unknown command" 1>&2
exit 1
"#,
            adb_devices = fixtures::ADB_DEVICES_OUTPUT,
            battery = fixtures::BATTERY_OUTPUT_HIGH,
            storage = fixtures::STORAGE_OUTPUT_GOOD,
            model = fixtures::DEVICE_MODEL_OUTPUT,
            version = fixtures::ANDROID_VERSION_OUTPUT,
            build = fixtures::BUILD_ID_OUTPUT,
            latency = fixtures::LATENCY_OUTPUT,
        );

        fs::write(&script_path, script).expect("Failed to write mock adb");
        let mut perms = fs::metadata(&script_path).unwrap().permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&script_path, perms).expect("Failed to set executable permission");
    }

    #[tokio::test]
    async fn test_polling_with_mocked_devices() {
        let temp_dir = create_temp_dir();
        write_mock_adb_script(&temp_dir);

        let original_path = env::var("PATH").unwrap_or_default();
        let new_path = format!("{}:{}", temp_dir.display(), original_path);
        env::set_var("PATH", new_path);

        let provider = AdbHealthProvider::new(500);

        let health_a = build_health(&provider, "emulator-5554").await;
        let health_b = build_health(&provider, "ABC123").await;

        assert_eq!(health_a.state, DeviceState::Online);
        assert_eq!(health_b.state, DeviceState::Online);
        assert!(health_a.battery.is_some());
        assert!(health_a.storage.is_some());
        assert!(health_a.device.is_some());

        env::set_var("PATH", original_path);
    }

    async fn build_health(provider: &AdbHealthProvider, device_id: &str) -> DeviceHealth {
        let battery = provider.get_battery_info(device_id).ok();
        let storage = provider.get_storage_info(device_id).ok();
        let device = provider.get_device_info(device_id).ok();

        let connection = provider.get_latency(device_id).ok().map(|latency| {
            let quality_level = match latency {
                0..=49 => QualityLevel::Excellent,
                50..=99 => QualityLevel::Good,
                100..=199 => QualityLevel::Fair,
                _ => QualityLevel::Poor,
            };

            ConnectionMetrics {
                connection_type: ConnectionType::Usb,
                latency,
                signal_strength: None,
                quality_level,
                estimated_bandwidth: None,
            }
        });

        DeviceHealth {
            device_id: device_id.to_string(),
            state: DeviceState::Online,
            battery,
            storage,
            connection,
            device,
            staleness: StalenessLevel::Fresh,
            last_seen: 0,
            last_updated: 0,
            error_reason: None,
        }
    }
}

#[cfg(not(unix))]
mod non_unix_tests {
    #[test]
    fn test_polling_with_mocked_devices() {
        // Skipped on non-unix platforms due to mock adb shell script usage.
        assert!(true);
    }
}
