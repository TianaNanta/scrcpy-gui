import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LogViewer from "./LogViewer";
import type { LogEntry } from "../types/settings";

// Mock heroicons
vi.mock("@heroicons/react/24/outline", () => ({
  Bars3Icon: (props: Record<string, unknown>) => (
    <span data-testid="bars-icon" {...props} />
  ),
}));

describe("LogViewer", () => {
  it("renders the Logs header", () => {
    render(<LogViewer logs={[]} />);
    expect(screen.getByText("Logs")).toBeInTheDocument();
  });

  it("renders log entries with timestamp, level, and message", () => {
    const logs: LogEntry[] = [
      {
        timestamp: "2026-02-11T10:00:00.000Z",
        level: "INFO",
        message: "Started scrcpy",
      },
      {
        timestamp: "2026-02-11T10:01:00.000Z",
        level: "ERROR",
        message: "Connection lost",
      },
    ];
    render(<LogViewer logs={logs} />);

    expect(screen.getByText("INFO")).toBeInTheDocument();
    expect(screen.getByText("ERROR")).toBeInTheDocument();
    expect(screen.getByText("Started scrcpy")).toBeInTheDocument();
    expect(screen.getByText("Connection lost")).toBeInTheDocument();
  });

  it("applies correct CSS class based on log level", () => {
    const logs: LogEntry[] = [
      {
        timestamp: "2026-02-11T10:00:00.000Z",
        level: "ERROR",
        message: "fail",
      },
    ];
    const { container } = render(<LogViewer logs={logs} />);
    const errorEntry = container.querySelector(".log-error");
    expect(errorEntry).toBeTruthy();
  });

  it("renders empty when no logs", () => {
    const { container } = render(<LogViewer logs={[]} />);
    const entries = container.querySelectorAll(".log-entry");
    expect(entries).toHaveLength(0);
  });

  it("renders multiple log entries in order", () => {
    const logs: LogEntry[] = [
      {
        timestamp: "2026-02-11T10:00:00.000Z",
        level: "INFO",
        message: "First",
      },
      {
        timestamp: "2026-02-11T10:01:00.000Z",
        level: "INFO",
        message: "Second",
      },
      {
        timestamp: "2026-02-11T10:02:00.000Z",
        level: "SUCCESS",
        message: "Third",
      },
    ];
    render(<LogViewer logs={logs} />);

    const messages = screen.getAllByText(/First|Second|Third/);
    expect(messages).toHaveLength(3);
    expect(messages[0].textContent).toBe("First");
    expect(messages[1].textContent).toBe("Second");
    expect(messages[2].textContent).toBe("Third");
  });
});
