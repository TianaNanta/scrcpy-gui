# Enhanced Preset CRUD Operations

**Version**: 1.0.0
**Date**: February 15, 2026

## Overview
Enhancements to existing preset CRUD operations to support tags and favorites. Builds on existing localStorage-based storage.

## Enhanced Data Types

### Preset (Enhanced)
```typescript
interface Preset {
  id: string;
  name: string;
  settings: DeviceSettings;
  tags: string[];        // NEW: Array of tag names
  isFavorite: boolean;   // NEW: Favorite status
  createdAt: Date;       // NEW: Creation timestamp
  updatedAt: Date;       // NEW: Last update timestamp
}
```

## Enhanced Commands

### loadPresets (Enhanced)
Loads presets from localStorage with migration for new fields.

**Signature** (unchanged):
```typescript
export function loadPresets(): Preset[]
```

**Enhancements**:
- Migrates existing presets to add tags[], isFavorite, timestamps
- Validates preset data integrity
- Returns sorted array (favorites first, then alphabetical)

**Migration Logic**:
- Existing presets: tags = [], isFavorite = false
- Timestamps: createdAt/updatedAt = now for migrated presets
- Invalid presets: logged and skipped

### savePresetsToStorage (Enhanced)
Saves presets to localStorage with validation.

**Signature** (unchanged):
```typescript
export function savePresetsToStorage(presets: Preset[]): void
```

**Enhancements**:
- Validates all presets before saving
- Updates updatedAt timestamp for modified presets
- Debounced saves (500ms) to reduce localStorage writes

### createPreset (Enhanced)
Creates new preset with tags and favorite support.

**Signature** (unchanged):
```typescript
export function createPreset(name: string, settings: DeviceSettings): Preset
```

**Enhancements**:
- Generates UUID for id
- Initializes tags: [], isFavorite: false
- Sets createdAt/updatedAt to current time
- Validates name uniqueness

## New Utility Functions

### updatePresetTags
Updates tags for a specific preset.

**Signature**:
```typescript
export function updatePresetTags(presetId: string, tags: string[]): Preset[]
```

**Behavior**:
- Finds preset by id
- Updates tags array (deduplicated, trimmed)
- Updates updatedAt
- Saves to storage
- Returns updated presets array

### togglePresetFavorite
Toggles favorite status for a preset.

**Signature**:
```typescript
export function togglePresetFavorite(presetId: string): Preset[]
```

**Behavior**:
- Finds preset by id
- Toggles isFavorite
- Updates updatedAt
- Saves to storage
- Returns updated presets array

### getPresetsByTag
Filters presets by tag.

**Signature**:
```typescript
export function getPresetsByTag(tag: string): Preset[]
```

**Behavior**:
- Returns presets containing the specified tag
- Case-insensitive matching

### getFavoritePresets
Returns only favorite presets.

**Signature**:
```typescript
export function getFavoritePresets(): Preset[]
```

**Behavior**:
- Returns presets where isFavorite = true
- Sorted by updatedAt descending

### getAllTags
Returns all unique tags across presets.

**Signature**:
```typescript
export function getAllTags(): string[]
```

**Behavior**:
- Collects all tags from all presets
- Returns deduplicated, sorted array

## Validation Rules

- **Preset Name**: 1-50 characters, non-empty, unique
- **Tags**: 1-20 characters each, alphanumeric + spaces/hyphens, max 10 per preset
- **Timestamps**: ISO 8601 format in localStorage
- **ID**: UUID v4 format

## Error Handling
- Invalid preset data: Logged, preset skipped
- Storage errors: Fallback to in-memory state
- Validation failures: Return original state, log error