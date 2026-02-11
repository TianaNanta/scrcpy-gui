mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            commands::system::check_dependencies,
            commands::system::get_scrcpy_version,
            commands::system::get_platform,
            commands::system::list_v4l2_devices,
            commands::device::list_devices,
            commands::device::get_device_health,
            commands::device::test_device,
            commands::scrcpy::start_scrcpy,
            commands::scrcpy::stop_scrcpy,
            commands::connection::connect_wireless_device,
            commands::connection::disconnect_wireless_device,
            commands::file::select_save_file,
        ])
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // Kill all scrcpy processes and reap zombies on app close
                tauri::async_runtime::block_on(commands::scrcpy::kill_all_scrcpy());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
