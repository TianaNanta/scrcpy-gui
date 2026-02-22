# Tauri Commands: Preset Export/Import

**Version**: 1.0.0
**Date**: February 15, 2026

## Overview
Commands for exporting presets to JSON files and importing presets from JSON files, using native file dialogs for user-selected paths.

## Commands

### select_export_path
Prompts user to select a file path for exporting presets.

**Signature**:
```rust
#[tauri::command]
pub async fn select_export_path() -> Result<Option<String>, String>
```

**Parameters**: None

**Returns**:
- `Ok(Some(path))`: User-selected file path as string
- `Ok(None)`: User cancelled dialog
- `Err(message)`: Dialog error message

**Behavior**:
- Opens native save file dialog
- Filters to .json files
- Suggests "presets-export.json" as default name
- Returns absolute file path or None if cancelled

### select_import_file
Prompts user to select a JSON file for importing presets.

**Signature**:
```rust
#[tauri::command]
pub async fn select_import_file() -> Result<Option<String>, String>
```

**Parameters**: None

**Returns**:
- `Ok(Some(path))`: User-selected file path as string
- `Ok(None)`: User cancelled dialog
- `Err(message)`: Dialog error message

**Behavior**:
- Opens native open file dialog
- Filters to .json files
- Returns absolute file path or None if cancelled

### export_presets
Exports presets array to specified JSON file.

**Signature**:
```rust
#[tauri::command]
pub async fn export_presets(file_path: String, presets: Vec<Preset>) -> Result<(), String>
```

**Parameters**:
- `file_path`: String - Absolute path to export file
- `presets`: Vec<Preset> - Array of preset objects to export

**Returns**:
- `Ok(())`: Export successful
- `Err(message)`: Export error with description

**Behavior**:
- Serializes presets to pretty-printed JSON
- Writes to file_path using UTF-8 encoding
- Validates file_path is writable
- Handles serialization errors

**Error Cases**:
- File write permission denied
- Invalid file path
- Serialization failure
- Disk full

### import_presets
Imports presets from specified JSON file.

**Signature**:
```rust
#[tauri::command]
pub async fn import_presets(file_path: String) -> Result<Vec<Preset>, String>
```

**Parameters**:
- `file_path`: String - Absolute path to import file

**Returns**:
- `Ok(presets)`: Array of successfully imported Preset objects
- `Err(message)`: Import error with description

**Behavior**:
- Reads file content as UTF-8
- Parses JSON array of Preset objects
- Validates each preset structure
- Migrates presets to current schema
- Returns validated presets

**Validation**:
- JSON parseable
- Array of objects with required fields
- Preset names non-empty and unique within import
- Tag names valid (1-20 chars, alphanumeric)
- Settings object valid DeviceSettings

**Error Cases**:
- File not found
- File read permission denied
- Invalid JSON format
- Invalid preset structure
- Empty file

## Error Handling
All commands return descriptive error messages suitable for user display. Errors distinguish between:
- User errors (invalid file, cancelled operation)
- System errors (permissions, disk space)
- Data errors (invalid JSON, schema mismatch)

## Security
- File operations limited to user-selected paths
- No arbitrary file access
- JSON parsing with size limits (future consideration)