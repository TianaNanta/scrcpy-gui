import { useState, useEffect } from "react";
import {
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  Bars3Icon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import type { Dependencies } from "../types/device";

export type Tab = "devices" | "presets" | "logs" | "settings";

const tabs: {
  id: Tab;
  name: string;
  icon: React.ElementType;
}[] = [
  { id: "devices", name: "Devices", icon: DevicePhoneMobileIcon },
  { id: "presets", name: "Presets", icon: DocumentTextIcon },
  { id: "logs", name: "Logs", icon: Bars3Icon },
  { id: "settings", name: "Settings", icon: AdjustmentsHorizontalIcon },
];

interface SidebarProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  dependencies: Dependencies | null;
  onRefreshDeps: () => void;
  connectedCount: number;
}

export default function Sidebar({
  currentTab,
  onTabChange,
  dependencies,
  onRefreshDeps,
  connectedCount,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === "ArrowDown") {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowUp") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    onTabChange(tabs[nextIndex].id);
    const buttons = (
      e.currentTarget.parentElement as HTMLElement
    )?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[nextIndex]?.focus();
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <DevicePhoneMobileIcon className="sidebar-logo" />
        <div className={`sidebar-title ${isCollapsed ? "hidden" : ""}`}>
          <h2>Scrcpy GUI</h2>
          <span className="sidebar-version">v0.6.0</span>
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="sidebar-toggle-icon" />
          ) : (
            <ChevronLeftIcon className="sidebar-toggle-icon" />
          )}
        </button>
      </div>
      <nav className="sidebar-nav" role="tablist" aria-label="Main navigation">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`sidebar-tab ${currentTab === tab.id ? "active" : ""}`}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              role="tab"
              aria-selected={currentTab === tab.id}
              tabIndex={currentTab === tab.id ? 0 : -1}
              title={isCollapsed ? tab.name : undefined}
            >
              <Icon className="sidebar-icon" />
              <span className={isCollapsed ? "hidden" : ""}>{tab.name}</span>
              {tab.id === "devices" && connectedCount > 0 && !isCollapsed && (
                <span className="sidebar-badge">{connectedCount}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className={`dependency-status ${isCollapsed ? "hidden" : ""}`}>
          <div className="dependency-item">
            <span
              className={`dep-badge ${dependencies?.adb ? "ready" : "not-ready"}`}
            >
              {dependencies?.adb ? <CheckCircleIcon /> : <XCircleIcon />}
              ADB
            </span>
          </div>
          <div className="dependency-item">
            <span
              className={`dep-badge ${dependencies?.scrcpy ? "ready" : "not-ready"}`}
            >
              {dependencies?.scrcpy ? <CheckCircleIcon /> : <XCircleIcon />}
              Scrcpy
            </span>
          </div>
        </div>
        <button
          className="btn btn-secondary refresh-btn"
          onClick={onRefreshDeps}
          title="Refresh dependency status"
          aria-label="Refresh dependency status"
        >
          <ArrowPathIcon className="btn-icon" />
        </button>
      </div>
    </aside>
  );
}
