# Quick Start: Improved Preset Management

**Feature**: 001-preset-management
**Date**: February 15, 2026

## Overview
Enhanced preset management with tags for organization, favorites for quick access, and JSON export/import for sharing and backup.

## Key Features
- **Tags**: Categorize presets (e.g., "gaming", "work", "testing")
- **Favorites**: Star presets for priority display
- **Export/Import**: Share presets as JSON files

## Getting Started

### 1. Accessing Preset Management
1. Open the scrcpy-gui application
2. Click the "Presets" tab in the sidebar
3. The preset management interface loads

### 2. Creating Presets with Tags
1. Configure your scrcpy settings in other tabs
2. Go to Presets tab
3. Enter preset name in the input field
4. Add tags using the tag input below (optional)
5. Click "Save Preset" or press Enter
6. Preset saves with tags and appears in the list

### 3. Organizing with Tags
1. Presets display with tag badges below the name
2. Filter presets by clicking on tag badges or using the filter input
3. Multiple tags can be combined for precise filtering

### 4. Marking Favorites
1. Find a frequently used preset
2. Click the star icon (☆) next to the preset name
3. Star fills (★) and preset moves to top of the list
4. Use "Show only favorites" checkbox to filter to favorites only

### 5. Exporting Presets
1. Click "Export" button in Presets tab (enabled when presets exist)
2. Choose save location in file dialog
3. Presets save as formatted JSON file

### 6. Importing Presets
1. Click "Import" button in Presets tab
2. Select JSON file in file dialog
3. Presets are automatically merged with existing ones
4. Duplicate IDs are resolved automatically

## Example Workflow

**Scenario**: Setting up gaming presets
1. Configure video settings for gaming (high bitrate, 60fps)
2. Save as "Gaming - High Quality"
3. Tag as "gaming", "high-quality"
4. Mark as favorite
5. Export to share with teammates

**Scenario**: Backup and restore
1. Export all presets before major changes
2. Make configuration experiments
3. Import backup if needed

## Troubleshooting

### Import Fails
- **Error**: "Invalid JSON format"
  - Solution: Ensure file is valid JSON from scrcpy-gui export
- **Error**: "Duplicate preset names"
  - Solution: Rename conflicting presets before import

### Export Fails
- **Error**: "Permission denied"
  - Solution: Choose a different save location with write access

### Tags Not Showing
- **Issue**: Tags don't appear on existing presets
  - Solution: Edit preset to add tags (migration adds empty tags array)

## Keyboard Shortcuts
- Tab: Navigate between preset actions
- Enter: Save preset from input field
- (Future) Ctrl+E: Export presets
- (Future) Ctrl+I: Import presets

## Performance Notes
- Exports up to 50 presets complete in <10 seconds
- Imports validate data integrity
- Favorites display instantly
- Tag filtering is real-time