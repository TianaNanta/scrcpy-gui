#[tauri::command]
pub async fn select_save_file() -> Result<Option<String>, String> {
    let file_path = rfd::FileDialog::new()
        .set_title("Select Recording Save Location")
        .add_filter("MP4 Video", &["mp4"])
        .add_filter("MKV Video", &["mkv"])
        .add_filter("All Video Files", &["mp4", "mkv"])
        .set_file_name("scrcpy_recording.mp4")
        .save_file();

    match file_path {
        Some(path) => Ok(Some(path.to_string_lossy().to_string())),
        None => Ok(None),
    }
}
