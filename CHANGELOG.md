# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
