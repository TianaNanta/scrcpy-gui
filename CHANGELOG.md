# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Real-time Command Validation & Conflict Detection

- **Comprehensive scrcpy option validation**: Real-time validation of all 50+ scrcpy command-line options with type checking, range validation, and enum constraints
- **Intelligent conflict detection**: Automatic detection of incompatible flag combinations (e.g., turn-screen-off + show-touches, camera-id + camera-facing) with clear error messages
- **Command preview with validation status**: Live preview of formatted scrcpy commands with syntax highlighting, validation indicators, and error highlighting
- **Device-aware validation**: API level compatibility checking and device-specific option validation
- **Accessibility compliance**: Full ARIA support, screen reader compatibility, keyboard navigation, and semantic HTML structure
- **Performance optimization**: O(1) conflict detection using pre-computed conflict maps, <50ms validation response times
- **Comprehensive test coverage**: 33+ validation tests including unit tests, integration tests, and quickstart scenario validation

### Technical Details

- **Validation Engine**: TypeScript-based validation system with 50+ scrcpy options, conflict rules, and device compatibility checking
- **Conflict Resolution**: Pre-computed conflict maps for O(1) lookup performance, smart value-based conflict detection
- **UI Components**: React components with validation feedback (`CommandPreview`, `ValidationBanner`, `OptionField`) and accessibility features
- **Testing**: Complete test suite with unit tests, integration tests, and documentation validation
- **Performance**: Optimized validation algorithms ensuring real-time feedback without UI blocking

### Fixed

- **Validation option registry**: Added missing scrcpy options (`otg`, `no-audio`, `crop`, `no-video`, etc.) that were referenced in conflict rules but not defined, preventing "Unknown option" errors
- **Conflict detection logic**: Improved conflict detection to properly handle default values and prevent false conflicts when apps include default device settings
- **Option presence checking**: Enhanced validation to distinguish between explicitly set options and default values for more accurate conflict detection

#### Device Health Indicators & Status Polling

- **Real-time device status monitoring**: Display current battery percentage, charge status, storage usage, and network latency for connected devices
- **Smart warning indicators**: Visual badges show battery warnings (<20%) and storage warnings (<500MB) with color-coded status levels
- **Automatic status polling**: Configurable health check intervals (default 2 seconds) with exponential backoff retry logic for failed health queries
- **Health quality tiers**: Adaptive network quality assessment based on ADB latency (excellent <100ms, good <500ms, fair <2s, poor ≥2s)
- **Error recovery and reconnection**: Automatic device reconnection with exponential backoff, detailed error messages with troubleshooting suggestions
- **Device error banner**: Prominent error notifications with contextual help for common issues (device offline, ADB failure, permissions)
- **Battery and storage health analysis**: 
  - Battery: Percentage, temperature, charge status (charging/discharging/not charging), health classification
  - Storage: Used/free/total space with percentage visualization
- **Performance monitoring**: Track ADB command latency to assess network quality and adjust polling intervals

### Technical Details

- **Backend Architecture**: Health polling service in Rust with configurable retry strategy and event-driven updates
- **Frontend Integration**: React hooks (`useHealthPolling`) and components (`DeviceErrorBanner`, status indicators) with proper error handling
- **Type Safety**: Comprehensive TypeScript interfaces and Rust types for all health data structures
- **Testing**: 9 integration tests for Rust backend, 31+ unit/component tests for React frontend covering error scenarios and data parsing

---

## [Previous Versions]

*Earlier changelog entries for scrcpy-options-gui features can be added here as features are released.*
