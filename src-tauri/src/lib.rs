mod commands;
pub mod services;
pub mod types;

use services::HealthPollingService;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            // Initialize health polling service
            let polling_service = HealthPollingService::new(app.handle().clone());
            app.manage(Mutex::new(polling_service));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system::check_dependencies,
            commands::system::get_scrcpy_version,
            commands::system::get_platform,
            commands::system::list_v4l2_devices,
            commands::device::list_devices,
            commands::device::list_adb_devices,
            commands::device::register_device,
            commands::device::test_device,
            commands::device::forget_device,
            commands::scrcpy::start_scrcpy,
            commands::scrcpy::stop_scrcpy,
            commands::connection::connect_wireless_device,
            commands::connection::disconnect_wireless_device,
            commands::file::select_save_file,
            commands::health::start_health_polling,
            commands::health::stop_health_polling,
            commands::health::get_device_health,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // Stop health polling before killing scrcpy processes
                if let Ok(mut polling_service) = window.app_handle().state::<Mutex<HealthPollingService>>().lock() {
                    let _ = polling_service.stop_polling();
                }
                
                // Kill all scrcpy processes and reap zombies on app close
                tauri::async_runtime::block_on(async {
                    commands::scrcpy::kill_all_scrcpy().await;
                });
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
