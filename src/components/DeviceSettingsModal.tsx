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
  deviceName: string;
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
  deviceName,
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
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

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

  const generatedCommand = formatCommandDisplay(buildArgs(serial, settings));

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
            <h3 id="device-settings-title">
              {deviceName || device?.model || serial}
            </h3>
            <p className="modal-device-meta">
              {device?.is_wireless ? serial : "USB"} • Android{" "}
              {device?.android_version || "Unknown"}
            </p>
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
