use std::fs;

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

#[tauri::command]
pub async fn export_presets(content: String) -> Result<bool, String> {
    let file_path = rfd::FileDialog::new()
        .set_title("Export Presets")
        .add_filter("JSON Files", &["json"])
        .set_file_name("scrcpy_presets.json")
        .save_file();

    match file_path {
        Some(path) => {
            fs::write(&path, content).map_err(|e| format!("Failed to write file: {}", e))?;
            Ok(true)
        }
        None => Ok(false), // User cancelled
    }
}

#[tauri::command]
pub async fn import_presets() -> Result<Option<String>, String> {
    let file_path = rfd::FileDialog::new()
        .set_title("Import Presets")
        .add_filter("JSON Files", &["json"])
        .pick_file();

    match file_path {
        Some(path) => {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read file: {}", e))?;
            Ok(Some(content))
        }
        None => Ok(None), // User cancelled
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;

    #[derive(serde::Serialize, serde::Deserialize)]
    struct TestPreset {
        id: String,
        name: String,
        tags: Vec<String>,
        is_favorite: bool,
    }

    #[test]
    fn test_export_presets_json_validation() {
        // Test that valid JSON can be serialized
        let presets = vec![
            TestPreset {
                id: "preset-1".to_string(),
                name: "Test Preset".to_string(),
                tags: vec!["gaming".to_string()],
                is_favorite: true,
            },
            TestPreset {
                id: "preset-2".to_string(),
                name: "Another Preset".to_string(),
                tags: vec![],
                is_favorite: false,
            },
        ];

        let json = serde_json::to_string(&presets).unwrap();
        
        // Verify it's valid JSON
        let parsed: Vec<TestPreset> = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.len(), 2);
        assert_eq!(parsed[0].name, "Test Preset");
        assert_eq!(parsed[1].is_favorite, false);
    }

    #[test]
    fn test_import_presets_json_validation() {
        // Test that valid JSON can be parsed
        let json = r#"[
            {
                "id": "preset-1",
                "name": "Test Preset",
                "tags": ["gaming"],
                "is_favorite": true
            },
            {
                "id": "preset-2", 
                "name": "Another Preset",
                "tags": [],
                "is_favorite": false
            }
        ]"#;

        let presets: Vec<TestPreset> = serde_json::from_str(json).unwrap();
        assert_eq!(presets.len(), 2);
        assert_eq!(presets[0].id, "preset-1");
        assert_eq!(presets[0].tags, vec!["gaming"]);
        assert_eq!(presets[1].is_favorite, false);
    }

    #[test]
    fn test_import_presets_invalid_json() {
        // Test that invalid JSON is rejected
        let invalid_json = r#"[
            {
                "id": "preset-1",
                "name": "Test Preset",
                "tags": ["gaming"],
                "is_favorite": true
            },
            {
                "id": "preset-2",
                "name": "Another Preset",
                "tags": [],
                "is_favorite": invalid_value
            }
        ]"#;

        let result: Result<Vec<TestPreset>, _> = serde_json::from_str(invalid_json);
        assert!(result.is_err());
    }

    #[test]
    fn test_import_presets_missing_required_fields() {
        // Test that presets missing required fields are handled
        let incomplete_json = r#"[
            {
                "id": "preset-1",
                "tags": ["gaming"],
                "is_favorite": true
            }
        ]"#;

        let result: Result<Vec<TestPreset>, _> = serde_json::from_str(incomplete_json);
        assert!(result.is_err()); // Should fail due to missing 'name' field
    }
}
