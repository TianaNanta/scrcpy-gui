import { useState, useCallback, useRef, useEffect } from "react";
import type { Device } from "../types/device";
import type { DeviceSettings } from "../types/settings";
import { buildCommandPreview } from "../utils/command-builder";
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
}: DeviceSettingsModalProps) {
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

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
        onClose();
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
    [onClose],
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

  const generatedCommand = buildCommandPreview(serial, settings);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-settings-title"
        onKeyDown={handleKeyDown}
        style={{
          backgroundColor: "#0f0f14",
          color: "white",
          maxWidth: "800px",
          width: "90%",
        }}
      >
        <div
          className="modal-header"
          style={{
            backgroundColor: "#0f0f14",
            color: "white",
            padding: "1.5rem",
            borderBottom: "1px solid #333",
          }}
        >
          <div>
            <h3 id="device-settings-title" style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold" }}>
              {deviceName || device?.model || serial}
            </h3>
            <p style={{ margin: "0.5rem 0", color: "#b0b0b0", fontSize: "0.9rem" }}>
              {device?.is_wireless ? serial : "USB"} • Android{" "}
              {device?.android_version || "Unknown"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigator.clipboard.writeText(generatedCommand)}
              style={{ backgroundColor: "#333", color: "white", border: "1px solid #555" }}
            >
              Copy Command
            </button>
            <button
              className="btn btn-primary"
              onClick={onLaunch}
              style={{ backgroundColor: "#007bff", color: "white" }}
            >
              Launch Mirroring
            </button>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close"
              style={{
                color: "white",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        </div>
        <div
          className="modal-body"
          style={{ backgroundColor: "#0f0f14", color: "white", padding: "1.5rem" }}
        >
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
