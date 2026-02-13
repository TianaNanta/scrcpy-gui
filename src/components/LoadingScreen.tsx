/**
 * LoadingScreen Component
 *
 * Displays during app initialization while devices and dependencies are loading.
 * Shows a centered loading indicator with status message.
 *
 * @component
 */

import React from "react";
import "../styles/loading-screen.css";

interface LoadingScreenProps {
  /** Optional status message to display below spinner */
  message?: string;
}

export function LoadingScreen({
  message = "Initializing scrcpy GUI...",
}: LoadingScreenProps): React.ReactElement {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
