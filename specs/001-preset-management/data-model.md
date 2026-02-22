# Data Model: Improved Preset Management

**Date**: February 15, 2026
**Feature**: 001-preset-management

## Entities

### Preset
Represents a saved scrcpy configuration with enhanced organization features.

**Attributes**:
- `id`: string (UUID, unique identifier)
- `name`: string (user-defined name, required, 1-50 chars)
- `settings`: DeviceSettings (full scrcpy configuration object)
- `tags`: string[] (array of tag names, optional, max 10 tags)
- `isFavorite`: boolean (favorite status, default false)
- `createdAt`: Date (creation timestamp)
- `updatedAt`: Date (last modification timestamp)

**Validation Rules**:
- `name`: Required, non-empty, trimmed, unique among presets
- `tags`: Array of strings, each 1-20 chars, unique within preset
- `settings`: Valid DeviceSettings object (inherited validation)

**Relationships**:
- None (tags stored as strings, no separate Tag entity for simplicity)

### Tag
Implicit entity represented as strings within Preset.tags array.

**Attributes**:
- `name`: string (tag text, 1-20 characters)
- `usageCount`: number (computed, presets using this tag)

**Validation Rules**:
- Alphanumeric + spaces/hyphens, no special chars
- Case-insensitive uniqueness (normalize to lowercase)

## State Transitions

### Preset States
- **Active**: Normal preset state
- **Favorite**: Marked as favorite (isFavorite: true)
- **Tagged**: Has one or more tags
- **Archived**: Soft delete (future extension)

**Transitions**:
- Active ↔ Favorite (toggle isFavorite)
- Active/Tagged ↔ Tagged (add/remove tags)
- Any state → Deleted (hard delete)

## Data Flow

### Storage
- **Primary**: localStorage (existing "scrcpy-presets" key)
- **Export**: JSON file with array of Preset objects
- **Import**: JSON file validation and merge with existing presets

### Migration
- Existing presets: Add tags: [], isFavorite: false, createdAt/updatedAt
- Tag normalization: Convert to lowercase, remove duplicates
- Validation: Remove invalid presets on load

## Performance Considerations

- **Scale**: <100 presets expected, no indexing needed
- **Memory**: Keep full objects in memory, lazy load if needed
- **Persistence**: Debounced saves to localStorage (500ms delay)
- **Export**: Stream large exports if >1000 presets (future)