import { useState, useCallback, useRef, useEffect } from "react";
import type { Device } from "../types/device";
import type { DeviceSettings } from "../types/settings";
import { buildArgs, formatCommandDisplay } from "../utils/command-builder";
import CommandPreview from "./CommandPreview";
import DisplayPanel from "./settings-panels/DisplayPanel";
import WindowPanel from "./settings-panels/WindowPanel";
import BehaviorPanel from "./settings-panels/BehaviorPanel";
import RecordingPanel from "./settings-panels/RecordingPanel";
import PerformancePanel from "./settings-panels/PerformancePanel";
import NetworkPanel from "./settings-panels/NetworkPanel";
import InputControlPanel from "./settings-panels/InputControlPanel";
import AudioPanel from "./settings-panels/AudioPanel";
import VideoSourcePanel from "./settings-panels/VideoSourcePanel";
import V4L2Panel from "./settings-panels/V4L2Panel";
import VirtualDisplayPanel from "./settings-panels/VirtualDisplayPanel";
import { isLinux } from "../utils/platform";

interface DeviceSettingsModalProps {
  device: Device | undefined;
  serial: string;
  settings: DeviceSettings;
  canUhidInput?: boolean;
  canAudio?: boolean;
  canNoVideo?: boolean;
  canCamera?: boolean;
  canGamepad?: boolean;
  canVirtualDisplay?: boolean;
  onSettingsChange: (updates: Partial<DeviceSettings>) => void;
  onClose: () => void;
  onLaunch: () => void;
  onSave?: (settings: DeviceSettings) => void;
}

export default function DeviceSettingsModal({
  device,
  serial,
  settings,
  canUhidInput = false,
  canAudio = false,
  canNoVideo = false,
  canCamera = false,
  canGamepad = false,
  canVirtualDisplay = false,
  onSettingsChange,
  onClose,
  onLaunch,
  onSave,
}: DeviceSettingsModalProps) {
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());
  const [editableName, setEditableName] = useState(settings.name || "");
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Initialize wireless connection info from serial when modal opens
  // Sync with serial to ensure UI shows the actual current connection
  // Only depends on serial/device changes, not settings, to allow user editing
  useEffect(() => {
    if (device?.is_wireless && serial.includes(":")) {
      const parts = serial.split(":");
      if (parts.length === 2) {
        const ip = parts[0];
        const port = parseInt(parts[1], 10);
        if (!isNaN(port)) {
          onSettingsChange({ ipAddress: ip, port });
        }
      }
    }
  }, [device?.is_wireless, serial, onSettingsChange]);

  const handleClose = useCallback(() => {
    onSave?.(settings);
    onClose();
  }, [onSave, onClose, settings]);

  useEffect(() => {
    triggerRef.current = document.activeElement;
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
    return () => {
      (triggerRef.current as HTMLElement)?.focus?.();
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [handleClose],
  );

  const togglePanel = useCallback(
    (panel: string) => {
      setExpandedPanels((prev) => {
        const next = new Set(prev);
        if (next.has(panel)) {
          next.delete(panel);
        } else {
          next.add(panel);
        }
        return next;
      });
    },
    [],
  );

  // Calculate the effective serial that will be used (accounting for IP/Port changes)
  const effectiveSerial = (() => {
    if (!device?.is_wireless || !settings.ipAddress || !settings.port) {
      return serial;
    }
    
    const currentParts = serial.split(":");
    if (currentParts.length !== 2) {
      return serial;
    }
    
    const currentIp = currentParts[0];
    const currentPort = parseInt(currentParts[1], 10);
    const newIp = settings.ipAddress.trim();
    const newPort = settings.port;
    
    // If IP/Port have changed, return the new serial
    if (newIp && (newIp !== currentIp || newPort !== currentPort)) {
      return `${newIp}:${newPort}`;
    }
    
    return serial;
  })();

  const generatedCommand = formatCommandDisplay(buildArgs(effectiveSerial, settings));

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-settings-title"
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <div>
            <div className="device-name-section">
              <input
                type="text"
                id="device-settings-title"
                placeholder="Device name"
                value={editableName}
                onChange={(e) => {
                  setEditableName(e.target.value);
                  onSettingsChange({ name: e.target.value });
                }}
                className="device-name-input"
                aria-label="Device name"
              />
            </div>
            {device?.is_wireless ? (
              <div className="modal-device-meta">
                <div className="wireless-connection-inline">
                  <label>
                    <span>IP:</span>
                    <input
                      type="text"
                      placeholder="192.168.1.100"
                      value={settings.ipAddress || ""}
                      onChange={(e) => onSettingsChange({ ipAddress: e.target.value })}
                      className="wireless-inline-input"
                      aria-label="Device IP address"
                    />
                  </label>
                  <label>
                    <span>Port:</span>
                    <input
                      type="number"
                      min="1"
                      max="65535"
                      value={settings.port || 5555}
                      onChange={(e) => {
                        const newPort = parseInt(e.target.value, 10);
                        if (!isNaN(newPort)) {
                          onSettingsChange({ port: newPort });
                        }
                      }}
                      className="wireless-inline-input port-input"
                      aria-label="Connection port"
                    />
                  </label>
                  <span className="separator">•</span>
                  <span className="android-version">Android {device?.android_version || "Unknown"}</span>
                </div>
              </div>
            ) : (
              <p className="modal-device-meta">
                USB • Android {device?.android_version || "Unknown"}
              </p>
            )}
          </div>
          <div className="modal-header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => navigator.clipboard.writeText(generatedCommand)}
            >
              Copy Command
            </button>
            <button
              className="btn btn-primary"
              onClick={onLaunch}
            >
              Launch Mirroring
            </button>
            <button
              className="modal-close"
              onClick={handleClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
        <div className="modal-body">
          <VideoSourcePanel
            settings={settings}
            onSettingsChange={onSettingsChange}
            expanded={expandedPanels.has("videosource")}
            onToggle={() => togglePanel("videosource")}
            canCamera={canCamera}
          />
          <DisplayPanel
            settings={settings}
            onSettingsChange={onSettingsChange}
            expanded={expandedPanels.has("display")}
            onToggle={() => togglePanel("display")}
          />
          <WindowPanel
            settings={settings}
            onSettingsChange={onSettingsChange}
            expanded={expandedPanels.has("window")}
            onToggle={() => togglePanel("window")}
          />
          <BehaviorPanel
            settings={settings}
            onSettingsChange={onSettingsChange}
            expanded={expandedPanels.has("behavior")}
            onToggle={() => togglePanel("behavior")}
          />
          <InputControlPanel
            settings={settings}
            onSettingsChange={onSettingsChange}
            expanded={expandedPanels.has("input")}
            onToggle={() => togglePanel("input")}
            canUhidInput={canUhidInput}
            canGamepad={canGamepad}
          />
          <AudioPanel
            settings={settings}
            onSettingsChange={onSettingsChange}
            expanded={expandedPanels.has("audio")}
            onToggle={() => togglePanel("audio")}
            canAudio={canAudio}
            canNoVideo={canNoVideo}
          />
          <RecordingPanel
            settings={settings}
            onSettingsChange={onSettingsChange}
            expanded={expandedPanels.has("recording")}
            onToggle={() => togglePanel("recording")}
          />
          <PerformancePanel
            settings={settings}
            onSettingsChange={onSettingsChange}
            expanded={expandedPanels.has("performance")}
            onToggle={() => togglePanel("performance")}
          />
          <VirtualDisplayPanel
            settings={settings}
            onSettingsChange={onSettingsChange}
            expanded={expandedPanels.has("virtualdisplay")}
            onToggle={() => togglePanel("virtualdisplay")}
            canVirtualDisplay={canVirtualDisplay}
          />
          {isLinux && (
            <V4L2Panel
              settings={settings}
              onSettingsChange={onSettingsChange}
              expanded={expandedPanels.has("v4l2")}
              onToggle={() => togglePanel("v4l2")}
            />
          )}
          <NetworkPanel
            settings={settings}
            onSettingsChange={onSettingsChange}
            expanded={expandedPanels.has("network")}
            onToggle={() => togglePanel("network")}
          />
          <CommandPreview command={generatedCommand} />
        </div>
      </div>
    </div>
  );
}
