import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";
import type { Dependencies } from "../types/device";
import type { Tab } from "../types/settings";

// Mock heroicons — render simple spans
vi.mock("@heroicons/react/24/outline", () => ({
  DevicePhoneMobileIcon: (props: Record<string, unknown>) => <span data-testid="device-icon" {...props} />,
  DocumentTextIcon: (props: Record<string, unknown>) => <span data-testid="doc-icon" {...props} />,
  Bars3Icon: (props: Record<string, unknown>) => <span data-testid="bars-icon" {...props} />,
  AdjustmentsHorizontalIcon: (props: Record<string, unknown>) => <span data-testid="adjust-icon" {...props} />,
  ArrowPathIcon: (props: Record<string, unknown>) => <span data-testid="arrow-icon" {...props} />,
}));

vi.mock("@heroicons/react/24/solid", () => ({
  CheckCircleIcon: (props: Record<string, unknown>) => <span data-testid="check-circle-icon" {...props} />,
  XCircleIcon: (props: Record<string, unknown>) => <span data-testid="x-circle-icon" {...props} />,
}));

describe("Sidebar", () => {
  const defaultProps = {
    currentTab: "devices" as Tab,
    onTabChange: vi.fn(),
    dependencies: { adb: true, scrcpy: true } as Dependencies,
    onRefreshDeps: vi.fn(),
    connectedCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all tab buttons", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Devices")).toBeInTheDocument();
    expect(screen.getByText("Presets")).toBeInTheDocument();
    expect(screen.getByText("Logs")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("highlights the active tab", () => {
    render(<Sidebar {...defaultProps} currentTab="logs" />);
    const logsButton = screen.getByText("Logs").closest("button");
    expect(logsButton?.className).toContain("active");

    const devicesButton = screen.getByText("Devices").closest("button");
    expect(devicesButton?.className).not.toContain("active");
  });

  it("calls onTabChange when a tab is clicked", () => {
    render(<Sidebar {...defaultProps} />);
    fireEvent.click(screen.getByText("Presets"));
    expect(defaultProps.onTabChange).toHaveBeenCalledWith("presets");
  });

  it("shows dependency status when both available", () => {
    render(<Sidebar {...defaultProps} />);
    // Both should show as "ready" badges with check icons
    const adbBadge = screen.getByText("ADB").closest("span");
    const scrcpyBadge = screen.getByText("Scrcpy").closest("span");
    expect(adbBadge?.className).toContain("ready");
    expect(scrcpyBadge?.className).toContain("ready");
    expect(screen.getAllByTestId("check-circle-icon")).toHaveLength(2);
  });

  it("shows error badges when dependencies are missing", () => {
    render(
      <Sidebar
        {...defaultProps}
        dependencies={{ adb: false, scrcpy: false }}
      />,
    );
    const adbBadge = screen.getByText("ADB").closest("span");
    const scrcpyBadge = screen.getByText("Scrcpy").closest("span");
    expect(adbBadge?.className).toContain("not-ready");
    expect(scrcpyBadge?.className).toContain("not-ready");
    expect(screen.getAllByTestId("x-circle-icon")).toHaveLength(2);
  });

  it("handles null dependencies gracefully", () => {
    render(<Sidebar {...defaultProps} dependencies={null} />);
    const badges = screen.getAllByTestId("x-circle-icon");
    expect(badges).toHaveLength(2);
  });

  it("calls onRefreshDeps when refresh button is clicked", () => {
    render(<Sidebar {...defaultProps} />);
    const refreshButton = screen.getByTitle("Refresh dependency status");
    fireEvent.click(refreshButton);
    expect(defaultProps.onRefreshDeps).toHaveBeenCalledTimes(1);
  });

  it("displays the app title", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Scrcpy GUI")).toBeInTheDocument();
  });
});
