//! Health Poller Service
//!
//! Implements polling logic with exponential backoff and error recovery.
//! Handles transient failures (offline, timeout) with retry attempts.
//! Emits error events on each retry for UI feedback.

use crate::types::*;
use std::time::Duration;
use tauri::Emitter;

/// Error information
#[derive(Debug, Clone, serde::Serialize)]
pub struct ErrorInfo {
    pub code: String,
    pub message: String,
}

/// Error event emitted during polling retries
#[derive(Debug, Clone, serde::Serialize)]
pub struct PollingErrorEvent {
    #[serde(rename = "deviceId")]
    pub device_id: String,
    pub error: ErrorInfo,
    pub attempt: u32,
    #[serde(rename = "maxAttempts")]
    pub max_attempts: u32,
    #[serde(rename = "nextRetryAt")]
    pub next_retry_at: Option<u64>,
    #[serde(rename = "willRetry")]
    pub will_retry: bool,
}

/// Transient errors that should trigger a retry
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ErrorType {
    /// Device is offline/unreachable
    Offline,
    /// Command execution timeout
    Timeout,
    /// Network connection issue
    NetworkError,
    /// Permanent error - do not retry
    Permanent,
}

/// Determine if an error is transient (should retry) or permanent
pub fn classify_error(error: &str) -> ErrorType {
    let lower = error.to_lowercase();

    if lower.contains("offline")
        || lower.contains("not found")
        || lower.contains("device not found")
    {
        ErrorType::Offline
    } else if lower.contains("timeout") || lower.contains("timed out") {
        ErrorType::Timeout
    } else if lower.contains("connection") || lower.contains("network") {
        ErrorType::NetworkError
    } else if lower.contains("parsing")
        || lower.contains("format")
        || lower.contains("not found in output")
    {
        // Parsing errors are permanent - keep retrying until max_retries
        ErrorType::Timeout
    } else {
        ErrorType::Permanent
    }
}

/// Calculate exponential backoff duration
///
/// Formula: base_ms * multiplier^(attempt - 1)
/// Example with base=500ms, multiplier=2.0:
/// - Attempt 1: 500ms
/// - Attempt 2: 1000ms
/// - Attempt 3: 2000ms
/// - Attempt 4: 4000ms
/// - Attempt 5: 8000ms
pub fn calculate_backoff(attempt: u32, config: &HealthPollingConfig) -> Duration {
    if attempt == 0 {
        return Duration::from_millis(0);
    }

    let base_ms = config.retry_backoff_ms as f64;
    let multiplier = config.retry_backoff_multiplier;
    let exponent = (attempt - 1) as f64;

    let backoff_ms = base_ms * multiplier.powf(exponent);
    let capped_ms = backoff_ms.min(30000.0); // Cap at 30 seconds max

    Duration::from_millis(capped_ms as u64)
}

/// Poll device with automatic retry and exponential backoff
///
/// Generic retry wrapper for async operations with exponential backoff.
/// Attempts to execute async operation with retry logic:
/// 1. Try to execute operation
/// 2. On transient error, wait and retry up to max_retries times
/// 3. Emit polling-error event on each retry
/// 4. Return final error after max_retries exhausted
///
/// # Arguments
/// * `app_handle` - Tauri app handle for emitting events
/// * `device_id` - Device identifier for error reporting
/// * `config` - Health polling config with retry settings
/// * `operation` - Async closure that performs the actual operation
pub async fn poll_device_with_retry<F, T>(
    app_handle: &tauri::AppHandle,
    device_id: &str,
    config: &HealthPollingConfig,
    operation: F,
) -> Result<T, String>
where
    F: Fn() -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<T, String>>>>,
{
    let max_attempts = config.max_retries;

    for attempt in 1..=max_attempts {
        // Try to execute operation
        match operation().await {
            Ok(result) => {
                // Success - return immediately
                return Ok(result);
            }
            Err(error) => {
                let error_type = classify_error(&error);
                let is_last_attempt = attempt >= max_attempts;
                let will_retry = !is_last_attempt && error_type != ErrorType::Permanent;

                // Emit error event for UI feedback (only if there will be a retry)
                if will_retry {
                    let event = PollingErrorEvent {
                        device_id: device_id.to_string(),
                        error: ErrorInfo {
                            code: format!("{:?}", error_type),
                            message: error.clone(),
                        },
                        attempt,
                        max_attempts,
                        next_retry_at: None, // Would be calculated backoff time if needed
                        will_retry: true,
                    };

                    let _ = app_handle.emit("polling-error", event);
                }

                // If this was the last attempt or error is permanent, return error
                if is_last_attempt || error_type == ErrorType::Permanent {
                    return Err(format!("Failed after {} attempts: {}", attempt, error));
                }

                // Calculate backoff and wait before retry
                let backoff = calculate_backoff(attempt, config);
                tokio::time::sleep(backoff).await;
            }
        }
    }

    Err(format!(
        "Failed to complete operation after {} retries",
        max_attempts
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_backoff_exponential() {
        let config = HealthPollingConfig {
            retry_backoff_ms: 500,
            retry_backoff_multiplier: 2.0,
            ..Default::default()
        };

        // Attempt 1: 500ms
        assert_eq!(calculate_backoff(1, &config), Duration::from_millis(500));

        // Attempt 2: 1000ms
        assert_eq!(calculate_backoff(2, &config), Duration::from_millis(1000));

        // Attempt 3: 2000ms
        assert_eq!(calculate_backoff(3, &config), Duration::from_millis(2000));

        // Attempt 4: 4000ms
        assert_eq!(calculate_backoff(4, &config), Duration::from_millis(4000));

        // Attempt 5: 8000ms
        assert_eq!(calculate_backoff(5, &config), Duration::from_millis(8000));
    }

    #[test]
    fn test_calculate_backoff_zero_attempt() {
        let config = HealthPollingConfig::default();
        assert_eq!(calculate_backoff(0, &config), Duration::from_millis(0));
    }

    #[test]
    fn test_classify_offline_error() {
        assert_eq!(classify_error("Device not found"), ErrorType::Offline);
        assert_eq!(classify_error("offline"), ErrorType::Offline);
    }

    #[test]
    fn test_classify_timeout_error() {
        assert_eq!(classify_error("timeout"), ErrorType::Timeout);
        assert_eq!(classify_error("Command timed out"), ErrorType::Timeout);
    }

    #[test]
    fn test_classify_network_error() {
        assert_eq!(
            classify_error("connection refused"),
            ErrorType::NetworkError
        );
        assert_eq!(classify_error("network error"), ErrorType::NetworkError);
    }

    /// Test exponential backoff calculation with multiple attempts
    /// Corresponds to Task T067
    #[test]
    fn test_exponential_backoff_calculation() {
        let config = HealthPollingConfig {
            retry_backoff_ms: 500,
            retry_backoff_multiplier: 2.0,
            max_retries: 5,
            ..Default::default()
        };

        // Verify 500ms, 1s, 2s, 4s, 8s progression
        assert_eq!(calculate_backoff(1, &config), Duration::from_millis(500));
        assert_eq!(calculate_backoff(2, &config), Duration::from_millis(1000));
        assert_eq!(calculate_backoff(3, &config), Duration::from_millis(2000));
        assert_eq!(calculate_backoff(4, &config), Duration::from_millis(4000));
        assert_eq!(calculate_backoff(5, &config), Duration::from_millis(8000));
    }

    /// Test that backoff is capped at maximum duration
    #[test]
    fn test_backoff_capped_at_30_seconds() {
        let config = HealthPollingConfig {
            retry_backoff_ms: 500,
            retry_backoff_multiplier: 2.0,
            max_retries: 10,
            ..Default::default()
        };

        // Attempt 10: 500 * 2^9 = 256000ms = 256s, should be capped at 30s
        let backoff = calculate_backoff(10, &config);
        assert!(
            backoff <= Duration::from_millis(30000),
            "Backoff should be capped at 30 seconds, got {:?}",
            backoff
        );
    }

    /// Test retry logic with custom backoff parameters
    /// Corresponds to part of Task T068-T069
    #[test]
    fn test_custom_backoff_parameters() {
        let config = HealthPollingConfig {
            retry_backoff_ms: 1000,
            retry_backoff_multiplier: 1.5,
            max_retries: 4,
            ..Default::default()
        };

        // With 1.5x multiplier:
        // Attempt 1: 1000ms
        // Attempt 2: 1500ms
        // Attempt 3: 2250ms
        // Attempt 4: 3375ms

        assert_eq!(calculate_backoff(1, &config), Duration::from_millis(1000));
        assert_eq!(calculate_backoff(2, &config), Duration::from_millis(1500));
        assert_eq!(calculate_backoff(3, &config), Duration::from_millis(2250));
        assert_eq!(calculate_backoff(4, &config), Duration::from_millis(3375));
    }

    /// Test error classification for retry logic
    /// Part of Task T067-T069
    #[test]
    fn test_error_classification_for_retries() {
        // Transient errors should be retried
        assert_eq!(classify_error("offline"), ErrorType::Offline);
        assert_eq!(classify_error("device not found"), ErrorType::Offline);
        assert_eq!(classify_error("timeout"), ErrorType::Timeout);
        assert_eq!(
            classify_error("connection refused"),
            ErrorType::NetworkError
        );

        // Parsing errors are treated as timeout (transient)
        assert_eq!(classify_error("parsing error"), ErrorType::Timeout);
        assert_eq!(classify_error("format error"), ErrorType::Timeout);

        // Permanent errors should not be retried
        assert_eq!(classify_error("permission denied"), ErrorType::Permanent);
        assert_eq!(classify_error("invalid argument"), ErrorType::Permanent);
    }
}
